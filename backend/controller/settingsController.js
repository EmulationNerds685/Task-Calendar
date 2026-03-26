import Settings from "../models/Settings.js";

/*
 CHANGE #4: Get settings (categories, statuses, priorities)
 CHANGE #14: Also returns allocatedHours
*/
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch settings", error: error.message });
  }
};

/*
 CHANGE #4: Update the settings arrays (admin only).
 Accepts partial updates — send only the fields you want to change.
 CHANGE #14: Also handles allocatedHours map updates.
*/
export const updateSettings = async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    const { categories, statuses, priorities, allocatedHours } = req.body;

    if (categories !== undefined) {
      if (!Array.isArray(categories) || categories.some(c => typeof c !== "string")) {
        return res.status(400).json({ message: "categories must be an array of strings" });
      }
      settings.categories = categories.filter(c => c.trim());
    }

    if (statuses !== undefined) {
      if (!Array.isArray(statuses) || statuses.some(s => typeof s !== "string")) {
        return res.status(400).json({ message: "statuses must be an array of strings" });
      }
      settings.statuses = statuses.filter(s => s.trim());
    }

    if (priorities !== undefined) {
      if (!Array.isArray(priorities) || priorities.some(p => typeof p !== "string")) {
        return res.status(400).json({ message: "priorities must be an array of strings" });
      }
      settings.priorities = priorities.filter(p => p.trim());
    }

    // CHANGE #14: allocatedHours is a plain object { category: hours }
    if (allocatedHours !== undefined) {
      if (typeof allocatedHours !== "object" || Array.isArray(allocatedHours)) {
        return res.status(400).json({ message: "allocatedHours must be an object" });
      }
      settings.allocatedHours = new Map(Object.entries(allocatedHours));
    }

    await settings.save();
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to update settings", error: error.message });
  }
};