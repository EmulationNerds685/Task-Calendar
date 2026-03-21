import CalendarEvent from "../models/CalendarEvent.js";

/*
 Auto schedule a task based on priority and due date
*/
const autoSchedule = async (task) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let scheduledDate;

    /*
     Determine scheduled date based on priority
    */
    if (task.priority === "High") {
      const createdDate = new Date(task.createdAt);
      createdDate.setHours(0, 0, 0, 0);

      scheduledDate = createdDate < today ? today : createdDate;
    }

    if (task.priority === "Medium") {
      scheduledDate = new Date(task.dueDate);
      scheduledDate.setDate(scheduledDate.getDate() - 2);
    }

    if (task.priority === "Low") {
      scheduledDate = new Date(task.dueDate);
      scheduledDate.setDate(scheduledDate.getDate() - 3);
    }

    /*
     Fallback if calculated date is in the past
    */
    if (scheduledDate < today) {
      scheduledDate = today;
    }

    scheduledDate.setHours(0, 0, 0, 0);

    /*
     Assign time slot based on priority
    */
    const slotMap = {
      High: "09:00-10:30",
      Medium: "11:00-12:30",
      Low: "14:00-15:30"
    };

    const scheduledSlot = slotMap[task.priority] || "11:00-12:30";

    const [startTime, endTime] = scheduledSlot.split("-");

    /*
     Save scheduling info back to task
    */
    task.scheduledDate = scheduledDate;
    task.scheduledSlot = scheduledSlot;

    await task.save();

    /*
     Create or update calendar event
    */
    await CalendarEvent.findOneAndUpdate(
      {
        task: task._id,
        user: task.assignedTo,
        date: scheduledDate,
        startTime
      },
      {
        task: task._id,
        user: task.assignedTo,
        date: scheduledDate,
        startTime,
        endTime,
        isAutoScheduled: true
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return {
      scheduledDate,
      scheduledSlot
    };
  } catch (error) {
    console.error("Auto scheduling failed:", error);
    throw error;
  }
};

export default autoSchedule;