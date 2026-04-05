import CalendarEvent from "../models/CalendarEvent.js";
import dayjs from "dayjs";

/**
 * DRY RUN: Calculate the schedule without saving to the DB.
 */
export const calculateTaskSchedule = (task) => {
  // Use provided startDate or default to dueDate (or today)
  let scheduledDate = task.startDate ? new Date(task.startDate) : new Date(task.dueDate || new Date());
  scheduledDate.setUTCHours(0, 0, 0, 0);

  // Use priority-based start times if they exist, else default
  const startTimeMap = { High: "09:00", Medium: "11:00", Low: "14:00" };
  const startTime = startTimeMap[task.priority] || "11:00";

  // Calculate duration
  let durationMinutes = Number(task.estimatedTime) || 90;

  const [startHour, startMin] = startTime.split(":").map(Number);
  const startAbsMin = startHour * 60 + startMin;
  const endAbsMin   = startAbsMin + durationMinutes;

  const endHour = Math.floor(endAbsMin / 60) % 24;
  const endMin  = endAbsMin % 60;
  const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

  // Determine end date
  let endDate;
  if (task.endDate) {
    // User-provided endDate takes precedence
    endDate = new Date(task.endDate);
    endDate.setUTCHours(0, 0, 0, 0);
  } else {
    const extraDays = Math.floor(endAbsMin / (24 * 60));
    endDate = new Date(scheduledDate);
    endDate.setUTCDate(endDate.getUTCDate() + extraDays);
    endDate.setUTCHours(0, 0, 0, 0);
  }

  const isMultiDay = dayjs(endDate).startOf('day').isAfter(dayjs(scheduledDate).startOf('day'));

  const scheduledSlot = isMultiDay
    ? `${startTime} → ${dayjs(scheduledDate).format("MMM D")} to ${dayjs(endDate).format("MMM D")}`
    : `${startTime}-${endTime}`;

  return { scheduledDate, scheduledSlot, endDate, startTime, endTime, isMultiDay };
};

/*
 Auto-schedule a task based on priority, dueDate, and estimatedTime.
*/
const autoSchedule = async (task) => {
  try {
    const { scheduledDate, scheduledSlot, endDate, startTime, endTime } = calculateTaskSchedule(task);

    // Persist schedule metadata onto the task (but NOT startDate/endDate — those are user-provided only)
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
              endDate:   endDate,
              startTime,
              endTime,
              isAutoScheduled: true
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
          )
        )
    );

    return { scheduledDate, scheduledSlot, endDate };
  } catch (error) {
    console.error("Auto scheduling failed:", error);
    throw error;
  }
};

export default autoSchedule;
