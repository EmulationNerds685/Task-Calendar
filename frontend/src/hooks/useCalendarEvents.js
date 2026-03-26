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
      if (endDate)   params.append("endDate",   endDate);
      const res = await api.get(`/calendar?${params.toString()}`);

      const formatted = res.data
        // FIX (deletion bug): skip any event whose task reference is null/missing.
        // This is the frontend safety net — the backend cascade delete should prevent
        // this, but if a stale event slips through it will never render as "Untitled".
        .filter(event => event.task && event.task._id)
        .map(event => {
          const date = new Date(event.date);

          const [startHour, startMin] = event.startTime.split(":").map(Number);
          const start = new Date(date);
          start.setHours(startHour, startMin, 0, 0);

          // FIX (multi-day): use event.endDate if it differs from event.date,
          // otherwise fall back to the same day. This makes react-big-calendar
          // render the block spanning across multiple day columns.
          const [endHour, endMin] = event.endTime.split(":").map(Number);

          let end;
          if (event.endDate) {
            // endDate from backend is the calendar day the task finishes on
            end = new Date(event.endDate);
            end.setHours(endHour, endMin, 0, 0);
          } else {
            end = new Date(date);
            end.setHours(endHour, endMin, 0, 0);
          }

          // Guard: if end <= start (can happen on bad data), add 90 min
          if (end <= start) {
            end = new Date(start.getTime() + 90 * 60 * 1000);
          }

          return {
            id:       event._id,
            title:    event.task.title,   // safe — we filtered nulls above
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