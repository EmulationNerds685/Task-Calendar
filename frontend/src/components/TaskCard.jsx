import { Paperclip } from "lucide-react";
import dayjs from "dayjs";
import { useTheme } from "../context/ThemeContext";

const getPriorityConfig = (darkMode) => ({
  High: { bg: darkMode ? "rgba(239,68,68,0.15)" : "rgba(254,242,242,0.8)", text: "#ef4444", border: darkMode ? "rgba(239,68,68,0.25)" : "rgba(252,165,165,0.4)", dot: "#ef4444" },
  Medium: { bg: darkMode ? "rgba(245,158,11,0.15)" : "rgba(255,251,235,0.8)", text: "#f59e0b", border: darkMode ? "rgba(245,158,11,0.25)" : "rgba(253,211,77,0.4)", dot: "#f59e0b" },
  Low: { bg: darkMode ? "rgba(16,185,129,0.15)" : "rgba(236,253,245,0.8)", text: "#10b981", border: darkMode ? "rgba(16,185,129,0.25)" : "rgba(110,231,183,0.4)", dot: "#10b981" },
});

const getStatusConfig = (darkMode) => ({
  "Not Started": { bg: darkMode ? "rgba(71,85,105,0.3)" : "#f1f5f9", text: darkMode ? "#94a3b8" : "#64748b" },
  "In Progress": { bg: darkMode ? "rgba(99,102,241,0.15)" : "rgba(238,242,255,0.9)", text: darkMode ? "#818cf8" : "#6366f1" },
  "Completed": { bg: darkMode ? "rgba(16,185,129,0.15)" : "rgba(236,253,245,0.9)", text: darkMode ? "#34d399" : "#10b981" },
  "Overdue": { bg: darkMode ? "rgba(239,68,68,0.15)" : "rgba(254,242,242,0.9)", text: darkMode ? "#f87171" : "#ef4444" },
});

