import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import useNotifications from "../hooks/useNotifications";
import { useTheme } from "../context/ThemeContext";
import { ClipboardList, Handshake, Pencil, Clock, Bell } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const typeIconMap = {
  task_assigned:    ClipboardList,
  task_shared:      Handshake,
  task_updated:     Pencil,
  deadline_warning: Clock,
};

export default function NotificationBell() {
  const [open, setOpen]       = useState(false);
  const buttonRef             = useRef(null);
  const panelRef              = useRef(null);
  const navigate              = useNavigate();
  const [panelRect, setPanelRect] = useState(null);

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotifications();
  const { darkMode } = useTheme();

  /* ── Close on outside click ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const clickedButton = buttonRef.current?.contains(e.target);
      const clickedPanel  = panelRef.current?.contains(e.target);
      if (!clickedButton && !clickedPanel) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* ── Toggle ── */
  const handleOpen = () => {
    if (!open) {
      fetchNotifications();
      if (buttonRef.current) {
        // Snapshot button position so the portal can align to it
        const r = buttonRef.current.getBoundingClientRect();
        setPanelRect(r);
      }
    }
    setOpen(o => !o);
  };

  const handleClick = async (n) => {
    if (!n.read) await markRead(n._id);
    setOpen(false);
    if (n.task?._id) navigate("/dashboard");
  };

  /* ── Portal panel (renders into document.body, escapes sidebar backdrop-filter) ── */
  const panel = open && panelRect ? createPortal(
    <>
      <style>{`
        @keyframes badgePop {
          from { transform: scale(0.4); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes panelSlide {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          /* Open upward from the button */
          bottom: `${window.innerHeight - panelRect.top + 8}px`,
          left:   `${panelRect.left}px`,
          width:  "320px",
          background:    "var(--bg-modal)",
          backdropFilter:"blur(20px)",
          borderRadius:  "16px",
          border:        "1px solid var(--border-dim)",
          boxShadow:     darkMode ? "0 20px 60px rgba(0,0,0,0.4)" : "0 20px 60px rgba(109,40,217,0.14)",
          zIndex:        99999,
          overflow:      "hidden",
          animation:     "panelSlide 0.22s ease both",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px 12px",
          borderBottom: "1px solid var(--border-dim)",
          background: darkMode ? "rgba(255,255,255,0.02)" : "linear-gradient(135deg, rgba(250,245,255,0.8), rgba(238,242,255,0.4))",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span style={{
                background: darkMode ? "rgba(167, 139, 250, 0.15)" : "rgba(233, 213, 255, 0.6)", 
                border: darkMode ? "1px solid rgba(167, 139, 250, 0.4)" : "1px solid rgba(196, 181, 253, 0.4)",
                borderRadius: "99px", fontSize: "10px", fontWeight: 700,
                color: "var(--accent-purple)", padding: "1px 7px"
              }}>
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "11px", fontWeight: 600, color: "var(--accent-purple)",
                padding: "4px 8px", borderRadius: "7px", transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(233,213,255,0.4)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div style={{ maxHeight: "380px", overflowY: "auto" }}>
          {notifications.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", color: darkMode ? "rgba(167, 139, 250, 0.5)" : "rgba(124, 58, 237, 0.5)" }}>
                <Bell size={28} strokeWidth={1.5} />
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                You're all caught up!
              </p>
            </div>
          ) : (
            notifications.map(n => (
              <NotifRow key={n._id} n={n} darkMode={darkMode} onClick={() => handleClick(n)} />
            ))
          )}
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      {/* Bell button — stays inside sidebar */}
      <button
        ref={buttonRef}
        onClick={handleOpen}
        title="Notifications"
        style={{
          position: "relative",
          width: "34px", height: "34px",
          borderRadius: "10px",
          border: open
            ? (darkMode ? "1px solid rgba(167, 139, 250, 0.5)" : "1px solid rgba(124, 58, 237, 0.5)")
            : "1px solid var(--border-dim)",
          background: open ? (darkMode ? "rgba(139,92,246,0.15)" : "rgba(233,213,255,0.4)") : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.15s", color: "var(--accent-purple)",
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.background = darkMode ? "rgba(139,92,246,0.1)" : "rgba(233,213,255,0.25)";
            e.currentTarget.style.borderColor = darkMode ? "rgba(167, 139, 250, 0.4)" : "rgba(124, 58, 237, 0.4)";
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "var(--border-dim)";
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1.5A5 5 0 0 0 3 6.5v3L1.5 11h13L13 9.5v-3A5 5 0 0 0 8 1.5Z"
            stroke="currentColor" strokeWidth="1.3" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
          <path d="M6.5 11.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: "-4px", right: "-4px",
            minWidth: "16px", height: "16px",
            background: "linear-gradient(135deg, #f87171, #ef4444)",
            borderRadius: "99px",
            fontSize: "9px", fontWeight: 700, color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
            boxShadow: "0 2px 6px rgba(239,68,68,0.45)",
            border: darkMode ? "1.5px solid #1e1b4b" : "1.5px solid white",
            animation: "badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Portal panel — rendered into document.body */}
      {panel}
    </>
  );
}

function NotifRow({ n, onClick, darkMode }) {
  const isUnread      = !n.read;
  const IconComponent = typeIconMap[n.type] || Bell;
  const actor         = n.actor?.name || "Someone";
  const timeAgo       = dayjs(n.createdAt).fromNow();

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", gap: "12px", alignItems: "flex-start",
        width: "100%", padding: "12px 16px", textAlign: "left",
        background: isUnread ? (darkMode ? "rgba(139,92,246,0.08)" : "rgba(233,213,255,0.15)") : "transparent",
        border: "none", borderBottom: "1px solid var(--border-dim)",
        cursor: "pointer", transition: "background 0.12s",
        position: "relative",
      }}
      onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.03)" : "rgba(233,213,255,0.25)"}
      onMouseLeave={e => e.currentTarget.style.background = isUnread ? (darkMode ? "rgba(139,92,246,0.08)" : "rgba(233,213,255,0.15)") : "transparent"}
    >
      {/* Unread dot */}
      {isUnread && (
        <div style={{
          position: "absolute", top: "14px", left: "6px",
          width: "5px", height: "5px", borderRadius: "50%",
          background: "var(--accent-purple)",
        }} />
      )}

      {/* Icon bubble */}
      <div style={{
        width: "32px", height: "32px", borderRadius: "10px", flexShrink: 0,
        background: darkMode ? "rgba(139,92,246,0.15)" : "rgba(233,213,255,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--accent-purple)",
      }}>
        <IconComponent size={15} strokeWidth={1.8} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: "0 0 3px",
          fontSize: "12.5px",
          fontWeight: isUnread ? 600 : 400,
          color: isUnread ? "var(--text-main)" : "var(--text-muted)",
          lineHeight: 1.45,
          wordBreak: "break-word",
        }}>
          {n.message}
        </p>
        <p style={{ margin: 0, fontSize: "11px", color: darkMode ? "rgba(167, 139, 250, 0.7)" : "rgba(124, 58, 237, 0.7)" }}>
          {actor} · {timeAgo}
        </p>
      </div>
    </button>
  );
}
