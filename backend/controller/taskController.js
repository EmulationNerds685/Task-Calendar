import Task from "../models/Task.js";
import CalendarEvent from "../models/CalendarEvent.js";
import autoSchedule, { calculateTaskSchedule } from "../utils/autoScheduler.js";
import dayjs from "dayjs";
import { createNotifications } from "./notificationController.js";

/**
 * Check for scheduling conflicts (overlapping CalendarEvents)
 */
async function checkConflicts(userIds, startDate, endDate, excludeTaskId = null) {
  if (!startDate || !endDate) return null;
  
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);
  
  // If single day, extend end to next day to catch same-day events
  if (start.getTime() === end.getTime()) {
    end.setUTCDate(end.getUTCDate() + 1);
  } else {
    // inclusive of the end day
    end.setUTCDate(end.getUTCDate() + 1);
  }

  const filter = {
    user: { $in: userIds },
    $or: [
      { date: { $lt: end }, endDate: { $gte: start } },
    ]
  };
  
  if (excludeTaskId) {
    filter.task = { $ne: excludeTaskId };
  }
  
  const existingEvents = await CalendarEvent.find(filter).populate("task", "title");
  if (existingEvents.length > 0) {
    const conflict = existingEvents[0];
    return `Potential conflict: "${conflict.task?.title}" already exists for this time slot.`;
  }
  return null;
}

/*
 Create Task
 FIX: Members can now create tasks. They are automatically assigned to themselves
 unless they explicitly supply assignedTo (admins may assign to anyone).
*/
export const createTask = async (req, res) => {
  try {
    const body = { ...req.body, createdBy: req.user.id };

    // Normalise assignedTo → always an array
    if (body.assignedTo && !Array.isArray(body.assignedTo)) {
      body.assignedTo = [body.assignedTo];
    }

    // NEW: Prevent past deadlines
    if (body.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(body.dueDate) < today) {
        return res.status(400).json({ message: "Deadline cannot be in the past" });
      }
    }

    // FIX (members create): as member, always ensure they are included in assignedTo
    if (req.user.role === "member") {
      const currentAssignees = body.assignedTo || [];
      if (!currentAssignees.includes(req.user.id)) {
        body.assignedTo = [...currentAssignees, req.user.id];
      }
    }

    // Parse referenceLinks if sent as a raw string
    if (body.referenceLinks && typeof body.referenceLinks === "string") {
      body.referenceLinks = body.referenceLinks
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(Boolean);
    }

    // NEW: attachments is expected as an array of objects [{name, url, fileType}]
    if (body.attachments && !Array.isArray(body.attachments)) {
      body.attachments = [body.attachments];
    }

    const task = await Task.create(body);
    const rebalancedTasks = await autoSchedule(task);

    // Filter to find if ANY task (new or shifted) is now past its deadline
    const violatingTask = rebalancedTasks.find(t => {
      const scheduled = dayjs(t.scheduledDate).startOf("day");
      const due = dayjs(t.dueDate).startOf("day");
      return scheduled.isAfter(due); // Broadened search
    });

    const deadlineWarning = violatingTask 
      ? `One or more tasks (e.g., "${violatingTask.title}") shifted past their deadline.`
      : null;

    // Notify all assignees that a task was created for them
    if (task.assignedTo && task.assignedTo.length > 0) {
      createNotifications({
        recipientIds: task.assignedTo,
        actorId:      req.user.id,
        type:         "task_assigned",
        taskId:       task._id,
        message:      `You were assigned to "${task.title}"`
      }).catch(e => console.error("[notify] create failed:", e.message));
    }

    res.status(201).json({ ...task.toObject(), deadlineWarning });
  } catch (error) {
    res.status(500).json({ message: "Failed to create task", error: error.message });
  }
};

