import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

export default function useCalendarEvents(startDate, endDate) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const res = await api.get(`/calendar?${params.toString()}`);

      const formatted = res.data.map((event) => {
        const date = new Date(event.date);
        const [startHour, startMin] = event.startTime.split(":").map(Number);
        const [endHour, endMin] = event.endTime.split(":").map(Number);

        const start = new Date(date);
        start.setHours(startHour, startMin, 0);

        const end = new Date(date);
        end.setHours(endHour, endMin, 0);

        return {
          id: event._id,
          title: event.task?.title || "Untitled",
          start,
          end,
          resource: event,
        };
      });

      setEvents(formatted);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}