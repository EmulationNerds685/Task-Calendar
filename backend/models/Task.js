import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium"
    },

    category: {
      type: String,
      enum: [
        "Research",
        "Admin",
        "Investment Analysis",
        "Compliance",
        "Operations"
      ]
    },

    dueDate: {
      type: Date,
      required: true
    },

    estimatedTime: {
      type: Number, // minutes
      min: 1
    },

    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed", "Overdue"],
      default: "Not Started"
    },

    scheduledDate: {
      type: Date
    },

    scheduledSlot: {
      type: String // example: "09:00-10:30"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

taskSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate) return false;
  if (this.status === "Completed") return false;

 const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(this.dueDate);
  due.setHours(0, 0, 0, 0);

  return due < today;
});

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ scheduledDate: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;