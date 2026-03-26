import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

// CHANGE #4: Hook to fetch dynamic settings from the backend Settings model.
// All dropdowns across the app use this instead of hardcoded arrays.
export default function useSettings() {
  const [settings, setSettings] = useState({
    categories: ["Research", "Admin", "Investment Analysis", "Compliance", "Operations"],
    statuses: ["Not Started", "In Progress", "Completed", "Overdue"],
    priorities: ["High", "Medium", "Low"],
    allocatedHours: {}
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/settings");
      const data = res.data;
      setSettings({
        categories: data.categories || [],
        statuses: data.statuses || [],
        priorities: data.priorities || [],
        allocatedHours: data.allocatedHours || {}
      });
    } catch {
      // Fall back to defaults already in state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, refetch: fetchSettings };
}