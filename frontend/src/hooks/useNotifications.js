import { useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axios";

const POLL_INTERVAL = 30_000; // 30 seconds

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const intervalRef = useRef(null);

  /* Fetch full notification list */
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch {
      /* silently ignore — poll will retry */
    }
  }, []);

  /* Poll unread count only (lightweight) */
  const pollUnread = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      setUnreadCount(data.count);
    } catch {
      /* silently ignore */
    }
  }, []);

  /* Mark a single notification as read */
  const markRead = useCallback(async (id) => {
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch { /* optimistic — ignore */ }
  }, []);

  /* Mark all as read */
  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await api.patch("/notifications/read-all");
    } catch { /* optimistic — ignore */ }
  }, []);

  /* Initial load + polling */
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(pollUnread, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications, pollUnread]);

  return { notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead };
}