// CHANGE #3: render multiple assignee avatars stacked
function AssigneeAvatars({ assignedTo }) {
  const people = Array.isArray(assignedTo)
    ? assignedTo
    : assignedTo ? [assignedTo] : [];

  if (people.length === 0) return null;

  const MAX_SHOW = 3;
  const shown = people.slice(0, MAX_SHOW);
  const extra = people.length - MAX_SHOW;

  return (
    <div style={{
      paddingTop: "10px", borderTop: "1px solid rgba(196,181,253,0.15)",
      display: "flex", alignItems: "center", gap: "6px"
    }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {shown.map((person, i) => (
          <div
            key={i}
            title={person?.name}
            style={{
              width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #e9d5ff, #c7d2fe)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", fontWeight: 700, color: "#7c3aed",
              marginLeft: i === 0 ? 0 : "-6px",
              border: "2px solid var(--bg-card)",
              zIndex: shown.length - i
            }}
          >
            {person?.name?.[0]?.toUpperCase()}
          </div>
        ))}
        {extra > 0 && (
          <div style={{
            width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
            background: "rgba(233,213,255,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9px", fontWeight: 700, color: "#7c3aed",
            marginLeft: "-6px", border: "2px solid var(--bg-card)"
          }}>
            +{extra}
          </div>
        )}
      </div>
      <span style={{ fontSize: "12px", color: "#9ca3af" }}>
        {shown.map(p => p?.name?.split(" ")[0]).join(", ")}
        {extra > 0 ? ` +${extra}` : ""}
      </span>
    </div>
  );
}

export default function TaskCard({ task, onClick, onToggle }) {
  const { darkMode } = useTheme();
  const priorityConfig = getPriorityConfig(darkMode);
  const statusConfig = getStatusConfig(darkMode);
  const pc = priorityConfig[task.priority] || priorityConfig.Medium;
  const sc = statusConfig[task.status] || statusConfig["Not Started"];
  const isCompleted = task.status === "Completed";

  const hasSchedule = task.scheduledDate && task.scheduledSlot;

  return (
    <div
      onClick={() => onClick?.(task)}
      style={{
        background: isCompleted ? (darkMode ? "rgba(30,41,59,0.5)" : "rgba(243,244,246,0.9)") : "var(--bg-card)",
        backdropFilter: "blur(8px)",
        border: isCompleted ? "1px solid var(--border-dim)" : "1px solid var(--border-dim)",
        borderRadius: "14px", padding: "16px", cursor: "pointer", transition: "all 0.2s",
        boxShadow: isCompleted ? "none" : "0 1px 6px rgba(139,92,246,0.04)",
        opacity: isCompleted ? 0.75 : 1,
      }}
      onMouseEnter={e => {
        if (isCompleted) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(139,92,246,0.1)";
        e.currentTarget.style.borderColor = "rgba(196,181,253,0.4)";
      }}
      onMouseLeave={e => {
        if (isCompleted) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 6px rgba(139,92,246,0.04)";
        e.currentTarget.style.borderColor = "rgba(196,181,253,0.18)";
      }}
    >
      {/* Priority + title */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
        <input
          type="checkbox"
          checked={task.status === "Completed"}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onToggle?.(task._id, task.status === "Completed" ? "Not Started" : "Completed");
          }}
          style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#7c3aed", marginTop: "2px" }}
        />
        <h3 style={{
          fontSize: "14px", fontWeight: 600,
          color: isCompleted ? "var(--text-muted)" : "var(--text-main)",
          textDecoration: isCompleted ? "line-through" : "none",
          margin: 0, lineHeight: 1.4, flex: 1
        }}>
          {task.title}
        </h3>
        <span style={{
          flexShrink: 0, display: "flex", alignItems: "center", gap: "5px",
          padding: "3px 9px", borderRadius: "99px",
          background: pc.bg, border: `1px solid ${pc.border}`,
          fontSize: "11px", fontWeight: 600, color: pc.text
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: pc.dot, display: "inline-block" }} />
          {task.priority}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p style={{
          fontSize: "12px", color: "#9ca3af", margin: "0 0 12px",
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.5
        }}>
          {task.description}
        </p>
      )}

      {/* Category */}
      {task.category && (
        <div style={{ marginBottom: "10px" }}>
          <span style={{
            fontSize: "11px", padding: "2px 8px", borderRadius: "6px",
            background: darkMode ? "rgba(139,92,246,0.12)" : "rgba(233,213,255,0.4)", color: "var(--accent-purple)",
            fontWeight: 500, border: "1px solid var(--border-dim)"
          }}>
            {task.category}
          </span>
        </div>
      )}

      {/* Status + due date */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: (task.startDate || hasSchedule) ? "10px" : 0 }}>
        <span style={{
          fontSize: "11px", padding: "3px 9px", borderRadius: "99px",
          background: sc.bg, color: sc.text, fontWeight: 600
        }}>
          {task.status}
        </span>
        {task.dueDate && (
          <span style={{ fontSize: "11px", color: "#c4b5fd", fontWeight: 500 }}>
            Deadline: {dayjs(task.dueDate).format("MMM D")}
          </span>
        )}
        {(task.attachments?.length > 0 || task.referenceLinks?.length > 0) && (
          <span style={{
            fontSize: "10px", background: "rgba(139,92,246,0.1)", color: "#7c3aed",
            padding: "2px 6px", borderRadius: "6px", fontWeight: 600, marginLeft: "auto",
            display: "inline-flex", alignItems: "center", gap: "3px"
          }}>
            <Paperclip size={10} strokeWidth={2} /> {(task.attachments?.length || 0) + (task.referenceLinks?.length || 0)}
          </span>
        )}
      </div>

      {(task.scheduledDate && task.scheduledSlot) && (
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "6px 10px", borderRadius: "8px",
          background: darkMode ? "rgba(99,102,241,0.12)" : "rgba(238,242,255,0.6)", border: "1px solid var(--border-dim)",
          marginBottom: "10px"
        }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="2" width="10" height="9" rx="2" stroke="#818cf8" strokeWidth="1" fill="none" />
            <path d="M4 1v2M8 1v2M1 5h10" stroke="#818cf8" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "11px", color: darkMode ? "#818cf8" : "#4f46e5", fontWeight: 600 }}>
            Scheduled: {dayjs(task.scheduledDate).format("MMM D")} · {task.scheduledSlot}
          </span>
        </div>
      )}

      {/* CHANGE #3: Multi-assignee avatars */}
      <AssigneeAvatars assignedTo={task.assignedTo} />
    </div>
  );
}