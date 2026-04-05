import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import dayjs from "dayjs";

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
        .filter(event => event.task && event.task._id)
        .map(event => {
          const date = new Date(event.date);
          const startDay = dayjs(event.date).startOf('day');
          const endDay = event.endDate ? dayjs(event.endDate).startOf('day') : null;
          const isMultiDay = endDay && endDay.isAfter(startDay);

          if (isMultiDay) {
            // Multi-day: create an all-day event spanning start to end+1 day
            // react-big-calendar uses exclusive end for all-day events
            const start = startDay.toDate();
            const end = endDay.add(1, 'day').toDate();
            return {
              id:       event._id,
              title:    event.task.title,
              start,
              end,
              allDay:   true,
              resource: event,
            };
          }

          // Single-day: use start/end times
          const [startHour, startMin] = event.startTime.split(":").map(Number);
          const start = new Date(date);
          start.setHours(startHour, startMin, 0, 0);

          const [endHour, endMin] = event.endTime.split(":").map(Number);
          let end = new Date(date);
          end.setHours(endHour, endMin, 0, 0);

          // Guard: if end <= start (can happen on bad data), add 90 min
          if (end <= start) {
            end = new Date(start.getTime() + 90 * 60 * 1000);
          }

          return {
            id:       event._id,
            title:    event.task.title,
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