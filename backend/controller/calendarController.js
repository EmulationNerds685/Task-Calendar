import CalendarEvent from "../models/CalendarEvent.js";

/*
 Get calendar events
*/
export const getCalendarEvents = async (req, res) => {
  try {
    const { startDate, endDate, user } = req.query;

    const filter = {};

    // Filter by user if explicitly requested, but all roles see all tasks by default
    if (user) {
      filter.user = user;
    }

    // Date filtering
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const events = await CalendarEvent.find(filter)
      .populate({
        path: "task",
        populate: {
          path: "assignedTo",
          select: "name email"
        }
      })
      .populate({
        path: "user",
        select: "name email"
      })
      .sort({ date: 1, startTime: 1 });

    // Deduplicate: if same task in same slot (date + startTime), only return once
    const seen = new Set();
    const uniqueEvents = events.filter(e => {
      const key = `${e.task?._id || e.task}-${new Date(e.date).getTime()}-${e.startTime}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.status(200).json(uniqueEvents);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch calendar events",
      error: error.message
    });
  }
};