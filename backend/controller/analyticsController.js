import CalendarEvent from "../models/CalendarEvent.js";
import Task from "../models/Task.js";
import Settings from "../models/Settings.js";
import mongoose from "mongoose";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js";
dayjs.extend(isBetween);

/*
 Get analytics
 CHANGE #13: Supports ?userId= query param to filter to a single member.
 CHANGE #14: Also returns allocatedHours from Settings + actual hours this week per category.
 FIX: weeklyActualMinutes now sourced from Task model directly so ALL categories are included.
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
              category: { $trim: { input: "$task.category" } },
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

    // Helper to normalise names to Title Case for consistent matching and display
    const toTitleCase = (str) =>
      str ? str.trim().toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()) : "";

    // Normalise byCategory entries in analytics
    analytics.forEach(entry => {
      if (entry.byCategory) {
        entry.byCategory = entry.byCategory.map(catObj => ({
          ...catObj,
          category: toTitleCase(catObj.category)
        }));
      }
    });

    // FIX: Compute weeklyActualMinutes from Task model directly
    // This ensures ALL categories with tasks show up, not just those with CalendarEvents
    const weekStart = dayjs().startOf("week").toDate();
    const weekEnd   = dayjs().endOf("week").toDate();

    // Build task filter: all tasks that have estimatedTime and a category
    const taskFilter = {
      estimatedTime: { $exists: true, $ne: null },
      category: { $exists: true, $nin: [null, ""] }
    };

    // If filtering by userId, only include tasks assigned to that user
    if (req.query.userId) {
      taskFilter.assignedTo = new mongoose.Types.ObjectId(req.query.userId);
    }

    // Aggregate hours from ALL tasks grouped by category
    const allTasksByCategory = await Task.aggregate([
      { $match: taskFilter },
      {
        $group: {
          _id: { $trim: { input: "$category" } },
          totalMinutes: { $sum: "$estimatedTime" }
        }
      }
    ]);

    // Build weeklyActualMinutes from tasks that were created/scheduled this week
    // Use: tasks where startDate falls in this week, or createdAt falls in this week
    const weeklyTaskFilter = {
      ...taskFilter,
      $or: [
        { startDate: { $gte: weekStart, $lte: weekEnd } },
        { createdAt: { $gte: weekStart, $lte: weekEnd } }
      ]
    };

    const weeklyTasksByCategory = await Task.aggregate([
      { $match: weeklyTaskFilter },
      {
        $group: {
          _id: { $trim: { input: "$category" } },
          totalMinutes: { $sum: "$estimatedTime" }
        }
      }
    ]);

    const weeklyActualMinutes = {};
    weeklyTasksByCategory.forEach(({ _id, totalMinutes }) => {
      if (!_id) return;
      const normCat = toTitleCase(_id);
      weeklyActualMinutes[normCat] = (weeklyActualMinutes[normCat] || 0) + totalMinutes;
    });

    // Also build allTimeActualMinutes for reference
    const allTimeActualMinutes = {};
    allTasksByCategory.forEach(({ _id, totalMinutes }) => {
      if (!_id) return;
      const normCat = toTitleCase(_id);
      allTimeActualMinutes[normCat] = (allTimeActualMinutes[normCat] || 0) + totalMinutes;
    });

    // Normalise allocatedHours keys as well
    const normalisedAllocated = {};
    const rawAllocated = allocatedHours || {};
    Object.entries(rawAllocated).forEach(([cat, hours]) => {
      normalisedAllocated[toTitleCase(cat)] = hours;
    });

    res.status(200).json({
      analytics,
      allocatedHours: normalisedAllocated,
      weeklyActualMinutes,
      allTimeActualMinutes
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch analytics",
      error: error.message
    });
  }
};