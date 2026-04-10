import express from "express";
import { getCalendarEvents } from "../controller/calendarController.js";
import { verifyToken,checkRole } from "../middleware/authMiddleware.js";
import CalendarEvent from "../models/CalendarEvent.js";
import Task from "../models/Task.js";
const router = express.Router();

router.get("/", verifyToken, getCalendarEvents);
router.patch("/:eventId", verifyToken, async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id || req.params.eventId).populate("task");
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Permissions: Admin or any member assigned to the task
    const isAdmin = req.user.role === "admin";
    const assignees = (event.task?.assignedTo || []).map(id => id.toString());
    const isAssigned = assignees.includes(req.user.id);

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: "Forbidden. Not allowed to reschedule this task." });
    }

    const updateFields = {
      date:      req.body.date,
      startTime: req.body.startTime,
      endTime:   req.body.endTime,
    };

    // UPDATE ALL associated events for this task at this specific time slot
    await CalendarEvent.updateMany(
      { task: event.task._id, date: event.date, startTime: event.startTime },
      updateFields
    );

    // Keep task dates in sync 
    await Task.findByIdAndUpdate(event.task._id, { scheduledDate: req.body.date, startDate: req.body.date });

    const updatedEvent = await CalendarEvent.findById(req.params.eventId);
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: "Failed to update event", error: error.message });
  }
});
export default router;