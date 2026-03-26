import Task from "../models/Task.js";
import CalendarEvent from "../models/CalendarEvent.js";
import autoSchedule from "../utils/autoScheduler.js";

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
    await autoSchedule(task);

    res.status(201).json(task);
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

    // All roles can see all tasks; filter by assignedTo if provided
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    if (dueDateFrom || dueDateTo) {
      filter.dueDate = {};
      if (dueDateFrom) filter.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) filter.dueDate.$lte = new Date(dueDateTo);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(filter)
    ]);

    res.status(200).json({
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
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

    // All roles can view any task
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

      // Members can update status, description, estimatedTime, and attachments on their own tasks
      const allowedFields = ["status", "description", "estimatedTime", "attachments"];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) task[field] = req.body[field];
      });

      await task.save();

      // If estimatedTime changed, refresh the calendar slot duration
      const timeChanged = req.body.estimatedTime !== undefined && Number(req.body.estimatedTime) !== task.estimatedTime;
      if (timeChanged) {
        try {
          // Note: Members don't change dueDate, so we just refresh for the new duration
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

    const needsReschedule = priorityChanged || dueDateChanged || estimatedTimeChanged || assignedToChanged;

    Object.assign(task, body);
    await task.save();
    
    if (needsReschedule) {
      try {
        await CalendarEvent.deleteMany({ task: task._id });
        await autoSchedule(task);
      } catch (scheduleErr) {
        console.error("[updateTask] admin reschedule failed (swallowed):", scheduleErr.message);
      }
    }

    res.status(200).json(task);
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