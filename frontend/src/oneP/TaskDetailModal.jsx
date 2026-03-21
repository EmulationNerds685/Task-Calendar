import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
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

const Field = ({ label, children }) => (
  <div>
    <p style={{ fontSize: "11px", fontWeight: 600, color: "#c4b5fd", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 5px" }}>
      {label}
    </p>
    <div style={{ fontSize: "13px", color: "#374151" }}>{children}</div>
  </div>
);

export default function TaskDetailModal({ task, onClose, onEdit, onDeleted }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${task._id}`);
      onDeleted();
      onClose();
    } catch {
      alert("Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  const pc = priorityConfig[task.priority] || priorityConfig.Medium;
  const sc = statusConfig[task.status] || statusConfig["Not Started"];

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(79,50,130,0.18)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 50, padding: "16px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)",
          borderRadius: "22px", width: "100%", maxWidth: "440px",
          border: "1px solid rgba(196,181,253,0.25)",
          boxShadow: "0 24px 64px rgba(109,40,217,0.12), 0 0 0 1px rgba(255,255,255,0.8)",
          overflow: "hidden"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "22px 24px 18px",
          borderBottom: "1px solid rgba(196,181,253,0.15)",
          background: "linear-gradient(135deg, rgba(250,245,255,0.8), rgba(238,242,255,0.4))"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              {task.category && (
                <span style={{
                  display: "inline-block", fontSize: "10px", fontWeight: 600,
                  padding: "2px 8px", borderRadius: "99px",
                  background: "rgba(233,213,255,0.5)", color: "#7c3aed",
                  border: "1px solid rgba(196,181,253,0.35)", marginBottom: "8px",
                  letterSpacing: "0.04em", textTransform: "uppercase"
                }}>
                  {task.category}
                </span>
              )}
              <h2 style={{
                fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 700,
                color: "#1e1b4b", margin: 0, lineHeight: 1.3
              }}>
                {task.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
                background: "rgba(196,181,253,0.15)", border: "1px solid rgba(196,181,253,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#a78bfa", fontSize: "16px", lineHeight: 1
              }}
            >
              ×
            </button>
          </div>

          {/* Priority + Status pills */}
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <span style={{
              display: "flex", alignItems: "center", gap: "5px",
              padding: "4px 10px", borderRadius: "99px",
              background: pc.bg, border: `1px solid ${pc.border}`,
              fontSize: "12px", fontWeight: 600, color: pc.text
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: pc.dot }} />
              {task.priority}
            </span>
            <span style={{
              padding: "4px 10px", borderRadius: "99px",
              background: sc.bg, fontSize: "12px", fontWeight: 600, color: sc.text
            }}>
              {task.status}
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {task.description && (
            <p style={{
              fontSize: "13px", color: "#6b7280", lineHeight: 1.65,
              padding: "12px 14px", borderRadius: "12px",
              background: "rgba(250,245,255,0.5)", border: "1px solid rgba(196,181,253,0.15)",
              marginBottom: "18px"
            }}>
              {task.description}
            </p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Due date">
              <span style={{ fontWeight: 600 }}>{dayjs(task.dueDate).format("MMM D, YYYY")}</span>
            </Field>
            <Field label="Estimated time">
              {task.estimatedTime
                ? <span style={{ fontWeight: 600 }}>{task.estimatedTime} min</span>
                : <span style={{ color: "#d1d5db" }}>—</span>
              }
            </Field>
            <Field label="Assigned to">
              {task.assignedTo?.name
                ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg,#e9d5ff,#c7d2fe)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "9px", fontWeight: 700, color: "#7c3aed"
                    }}>
                      {task.assignedTo.name[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 500 }}>{task.assignedTo.name}</span>
                  </div>
                )
                : <span style={{ color: "#d1d5db" }}>—</span>
              }
            </Field>
            <Field label="Created by">
              {task.createdBy?.name
                ? <span style={{ fontWeight: 500 }}>{task.createdBy.name}</span>
                : <span style={{ color: "#d1d5db" }}>—</span>
              }
            </Field>
            {task.scheduledDate && (
              <Field label="Scheduled date">
                <span style={{ fontWeight: 600 }}>{dayjs(task.scheduledDate).format("MMM D, YYYY")}</span>
              </Field>
            )}
            {task.scheduledSlot && (
              <Field label="Scheduled slot">
                <span style={{ fontWeight: 500 }}>{task.scheduledSlot}</span>
              </Field>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px", borderTop: "1px solid rgba(196,181,253,0.15)",
          display: "flex", gap: "10px",
          background: "rgba(250,245,255,0.3)"
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "9px", borderRadius: "12px", fontSize: "13px", fontWeight: 500,
              background: "transparent", border: "1px solid rgba(196,181,253,0.35)",
              color: "#9ca3af", cursor: "pointer", transition: "all 0.15s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(233,213,255,0.2)"; e.currentTarget.style.color = "#7c3aed"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
          >
            Close
          </button>
          <button
            onClick={() => { onClose(); onEdit(task); }}
            style={{
              flex: 1, padding: "9px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
              background: "linear-gradient(135deg,#c084fc,#818cf8)",
              border: "none", color: "white", cursor: "pointer",
              boxShadow: "0 4px 12px rgba(139,92,246,0.25)", transition: "opacity 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            {isAdmin ? "Edit task" : "Update status"}
          </button>
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: "9px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
                background: "rgba(254,242,242,0.8)", border: "1px solid rgba(252,165,165,0.4)",
                color: "#ef4444", cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.5 : 1, transition: "all 0.15s"
              }}
              onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = "rgba(254,226,226,0.9)"; }}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(254,242,242,0.8)"}
            >
              {deleting ? "…" : "Delete"}
            </button>
          )}
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&display=swap" rel="stylesheet" />
    </div>
  );
}