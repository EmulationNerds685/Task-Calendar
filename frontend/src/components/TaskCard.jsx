import dayjs from "dayjs";

const priorityConfig = {
  High:   { bg: "rgba(254,242,242,0.8)", text: "#ef4444", border: "rgba(252,165,165,0.4)", dot: "#ef4444" },
  Medium: { bg: "rgba(255,251,235,0.8)", text: "#f59e0b", border: "rgba(253,211,77,0.4)",  dot: "#f59e0b" },
  Low:    { bg: "rgba(236,253,245,0.8)", text: "#10b981", border: "rgba(110,231,183,0.4)", dot: "#10b981" },
};

const statusConfig = {
  "Not Started": { bg: "#f1f5f9", text: "#64748b" },
  "In Progress":  { bg: "rgba(238,242,255,0.9)", text: "#6366f1" },
  "Completed":    { bg: "rgba(236,253,245,0.9)", text: "#10b981" },
  "Overdue":      { bg: "rgba(254,242,242,0.9)", text: "#ef4444" },
};

export default function TaskCard({ task, onClick }) {
  const pc = priorityConfig[task.priority] || priorityConfig.Medium;
  const sc = statusConfig[task.status] || statusConfig["Not Started"];

  const hasSchedule = task.scheduledDate && task.scheduledSlot;

  return (
    <div
      onClick={() => onClick?.(task)}
      style={{
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
        border: "1px solid rgba(196,181,253,0.18)", borderRadius: "14px",
        padding: "16px", cursor: "pointer", transition: "all 0.2s",
        boxShadow: "0 1px 6px rgba(139,92,246,0.04)"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(139,92,246,0.1)";
        e.currentTarget.style.borderColor = "rgba(196,181,253,0.4)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 6px rgba(139,92,246,0.04)";
        e.currentTarget.style.borderColor = "rgba(196,181,253,0.18)";
      }}
    >
      {/* Priority + title */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937", margin: 0, lineHeight: 1.4, flex: 1 }}>
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
            background: "rgba(233,213,255,0.4)", color: "#7c3aed",
            fontWeight: 500, border: "1px solid rgba(196,181,253,0.3)"
          }}>
            {task.category}
          </span>
        </div>
      )}

      {/* Status + due date */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hasSchedule ? "10px" : 0 }}>
        <span style={{
          fontSize: "11px", padding: "3px 9px", borderRadius: "99px",
          background: sc.bg, color: sc.text, fontWeight: 600
        }}>
          {task.status}
        </span>
        {task.dueDate && (
          <span style={{ fontSize: "11px", color: "#c4b5fd", fontWeight: 500 }}>
            Due {dayjs(task.dueDate).format("MMM D")}
          </span>
        )}
      </div>

      {/* Scheduled slot — auto-planning indicator */}
      {hasSchedule && (
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "6px 10px", borderRadius: "8px",
          background: "rgba(238,242,255,0.6)", border: "1px solid rgba(196,181,253,0.2)",
          marginBottom: task.assignedTo ? "10px" : 0
        }}>
          {/* Calendar icon */}
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="2" width="10" height="9" rx="2" stroke="#818cf8" strokeWidth="1" fill="none"/>
            <path d="M4 1v2M8 1v2M1 5h10" stroke="#818cf8" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: 500 }}>
            {dayjs(task.scheduledDate).format("MMM D")} · {task.scheduledSlot}
          </span>
        </div>
      )}

      {/* Assignee */}
      {task.assignedTo && (
        <div style={{
          paddingTop: "10px", borderTop: "1px solid rgba(196,181,253,0.15)",
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          <div style={{
            width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #e9d5ff, #c7d2fe)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", fontWeight: 700, color: "#7c3aed"
          }}>
            {task.assignedTo.name?.[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>{task.assignedTo.name}</span>
        </div>
      )}
    </div>
  );
}