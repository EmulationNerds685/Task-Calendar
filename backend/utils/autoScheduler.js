import CalendarEvent from "../models/CalendarEvent.js";

/*
 Auto-schedule a task based on priority, dueDate, and estimatedTime.

 Multi-user: creates one CalendarEvent per assigned member.
 Multi-day:  if estimatedTime exceeds the remaining hours in a work-day
             (measured from startTime to 18:00), the event endDate is
             pushed into subsequent days and the scheduledSlot reflects
             the full span, e.g. "09:00 – next day 11:00".
 Dynamic end time: end = start + estimatedTime (fallback 90 min).
*/
const autoSchedule = async (task) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let scheduledDate;
    // Normalise dueDate to midday UTC to avoid timezone flipping to previous day
    const taskDueDate = new Date(task.dueDate);
    taskDueDate.setUTCHours(12, 0, 0, 0);

    if (task.priority === "High") {
      // High priority: schedule on the dueDate itself
      scheduledDate = new Date(taskDueDate);
    } else if (task.priority === "Medium") {
      // Medium: 2 days before due date
      scheduledDate = new Date(taskDueDate);
      scheduledDate.setUTCDate(scheduledDate.getUTCDate() - 2);
    } else if (task.priority === "Low") {
      // Low: 3 days before due date
      scheduledDate = new Date(taskDueDate);
      scheduledDate.setUTCDate(scheduledDate.getUTCDate() - 3);
    } else {
      scheduledDate = new Date(taskDueDate);
    }

    // Safety: ensure scheduledDate is not in the past relative to today
    // Convert both to UTC midnight for comparison
    const scheduledMid = new Date(scheduledDate);
    scheduledMid.setUTCHours(0, 0, 0, 0);
    
    if (scheduledMid < today) {
      scheduledDate = new Date(today);
      scheduledDate.setUTCHours(12, 0, 0, 0);
    }
    
    scheduledDate.setUTCHours(0, 0, 0, 0);

    // Start time by priority
    const startTimeMap = { High: "09:00", Medium: "11:00", Low: "14:00" };
    const startTime = startTimeMap[task.priority] || "11:00";

    // Duration in minutes (default 90)
    const durationMinutes = task.estimatedTime || 90;

    // Compute absolute start/end minutes from midnight
    const [startHour, startMin] = startTime.split(":").map(Number);
    const startAbsMin = startHour * 60 + startMin;
    const endAbsMin   = startAbsMin + durationMinutes;

    // End time within clock (mod 24h)
    const endHour = Math.floor(endAbsMin / 60) % 24;
    const endMin  = endAbsMin % 60;
    const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

    // FIX (multi-day): calculate endDate if the task runs past midnight
    const extraDays  = Math.floor(endAbsMin / (24 * 60)); // full extra days past midnight
    const endDate    = new Date(scheduledDate);
    endDate.setDate(endDate.getDate() + extraDays);
    endDate.setHours(0, 0, 0, 0);

    const isMultiDay = extraDays > 0;

    const scheduledSlot = isMultiDay
      ? `${startTime} → +${extraDays}d ${endTime}`
      : `${startTime}-${endTime}`;

    // Persist schedule back onto the task
    task.scheduledDate = scheduledDate;
    task.scheduledSlot = scheduledSlot;
    await task.save();

    // Create/upsert one CalendarEvent per assignee
    const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];

    await Promise.all(
      assignees
        .filter(userId => userId)
        .map(userId =>
          CalendarEvent.findOneAndUpdate(
            { task: task._id, user: userId, date: scheduledDate, startTime },
            {
              task:      task._id,
              user:      userId,
              date:      scheduledDate,
              endDate:   endDate,        // FIX (multi-day): store endDate
              startTime,
              endTime,
              isAutoScheduled: true
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )
        )
    );

    return { scheduledDate, scheduledSlot };
  } catch (error) {
    console.error("Auto scheduling failed:", error);
    throw error;
  }
};

export default autoSchedule;