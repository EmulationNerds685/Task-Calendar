import { useState } from "react";
import { Link2, FileText, Pencil } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import dayjs from "dayjs";
import ConfirmModal from "./ConfirmModal";
import { useToast } from "../context/ToastContext";

const getPriorityConfig = (darkMode) => ({
  High:   { color: "#ef4444", bg: darkMode ? "rgba(239,68,68,0.15)" : "rgba(254,242,242,0.9)", text: "#ef4444" },
  Medium: { color: "#f59e0b", bg: darkMode ? "rgba(245,158,11,0.15)" : "rgba(255,251,235,0.9)", text: "#f59e0b" },
  Low:    { color: "#10b981", bg: darkMode ? "rgba(16,185,129,0.15)" : "rgba(236,253,245,0.9)", text: "#10b981" },
});

const getStatusColors = (darkMode) => ({
  "Not Started": { bg: darkMode ? "rgba(71,85,105,0.3)" : "#f1f5f9",               text: darkMode ? "#94a3b8" : "#64748b" },
  "In Progress":  { bg: darkMode ? "rgba(99,102,241,0.15)" : "rgba(238,242,255,0.9)", text: darkMode ? "#818cf8" : "#6366f1" },
  "Completed":    { bg: darkMode ? "rgba(16,185,129,0.15)" : "rgba(236,253,245,0.9)", text: darkMode ? "#34d399" : "#10b981" },
  "Overdue":      { bg: darkMode ? "rgba(239,68,68,0.15)" : "rgba(254,242,242,0.9)", text: darkMode ? "#f87171" : "#ef4444" },
});

