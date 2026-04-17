import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

export default function useTasks(filters = {}, pollInterval = 0) {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null); // NEW: Store global stats
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTasks = useCallback(async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });
      const res = await api.get(`/tasks?${params.toString()}`);
      setTasks(res.data.tasks);
      setPagination(res.data.pagination);
      setStats(res.data.stats); // Capture global stats
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tasks");
    } finally {
      if (!isAutoRefresh) setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchTasks();

    // Set up polling if an interval is provided
    let intervalId;
    if (pollInterval > 0) {
      intervalId = setInterval(() => {
        fetchTasks(true); // pass true to skip loading spinner on auto-refresh
      }, pollInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchTasks, pollInterval]);

  return { tasks, pagination, stats, loading, error, refetch: fetchTasks };
}