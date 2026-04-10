import CalendarEvent from "../models/CalendarEvent.js";
import Task from "../models/Task.js";
import dayjs from "dayjs";

const WORKING_START_MINS = 10 * 60;       // 10:00 AM
const WORKING_END_MINS   = 20 * 60 + 30; // 08:30 PM
const PRIORITY_MAP = { High: 3, Medium: 2, Low: 1 };

/**
 * Re-balances the schedule for a set of users starting from a specific date.
 * Effectively shifts lower priority tasks forward to accommodate higher priority ones.
 */
export async function rebalanceSchedule(userIds, fromDate) {
  const startDay = dayjs(fromDate).startOf("day");
  
  // 1. Fetch all active tasks for EVERY user involved in the rebalance
  // We need the full context for these users to avoid overlaps
  const tasks = await Task.find({
    assignedTo: { $in: userIds },
    status: { $nin: ["Completed", "Cancelled"] },
    $or: [
      { scheduledDate: { $gte: startDay.toDate() } },
      { startDate: { $gte: startDay.toDate() } },
      { scheduledDate: { $exists: false } }
    ]
  });

  if (tasks.length === 0) return [];

  // 2. Sort tasks by priority (High first) then by creation date
  tasks.sort((a, b) => {
    const pA = PRIORITY_MAP[a.priority] || 2;
    const pB = PRIORITY_MAP[b.priority] || 2;
    if (pB !== pA) return pB - pA;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  // 3. Perform a sweeping allocation
  // Track "next available slot" individually for every user
  const userAgendas = {}; // Map<userId, { day, mins }>
  userIds.forEach(id => {
    userAgendas[id] = { day: startDay, mins: WORKING_START_MINS };
  });

  const updatedTasks = [];

  for (const task of tasks) {
    const duration = Number(task.estimatedTime) || 60;
    const safeDuration = Math.min(duration, WORKING_END_MINS - WORKING_START_MINS);
    const assignees = (task.assignedTo || []).map(u => (u._id || u).toString());

    // Find the earliest starting day/time where ALL assignees are available
    let targetDay = startDay;
    let targetMins = WORKING_START_MINS;

    // We keep pushing forward until we find a shared slot
    let found = false;
    let iterations = 0;
    while (!found && iterations < 365) { // 1 year limit to avoid infinite loops
      iterations++;
      
      // Candidate slot: the latest "next available" among all assignees
      let latestDay = targetDay;
      let latestMins = targetMins;

      assignees.forEach(uid => {
        if (!userAgendas[uid]) userAgendas[uid] = { day: startDay, mins: WORKING_START_MINS };
        const agenda = userAgendas[uid];
        
        if (agenda.day.isAfter(latestDay)) {
          latestDay = agenda.day;
          latestMins = agenda.mins;
        } else if (agenda.day.isSame(latestDay) && agenda.mins > latestMins) {
          latestMins = agenda.mins;
        }
      });

      // Check if this latest start point allows the duration on that day
      if (latestMins + safeDuration <= WORKING_END_MINS) {
        targetDay = latestDay;
        targetMins = latestMins;
        found = true;
      } else {
        // Doesn't fit on this day, skip to the start of the next day
        targetDay = latestDay.add(1, "day");
        targetMins = WORKING_START_MINS;
        
        // Optimization: update all internal agendas to catch up to this new "earliest possible" day
        assignees.forEach(uid => {
          if (userAgendas[uid].day.isBefore(targetDay)) {
            userAgendas[uid] = { day: targetDay, mins: WORKING_START_MINS };
          }
        });
      }
    }

    const startMins = targetMins;
    const endMins = startMins + safeDuration;
    const startTimeStr = `${String(Math.floor(startMins / 60)).padStart(2, "0")}:${String(startMins % 60).padStart(2, "0")}`;
    const endTimeStr   = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;

    task.scheduledDate = targetDay.toDate();
    task.scheduledSlot = `${startTimeStr}-${endTimeStr}`;
    
    updatedTasks.push({
      id: task._id,
      title: task.title,
      scheduledDate: task.scheduledDate,
      scheduledSlot: task.scheduledSlot,
      dueDate: task.dueDate
    });

    await task.save();

    // Re-upsert CalendarEvents for all assignees
    await CalendarEvent.deleteMany({ task: task._id });
    await Promise.all(
      assignees.map(userId => 
        CalendarEvent.create({
          task: task._id,
          user: userId,
          date: task.scheduledDate,
          endDate: task.dueDate || task.scheduledDate, // Smart stretching
          startTime: startTimeStr,
          endTime: endTimeStr,
          isAutoScheduled: true
        })
      )
    );

    // Finalize the update for the assignees in this specific task
    assignees.forEach(uid => {
      userAgendas[uid] = { day: targetDay, mins: endMins };
    });
  }

  return updatedTasks;
}

/**
 * Legacy wrapper for calculateTaskSchedule.
 * Now it just returns the results of a rebalance dry-run or a simple estimation.
 */
export const calculateTaskSchedule = async (task) => {
  // For the re-balancer, we don't "calculate" ahead of time anymore,
  // we just assume it will fit somewhere in the future.
  // But for the TaskFormModal's quick preview, we can show the "current" first available slot.
  const durationMinutes = Number(task.estimatedTime) || 90;
  let targetDate = task.startDate ? dayjs(task.startDate) : dayjs();
  targetDate = targetDate.startOf("day");

  const startTime = "10:00";
  const endTime   = dayjs(targetDate).minute(WORKING_START_MINS + durationMinutes).format("HH:mm");

  return {
    scheduledDate: targetDate.toDate(),
    scheduledSlot: `${startTime}-${endTime}`,
    startTime,
    endTime,
    isConflict: false // With the new shifter, there is never a "conflict", only a "shift"
  };
};

const autoSchedule = async (task) => {
  const userIds = (task.assignedTo || []).map(u => (u._id || u).toString());
  const startDate = task.startDate || task.scheduledDate || new Date();
  return await rebalanceSchedule(userIds, startDate);
};

export default autoSchedule;
