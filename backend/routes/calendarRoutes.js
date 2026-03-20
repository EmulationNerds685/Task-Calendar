import express from "express";
import { getCalendarEvents } from "../controller/calendarController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import CalendarEvent from "../models/CalendarEvent.js";
import Task from "../models/Task.js";
const router = express.Router();

router.get("/", verifyToken, getCalendarEvents);
router.patch("/:eventId", verifyToken, async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndUpdate(
      req.params.eventId,
      { date: req.body.date, startTime: req.body.startTime, endTime: req.body.endTime },
      { new: true }
    );
    if (!event) return res.status(404).json({ message: "Event not found" });
    await Task.findByIdAndUpdate(event.task, { scheduledDate: req.body.date });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Failed to update event", error: error.message });
  }
});
export default router;