/*
 Get Tasks with Filters
*/
export const getTasks = async (req, res) => {
  try {
    const {
      assignedTo,
      status,
      priority,
      category,
      dueDateFrom,
      dueDateTo,
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};
    if (req.user.role !== "admin") {
      filter.$or = [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ];
    }

    // Existing filters are now merged into the main filter object
    const andConditions = [];
    if (assignedTo) andConditions.push({ assignedTo });
    if (status) andConditions.push({ status });
    if (priority) andConditions.push({ priority });
    if (category) andConditions.push({ category });

    if (andConditions.length > 0) {
      filter.$and = filter.$and ? [...filter.$and, ...andConditions] : andConditions;
    }

    if (dueDateFrom || dueDateTo) {
      filter.dueDate = {};
      if (dueDateFrom) filter.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) filter.dueDate.$lte = new Date(dueDateTo);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total, stats] = await Promise.all([
      Task.find(filter)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(filter),
      // NEW: Calculate global stats for badges (ignoring current dynamic filters, but respecting user visibility)
      (async () => {
        const statsFilter = {};
        if (req.user.role !== "admin") {
          statsFilter.$or = [
            { createdBy: req.user.id },
            { assignedTo: req.user.id }
          ];
        }

        const todayStart = dayjs().startOf("day").toDate();
        const todayEnd = dayjs().endOf("day").toDate();

        const [active, overdue, today, upcoming, completed] = await Promise.all([
          Task.countDocuments({ ...statsFilter, status: { $ne: "Completed" } }),
          Task.countDocuments({ ...statsFilter, status: "Overdue" }),
          Task.countDocuments({ ...statsFilter, dueDate: { $gte: todayStart, $lte: todayEnd } }),
          Task.countDocuments({ ...statsFilter, dueDate: { $gt: todayEnd }, status: { $ne: "Completed" } }),
          Task.countDocuments({ ...statsFilter, status: "Completed" })
        ]);

        return { active, overdue, today, upcoming, completed };
      })()
    ]);

    res.status(200).json({
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      stats // Return global stats for dashboard badges
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
};

/*
 Get Single Task
*/
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Visibility check: createdBy or assignedTo
    if (req.user.role !== "admin") {
      const assignedIds = task.assignedTo.map(id => (id._id || id).toString());
      const isCreator = task.createdBy.toString() === req.user.id.toString();
      const isAssigned = assignedIds.includes(req.user.id.toString());

      if (!isCreator && !isAssigned) {
        return res.status(403).json({ message: "Not allowed to view this task" });
      }
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task", error: error.message });
  }
};

/*
 Update Task
*/
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (req.user.role === "member") {
      // FIX: handle both raw ObjectId and populated objects safely
      const assignedIds = task.assignedTo.map(id => (id._id || id).toString());

      if (!assignedIds.includes(req.user.id.toString())) {
        return res.status(403).json({ message: "Not allowed to update this task" });
      }

      // Members can update status, description, estimatedTime, startDate, and attachments on their own tasks
      const allowedFields = ["status", "description", "estimatedTime", "attachments", "startDate"];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) task[field] = req.body[field];
      });

      await task.save();

      // If estimatedTime or dates changed, refresh the calendar slot
      const timeChanged = req.body.estimatedTime !== undefined && Number(req.body.estimatedTime) !== task.estimatedTime;
      const datesChanged = req.body.startDate !== undefined;
      if (timeChanged || datesChanged) {
        try {
          await CalendarEvent.deleteMany({ task: task._id });
          await autoSchedule(task);
        } catch (e) {
          console.error("[updateTask] member reschedule failed (swallowed):", e.message);
        }
      }

      return res.status(200).json(task);
    }

    // ADMIN: can update any field
    const body = { ...req.body };

    if (body.assignedTo && !Array.isArray(body.assignedTo)) {
      body.assignedTo = [body.assignedTo];
    }

    if (body.referenceLinks && typeof body.referenceLinks === "string") {
      body.referenceLinks = body.referenceLinks
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(Boolean);
    }

    // Pre-change detection: check if reschedule is needed BEFORE applying updates to the model
    const priorityChanged = req.body.priority !== undefined && String(req.body.priority) !== String(task.priority);
    const estimatedTimeChanged = req.body.estimatedTime !== undefined && Number(req.body.estimatedTime) !== task.estimatedTime;
    
    // Compare dates as YYYY-MM-DD to avoid timezone/time-of-day false positives
    const oldDateStr = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "";
    const newDateStr = req.body.dueDate ? new Date(req.body.dueDate).toISOString().split('T')[0] : "";
    const dueDateChanged = req.body.dueDate !== undefined && oldDateStr !== newDateStr;

    // Check if people assigned changed
    const oldAssignees = (task.assignedTo || []).map(id => (id._id || id).toString()).sort().join(",");
    const newAssignees = (req.body.assignedTo || []).map(id => id.toString()).sort().join(",");
    const assignedToChanged = req.body.assignedTo !== undefined && oldAssignees !== newAssignees;

    const needsReschedule = priorityChanged || dueDateChanged || estimatedTimeChanged || assignedToChanged ||
                            req.body.startDate !== undefined;

    // Notify newly added assignees
    if (assignedToChanged && req.body.assignedTo) {
      const oldSet = new Set((task.assignedTo || []).map(id => (id._id || id).toString()));
      const newlyAdded = (req.body.assignedTo || []).filter(id => !oldSet.has(id.toString()));
      if (newlyAdded.length > 0) {
        createNotifications({
          recipientIds: newlyAdded,
          actorId:      req.user.id,
          type:         "task_assigned",
          taskId:       task._id,
          message:      `You were assigned to "${task.title}"`
        }).catch(e => console.error("[notify] update-assign failed:", e.message));
      }
    }

    let deadlineWarning = null;

    if (needsReschedule) {
      try {
        Object.assign(task, body);
        await task.save(); // Save first so rebalanceSchedule(DB query) sees the new state
        const rebalancedTasks = await autoSchedule(task);

        // Check for violations
        const violatingTask = rebalancedTasks.find(t => {
          const scheduled = dayjs(t.scheduledDate).startOf("day");
          const due = dayjs(t.dueDate).startOf("day");
          return scheduled.isAfter(due); // In a real shift, any task might violate
        });

        if (violatingTask) {
          deadlineWarning = `Shifting pushed task "${violatingTask.title}" past its deadline.`;
        }
      } catch (scheduleErr) {
        console.error("[updateTask] admin reschedule failed (swallowed):", scheduleErr.message);
      }
    } else {
      Object.assign(task, body);
    }

    await task.save();

    res.status(200).json({ ...task.toObject(), deadlineWarning });
  } catch (error) {
    console.error("[updateTask] OUTER CATCH:", error.message, error.stack);
    res.status(500).json({ message: "Failed to update task", error: error.message });
  }
};

/*
 Delete Task (admin only at the route level)
 FIX: Cascade-deletes ALL CalendarEvents for this task BEFORE the task
 document is removed. This guarantees the calendar never shows "Untitled"
 events after a task is deleted from the dashboard.
*/
export const deleteTask = async (req, res) => {
  try {
    // Step 1: find the task first so we have its _id for the cascade
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Step 2: delete every CalendarEvent referencing this task
    const { deletedCount } = await CalendarEvent.deleteMany({ task: task._id });

    // Step 3: now delete the task itself
    await task.deleteOne();

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task", error: error.message });
  }
};