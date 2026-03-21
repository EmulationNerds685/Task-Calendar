import CalendarEvent from "../models/CalendarEvent.js";

/*
 Get calendar events
*/
export const getCalendarEvents = async (req, res) => {
  try {
    const { startDate, endDate, user } = req.query;

    const filter = {};

    // Role based filtering
    if (req.user.role === "admin") {
      if (user) filter.user = user;
    } else {
      filter.user = req.user.id;
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
        select: "title priority category status"
      })
      .populate({
        path: "user",
        select: "name email"
      })
      .sort({ date: 1, startTime: 1 });

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch calendar events",
      error: error.message
    });
  }
};