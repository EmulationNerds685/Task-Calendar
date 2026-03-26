import mongoose from "mongoose";

const calendarEventSchema = new mongoose.Schema(
  {
    /*
     VERIFIED REF: task → Task (correct)
    */
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true
    },

    /*
     VERIFIED REF: user → User (correct)
    */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    // Multi-day support: if endDate differs from date, the event spans multiple days.
    // When absent, the event is single-day (endDate === date).
    endDate: {
      type: Date
    },

    startTime: {
      type: String,
      required: true // e.g. "09:00"
    },

    endTime: {
      type: String,
      required: true // e.g. "10:30"
    },

    isAutoScheduled: {
      type: Boolean,
      default: true
    },

    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

/*
 IMPROVEMENT: Updated unique constraint to include startTime.

 Original: { task, user, date } — prevented the same task from being
 scheduled more than once for a user on a given day.

 Problem: The auto-scheduler may legitimately split a long task across
 multiple time slots in one day (e.g. "09:00-10:30" and "14:00-15:00").
 The old index would block the second insert with a duplicate key error.

 Fix: Adding startTime to the unique key allows multiple slots per task
 per user per day, while still preventing true duplicates (same task,
 same user, same date AND same start time).
*/
calendarEventSchema.index(
  { task: 1, user: 1, date: 1, startTime: 1 },
  { unique: true }
);

/*
 IMPROVEMENT: Added { user, date } index.
 Covers the most frequent calendar query: "load all events for this user
 on this date" (used by the daily and weekly calendar views).
 Without this, every calendar render does a full collection scan filtered
 only by user — slow as the collection grows.
*/
calendarEventSchema.index({ user: 1, date: 1 });

/*
 IMPROVEMENT: Added { user, date, startTime } index.
 Covers time-ordered calendar rendering ("show all events for user X on
 date Y sorted by start time") and the analytics dashboard aggregation
 ("total time per person per day, broken down by slot").
 The extra startTime field makes this index a covering index for those
 queries — MongoDB can satisfy them from the index alone without fetching
 full documents.
*/
calendarEventSchema.index({ user: 1, date: 1, startTime: 1 });

const CalendarEvent = mongoose.model("CalendarEvent", calendarEventSchema);

export default CalendarEvent;