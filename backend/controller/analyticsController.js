import CalendarEvent from "../models/CalendarEvent.js";
import mongoose from "mongoose";

/*
 Get analytics
*/
export const getAnalytics = async (req, res) => {
  try {
    const matchStage = {};

    // Members only see their analytics
    if (req.user.role !== "admin") {
      matchStage.user = new mongoose.Types.ObjectId(req.user.id);
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

      // Group by user + date
      {
        $group: {
          _id: {
            user: "$user._id",
            date: "$date"
          },
          userName: { $first: "$user.name" },
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
          userId: "$_id.user",
          date: "$_id.date",
          userName: 1,
          totalMinutes: 1,
          byCategory: "$categories"
        }
      },

      { $sort: { date: 1 } }
    ]);

    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch analytics",
      error: error.message
    });
  }
};