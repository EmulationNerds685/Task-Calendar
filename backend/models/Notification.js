import mongoose from "mongoose";

/*
 Notification model — one doc per recipient per event.
 type: "task_assigned" | "task_shared" | "task_updated" | "deadline_warning"
*/
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    type: {
      type: String,
      enum: ["task_assigned", "task_shared", "task_updated", "deadline_warning"],
      required: true
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task"
    },

    message: {
      type: String,
      required: true
    },

    read: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

// Compound index: fast unread-count queries per user
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
