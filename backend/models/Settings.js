import mongoose from "mongoose";

/*
 CHANGE #4: Settings model — stores dynamic categories, statuses, priorities.
 CHANGE #14: Also stores allocatedHours per category for analytics comparison.

 There is always exactly ONE settings document in the collection (singleton pattern).
 Use Settings.getSingleton() to fetch or auto-create it.
*/
const settingsSchema = new mongoose.Schema(
  {
    categories: {
      type: [String],
      default: ["Research", "Admin", "Investment Analysis", "Compliance", "Operations"]
    },

    statuses: {
      type: [String],
      default: ["Not Started", "In Progress", "Completed", "Overdue"]
    },

    priorities: {
      type: [String],
      default: ["High", "Medium", "Low"]
    },

    // CHANGE #14: Weekly allocated hours per category { "Research": 10, "Compliance": 8, ... }
    allocatedHours: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  { timestamps: true }
);

// Static helper — always returns the singleton settings doc
settingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;