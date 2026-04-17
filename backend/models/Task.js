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

    // CHANGE #3: assignedTo is now an array of User refs (was single ObjectId)
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

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

    // CHANGE #4: category no longer enum-locked — Settings model drives valid values
    category: {
      type: String,
      required: true
    },

    dueDate: {
      type: Date,
      required: true
    },

    startDate: {
      type: Date
    },


    estimatedTime: {
      type: Number, // minutes
      min: 1
    },

    // CHANGE #4: status no longer enum-locked — Settings model drives valid values
    status: {
      type: String,
      default: "Not Started"
    },

    scheduledDate: {
      type: Date
    },

    scheduledSlot: {
      type: String // e.g. "09:00-10:30"
    },

    // CHANGE #11: Reference links (URLs) attached to the task (legacy)
    referenceLinks: {
      type: [String],
      default: []
    },

    // NEW: Structured attachments (files and links)
    attachments: [
      {
        name: String,
        url: String,
        fileType: { type: String, enum: ["link", "file"], default: "link" }
      }
    ]
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

// Updated indexes for array assignedTo
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ startDate: 1 });
taskSchema.index({ scheduledDate: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;