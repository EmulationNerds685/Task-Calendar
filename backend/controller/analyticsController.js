import CalendarEvent from "../models/CalendarEvent.js";
import Settings from "../models/Settings.js";
import mongoose from "mongoose";
import dayjs from "dayjs";

/*
 Get analytics
 CHANGE #13: Supports ?userId= query param to filter to a single member.
 CHANGE #14: Also returns allocatedHours from Settings + actual hours this week per category.
*/
export const getAnalytics = async (req, res) => {
  try {
    const matchStage = {};

    // If a userId is explicitly requested, filter by it; otherwise, show all (applies to all roles).
    if (req.query.userId) {
      matchStage.user = new mongoose.Types.ObjectId(req.query.userId);
    }

    const analytics = await CalendarEvent.aggregate([
      { $match: matchStage },

      // Join task
      {
        $lookup: {
          from: "tasks",
          localField: "task",
          foreignField: "_id",
          as: "task"
        }
      },
      { $unwind: "$task" },

      // Join user
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      { $match: { "task.estimatedTime": { $exists: true, $ne: null } } },

      // Group by user + date
      {
        $group: {
          _id: {
            user: "$user._id",
            date: "$date"
          },
          userName: { $first: "$user.name" },
          userId: { $first: "$user._id" },
          totalMinutes: { $sum: "$task.estimatedTime" },
          categories: {
            $push: {
              category: "$task.category",
              minutes: "$task.estimatedTime"
            }
          }
        }
      },

      {
        $project: {
          _id: 0,
          userId: 1,
          date: "$_id.date",
          userName: 1,
          totalMinutes: 1,
          byCategory: "$categories"
        }
      },

      { $sort: { date: 1 } }
    ]);

    // CHANGE #14: Fetch settings for allocatedHours + compute actual this-week hours per category
    const settings = await Settings.getSingleton();
    const allocatedHours = settings.allocatedHours
      ? Object.fromEntries(settings.allocatedHours)
      : {};

    // Calculate actual minutes this week per category (across all returned analytics entries)
    const weekStart = dayjs().startOf("week").toDate();
    const weekEnd = dayjs().endOf("week").toDate();

    // Filter analytics to this week and tally by category
    const weeklyActualMinutes = {};
    analytics.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= weekStart && entryDate <= weekEnd) {
        (entry.byCategory || []).forEach(({ category, minutes }) => {
          if (!category) return;
          weeklyActualMinutes[category] = (weeklyActualMinutes[category] || 0) + minutes;
        });
      }
    });

    res.status(200).json({
      analytics,
      allocatedHours,
      weeklyActualMinutes
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch analytics",
      error: error.message
    });
  }
};