export default function TaskDetailModal({ task, onClose, onEdit, onDeleted }) {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const toast = useToast();
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const priorityConfig = getPriorityConfig(darkMode);
  const statusColors = getStatusColors(darkMode);

  // Check if current user can edit this task
  const canEdit = isAdmin || (task.assignedTo || []).some(a => String(a._id || a) === String(user?._id));

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success("Task deleted successfully");
      onDeleted?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const pc = priorityConfig[task.priority] || priorityConfig.Medium;
  const sc = statusColors[task.status] || statusColors["Not Started"];
  const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : task.assignedTo ? [task.assignedTo] : [];

  return (
    <>
    <div
      style={{
        position: "fixed", inset: 0, background: darkMode ? "rgba(15, 23, 42, 0.4)" : "rgba(79,50,130,0.18)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 100, padding: "16px",
      }}
    >
      <div
        style={{
          background: "var(--bg-modal)", backdropFilter: "blur(20px)",
          borderRadius: "22px", width: "100%", maxWidth: "440px",
          border: "1px solid var(--border-dim)",
          boxShadow: darkMode ? "0 20px 50px rgba(0,0,0,0.4)" : "0 24px 64px rgba(109,40,217,0.12)",
          maxHeight: "90vh", overflowY: "auto"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--border-dim)",
          background: darkMode ? "rgba(255,255,255,0.02)" : "linear-gradient(135deg, rgba(250,245,255,0.8), rgba(238,242,255,0.4))",
          borderRadius: "22px 22px 0 0",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "3px 10px", borderRadius: "99px",
                background: pc.bg, fontSize: "11px", fontWeight: 600, color: pc.text,
                border: `1px solid ${pc.color}30`,
              }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: pc.color, display: "inline-block" }} />
                {task.priority || "Medium"}
              </span>
              <span style={{
                padding: "3px 10px", borderRadius: "99px",
                background: sc.bg, fontSize: "11px", fontWeight: 600, color: sc.text,
              }}>
                {task.status || "Not Started"}
              </span>
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 700, color: "var(--text-main)", margin: 0, lineHeight: 1.3 }}>
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
              background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(196,181,253,0.15)", 
              border: "1px solid var(--border-dim)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--accent-purple)", fontSize: "16px",
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {task.description && (
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-purple)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</p>
              <p style={{ fontSize: "13px", color: "var(--text-main)", margin: 0, lineHeight: 1.6 }}>{task.description}</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {task.category && (
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-purple)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</p>
                <span style={{
                  fontSize: "12px", padding: "3px 10px", borderRadius: "6px",
                  background: darkMode ? "rgba(139,92,246,0.15)" : "rgba(233,213,255,0.4)", color: "var(--accent-purple)", fontWeight: 500,
                  border: "1px solid var(--border-dim)",
                }}>
                  {task.category}
                </span>
              </div>
            )}
            {task.estimatedTime && (
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-purple)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Est. time</p>
                <p style={{ fontSize: "13px", color: "var(--text-main)", margin: 0, fontWeight: 500 }}>{task.estimatedTime} min</p>
              </div>
            )}
          </div>

          {task.startDate && (!task.dueDate || !dayjs(task.startDate).startOf('day').isSame(dayjs(task.dueDate).startOf('day'))) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-purple)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Start Date</p>
              <p style={{ fontSize: "13px", color: "var(--text-main)", margin: 0, fontWeight: 500 }}>{dayjs(task.startDate).format("MMM D, YYYY")}</p>
            </div>
          </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {task.dueDate && (
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-purple)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Deadline</p>
                <p style={{ fontSize: "13px", color: "var(--text-main)", margin: 0, fontWeight: 500 }}>{dayjs(task.dueDate).format("MMM D, YYYY")}</p>
              </div>
            )}
            {task.scheduledDate && (
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-purple)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Assigned Slot</p>
                <p style={{ fontSize: "13px", color: darkMode ? "#818cf8" : "#6366f1", margin: 0, fontWeight: 700 }}>
                  {dayjs(task.scheduledDate).format("MMM D")}
                  {task.scheduledSlot && ` · ${task.scheduledSlot}`}
                </p>
              </div>
            )}
          </div>

          {assignees.length > 0 && (
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-purple)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Assigned to</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {assignees.map((a, i) => {
                  const name = typeof a === "object" ? a.name : a;
                  const initials = name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "4px 10px", borderRadius: "99px",
                      background: darkMode ? "rgba(139,92,246,0.15)" : "rgba(233,213,255,0.35)", 
                      border: "1px solid var(--border-dim)",
                    }}>
                      <div style={{
                        width: "18px", height: "18px", borderRadius: "50%",
                        background: "linear-gradient(135deg,#c084fc,#818cf8)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "9px", fontWeight: 700, color: "white", flexShrink: 0,
                      }}>{initials}</div>
                      <span style={{ fontSize: "12px", color: darkMode ? "#c084fc" : "#4c1d95", fontWeight: 500 }}>{name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(task.attachments?.length > 0 || task.referenceLinks?.length > 0) && (
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-purple)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Reference & Files</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {/* Legacy Links */}
                {(task.referenceLinks || []).map((link, i) => (
                  <a key={`legacy-${i}`} href={link} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "8px 12px", background: darkMode ? "rgba(139,92,246,0.12)" : "rgba(233,213,255,0.25)",
                      border: "1px solid var(--border-dim)", borderRadius: "10px",
                      fontSize: "12px", color: "var(--accent-purple)", textDecoration: "none"
                    }}
                  >
                    <Link2 size={13} strokeWidth={2} /> {link}
                  </a>
                ))}
                
                {/* Structured Attachments */}
                {(task.attachments || []).map((att, i) => {
                  const isFile = att.fileType === "file";
                  const fullUrl = isFile ? `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}${att.url}` : att.url;
                  return (
                    <a key={`att-${i}`} href={fullUrl} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "8px 12px", background: darkMode ? "rgba(139,92,246,0.12)" : "rgba(233,213,255,0.25)",
                        border: "1px solid var(--border-dim)", borderRadius: "10px",
                        fontSize: "12px", color: "var(--accent-purple)", textDecoration: "none"
                      }}
                    >
                      {isFile ? <FileText size={13} strokeWidth={2} /> : <Link2 size={13} strokeWidth={2} />}
                      <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {att.name || att.url}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: "16px 24px", borderTop: "1px solid var(--border-dim)",
          display: "flex", gap: "10px",
        }}>
          {isAdmin && (
             <button
             onClick={() => setShowConfirm(true)}
             disabled={loading}
             style={{
               flex: 1, padding: "9px", borderRadius: "11px", fontSize: "13px", fontWeight: 500,
               background: "transparent", border: darkMode ? "1px solid rgba(239,68,68,0.3)" : "1px solid #fecdd3",
               color: "#ef4444", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s", fontFamily: "inherit",
             }}
             onMouseEnter={e => { if(!loading) e.currentTarget.style.background = darkMode ? "rgba(239,68,68,0.1)" : "#fff1f2"; }}
             onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
           >
             {loading ? "Deleting..." : "Delete"}
           </button>
          )}

          {canEdit && (
            <button
              onClick={() => onEdit(task)}
              style={{
                flex: 2, padding: "9px", borderRadius: "11px", fontSize: "13px", fontWeight: 600,
                background: "linear-gradient(135deg,#c084fc,#818cf8)",
                border: "none", color: "white", cursor: "pointer",
                boxShadow: "0 4px 12px rgba(139,92,246,0.25)", fontFamily: "inherit",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Pencil size={13} strokeWidth={2} /> Edit task
              </span>
            </button>
          )}
          
          {!isAdmin && !canEdit && (
             <button
             onClick={onClose}
             style={{
               flex: 1, padding: "9px", borderRadius: "11px", fontSize: "13px", fontWeight: 500,
               background: "transparent", border: "1px solid var(--border-dim)",
               color: "var(--text-muted)", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
             }}
           >
             Close
           </button>
          )}
        </div>
      </div>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&display=swap" rel="stylesheet" />
    </div>

    <ConfirmModal
      show={showConfirm}
      onClose={() => setShowConfirm(false)}
      onConfirm={handleDelete}
      title="Delete Task"
      message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
      confirmText={loading ? "Deleting..." : "Delete Task"}
      type="danger"
    />
    </>
  );
}