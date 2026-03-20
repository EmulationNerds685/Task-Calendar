import Task from "../models/Task.js";
import autoSchedule from "../utils/autoScheduler.js";

/*
 Create Task (Admin only)
*/
export const createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      createdBy: req.user.id
    };

    const task = await Task.create(taskData);

    // call auto scheduler after task creation
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

    if (req.user.role === "member") {
      filter.assignedTo = req.user.id;
    }

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

    // Members can only view their own tasks
    if (req.user.role === "member" && task.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task", error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // MEMBER: can only update status on their own task
if (req.user.role === "member") {
  if (task.assignedTo.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not allowed to update this task" });
  }

  // Members can update status, description, and estimated time on their own tasks
  const allowedFields = ["status", "description", "estimatedTime"];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  await task.save();
  return res.status(200).json(task);
}

 // ADMIN: can update any field
Object.assign(task, req.body);
await task.save();

const rescheduleTriggers = ["priority", "dueDate"];
const needsReschedule = rescheduleTriggers.some(f => req.body[f] !== undefined);
if (needsReschedule) {
  try {
    await autoSchedule(task);
  } catch (scheduleErr) {
    console.error("Reschedule failed:", scheduleErr.message);
    // task was saved successfully, don't fail the whole request
  }
}

res.status(200).json(task);
  
  } catch (error) {
    res.status(500).json({ message: "Failed to update task", error: error.message });
  }
};
/*
 Delete Task (Admin only)
*/
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task", error: error.message });
  }
};