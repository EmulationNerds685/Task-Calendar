import Task from "../models/Task.js";
import CalendarEvent from "../models/CalendarEvent.js";
import autoSchedule from "../utils/autoScheduler.js";
import { createNotifications } from "./notificationController.js";

/*
 Share a task with additional users.
 Any assigned member (or admin) can share.
 POST /tasks/:id/share  { userIds: [string] }
*/
export const shareTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Members can only share tasks they are assigned to
    if (req.user.role === "member") {
      const assignedIds = task.assignedTo.map(id => id.toString());
      if (!assignedIds.includes(req.user.id)) {
        return res.status(403).json({ message: "You can only share tasks assigned to you" });
      }
    }

    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Please provide an array of userIds to share with" });
    }

    // Add new assignees (no duplicates)
    const existing = new Set(task.assignedTo.map(id => id.toString()));
    const newIds = userIds.filter(id => !existing.has(id));

    if (newIds.length === 0) {
      return res.status(200).json({ message: "Task is already shared with all specified users", task });
    }

    task.assignedTo.push(...newIds);
    await task.save();

    // Notify the newly added members
    createNotifications({
      recipientIds: newIds,
      actorId:      req.user.id,
      type:         "task_shared",
      taskId:       task._id,
      message:      `A task was shared with you: "${task.title}"`
    }).catch(e => console.error("[notify] share failed:", e.message));

    // Create calendar events for newly added assignees
    try {
      await CalendarEvent.deleteMany({ task: task._id });
      await autoSchedule(task);
    } catch (scheduleErr) {
      console.error("Share reschedule failed:", scheduleErr.message);
    }

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Failed to share task", error: error.message });
  }
};
