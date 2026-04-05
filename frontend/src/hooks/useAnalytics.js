import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

// CHANGE #13: accepts optional userId to filter analytics to a single member.
// CHANGE #14: returns allocatedHours, weeklyActualMinutes, and allTimeActualMinutes from backend.
export default function useAnalytics(userId = "") {
  const [data, setData] = useState([]);
  const [allocatedHours, setAllocatedHours] = useState({});
  const [weeklyActualMinutes, setWeeklyActualMinutes] = useState({});
  const [allTimeActualMinutes, setAllTimeActualMinutes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      const res = await api.get(`/analytics?${params.toString()}`);
      setData(res.data.analytics || []);
      setAllocatedHours(res.data.allocatedHours || {});
      setWeeklyActualMinutes(res.data.weeklyActualMinutes || {});
      setAllTimeActualMinutes(res.data.allTimeActualMinutes || {});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, allocatedHours, weeklyActualMinutes, allTimeActualMinutes, loading, error };
}