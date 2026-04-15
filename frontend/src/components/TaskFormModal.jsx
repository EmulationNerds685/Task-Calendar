import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import dayjs from "dayjs";
import api from "../api/axios";
import useUsers from "../hooks/useUsers";
import useSettings from "../hooks/useSettings";
import ConflictToast from "./ConflictToast";
import { AlertTriangle, Lightbulb, FileText, Link2, Paperclip } from "lucide-react";

// Fields a member can set when creating their own task
const MEMBER_EDITABLE_CREATE = ["title", "description", "dueDate", "estimatedTime", "status", "referenceLinks", "assignedTo", "priority", "category", "attachments", "force", "startDate"];
// Fields a member can change on an existing task
const MEMBER_EDITABLE_UPDATE = ["description", "estimatedTime", "status", "referenceLinks", "dueDate", "attachments", "force", "startDate"];

const EMPTY_FORM = {
  title:          "",
  description:    "",
  assignedTo:     [],
  priority:       "Medium",
  category:       "",
  startDate:      "",
  dueDate:        "",
  estimatedTime:  "90",
  status:         "Not Started",
  referenceLinks: "",
  attachments:    [],
};

const getPriorityMeta = (darkMode) => ({
  High:   { dot: "#ef4444", bg: darkMode ? "rgba(239,68,68,0.15)" : "rgba(254,242,242,0.7)", activeBorder: darkMode ? "rgba(239,68,68,0.3)" : "rgba(252,165,165,0.6)", activeText: "#ef4444" },
  Medium: { dot: "#f59e0b", bg: darkMode ? "rgba(245,158,11,0.15)" : "rgba(255,251,235,0.7)", activeBorder: darkMode ? "rgba(245,158,11,0.3)" : "rgba(253,211,77,0.6)",  activeText: "#f59e0b" },
  Low:    { dot: "#10b981", bg: darkMode ? "rgba(16,185,129,0.15)" : "rgba(236,253,245,0.7)", activeBorder: darkMode ? "rgba(16,185,129,0.3)" : "rgba(110,231,183,0.6)", activeText: "#10b981" },
});

const getStatusColors = (darkMode) => ({
  "Not Started": { bg: darkMode ? "rgba(71,85,105,0.3)" : "#f1f5f9",               text: darkMode ? "#94a3b8" : "#64748b", activeBorder: darkMode ? "#475569" : "#94a3b8" },
  "In Progress":  { bg: darkMode ? "rgba(99,102,241,0.15)" : "rgba(238,242,255,0.8)", text: darkMode ? "#818cf8" : "#6366f1", activeBorder: "#818cf8" },
  "Completed":    { bg: darkMode ? "rgba(16,185,129,0.15)" : "rgba(236,253,245,0.8)", text: darkMode ? "#34d399" : "#10b981", activeBorder: "#34d399" },
  "Overdue":      { bg: darkMode ? "rgba(239,68,68,0.15)" : "rgba(254,242,242,0.8)", text: darkMode ? "#f87171" : "#ef4444", activeBorder: "#f87171" },
});

const inputStyle = (disabled = false, darkMode = false) => ({
  width: "100%", padding: "9px 13px", fontSize: "13px", fontFamily: "inherit",
  background: disabled ? (darkMode ? "rgba(255,255,255,0.02)" : "rgba(249,250,251,0.6)") : (darkMode ? "rgba(255,255,255,0.03)" : "#fafafa"),
  border: darkMode ? "1.5px solid rgba(255,255,255,0.1)" : "1.5px solid #e5e7eb", borderRadius: "11px",
  outline: "none", color: disabled ? (darkMode ? "#475569" : "#9ca3af") : "var(--text-main)",
  transition: "border-color 0.15s", boxSizing: "border-box",
  cursor: disabled ? "not-allowed" : "text",
});

const Label = ({ children, required, darkMode }) => (
  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: darkMode ? "#94a3b8" : "#4b5563", marginBottom: "6px" }}>
    {children}
    {required && <span style={{ color: "#f87171", marginLeft: "3px" }}>*</span>}
  </label>
);

// Reusable member picker used by both admin (assignedTo) and member (share)
function MemberPicker({ users, selectedIds, onToggle, excludeIds = [], darkMode }) {
  const visible = users.filter(u => !excludeIds.includes(u._id));
  if (visible.length === 0) {
    return <p style={{ fontSize: "12px", color: "#d1d5db", padding: "6px 0" }}>No other members available</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "180px", overflowY: "auto", padding: "2px" }}>
      {visible.map(u => {
        const isSelected = selectedIds.includes(u._id);
        const initials   = u.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        return (
          <button
            key={u._id}
            type="button"
            onClick={() => onToggle(u._id)}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "8px 12px", borderRadius: "10px", cursor: "pointer",
              border: isSelected ? "1.5px solid rgba(196,181,253,0.6)" : (darkMode ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid #e5e7eb"),
              background: isSelected ? (darkMode ? "rgba(139,92,246,0.15)" : "rgba(233,213,255,0.4)") : (darkMode ? "rgba(255,255,255,0.02)" : "rgba(249,250,251,0.6)"),
              transition: "all 0.15s", textAlign: "left",
            }}
          >
            <div style={{
              width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
              background: isSelected ? "linear-gradient(135deg,#c084fc,#818cf8)" : "linear-gradient(135deg,#e9d5ff,#c7d2fe)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", fontWeight: 700, color: isSelected ? "white" : "#7c3aed",
            }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: isSelected ? 600 : 400, color: isSelected ? (darkMode ? "#c084fc" : "#4c1d95") : "var(--text-main)" }}>
                {u.name}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#a78bfa", textTransform: "capitalize" }}>{u.role}</p>
            </div>
            {isSelected && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" fill="rgba(192,132,252,0.2)" stroke="#c084fc" strokeWidth="1.2"/>
                <path d="M4.5 7l2 2 3-3" stroke="#7c3aed" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function TaskFormModal({ task, onClose, onSaved }) {
  const { user }     = useAuth();
  const { darkMode } = useTheme();
  const toast        = useToast();
  const { users }    = useUsers();
  const { settings } = useSettings();
  const isEdit       = !!task;
  const isAdmin      = user?.role === "admin";

  const priorityMeta = getPriorityMeta(darkMode);
  const statusColors = getStatusColors(darkMode);

  const [form, setForm]       = useState(EMPTY_FORM);
  const [error, setError]             = useState("");
  const [conflictWarning, setConflict] = useState("");
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);

  // Share state — for members editing a task
  const [shareIds, setShareIds] = useState([]);
  const [sharing, setSharing]   = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [newLink, setNewLink]   = useState({ name: "", url: "" });

  // canEdit: admins edit everything; members have field-level restrictions
  const editableFields = isAdmin ? null : isEdit ? MEMBER_EDITABLE_UPDATE : MEMBER_EDITABLE_CREATE;
  const canEdit = (field) => isAdmin || editableFields?.includes(field);

  useEffect(() => {
    if (task) {
      let assignedIds = [];
      if (Array.isArray(task.assignedTo)) {
        assignedIds = task.assignedTo.map(u => (typeof u === "object" ? u._id : u));
      } else if (task.assignedTo) {
        assignedIds = [typeof task.assignedTo === "object" ? task.assignedTo._id : task.assignedTo];
      }
      setForm({
        title:          task.title        || "",
        description:    task.description  || "",
        assignedTo:     assignedIds,
        priority:       task.priority     || "Medium",
        category:       task.category     || "",
        startDate:      task.startDate ? task.startDate.split("T")[0] : "",
        dueDate:        task.dueDate ? task.dueDate.split("T")[0] : "",
        estimatedTime:  task.estimatedTime || "90",
        status:         task.status       || "Not Started",
        referenceLinks: (task.referenceLinks || []).join("\n"),
        attachments:    task.attachments    || [],
      });
    }
  }, [task]);

  const handle = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleAssignee = (userId) => {
    setForm(f => ({
      ...f,
      assignedTo: f.assignedTo.includes(userId)
        ? f.assignedTo.filter(id => id !== userId)
        : [...f.assignedTo, userId],
    }));
  };

  const toggleShareId = (userId) => {
    setShareIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (shareIds.length === 0) return;
    setSharing(true);
    setShareMsg("");
    try {
      await api.post(`/tasks/${task._id}/share`, { userIds: shareIds });
      setShareMsg("✓ Task shared successfully!");
      setShareIds([]);
      onSaved();
    } catch (err) {
      setShareMsg(err.response?.data?.message || "Failed to share task");
    } finally {
      setSharing(false);
    }
  };

  const performSubmit = async (force = false) => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        force,
        estimatedTime: form.estimatedTime ? Number(form.estimatedTime) : undefined,
        referenceLinks: form.referenceLinks
          ? form.referenceLinks.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
          : [],
      };

      if (!isAdmin) {
        const allowed = isEdit ? MEMBER_EDITABLE_UPDATE : MEMBER_EDITABLE_CREATE;
        Object.keys(payload).forEach(k => { if (!allowed.includes(k)) delete payload[k]; });
      }

      let response;
      if (isEdit) {
        response = await api.patch(`/tasks/${task._id}`, payload);
      } else {
        response = await api.post("/tasks", payload);
      }

      if (response.data.deadlineWarning) {
        toast.warning(response.data.deadlineWarning, 6000);
      }

      onClose();
      onSaved?.();
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        "Something went wrong"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    setError("");

    if (isAdmin && !isEdit && form.assignedTo.length === 0) {
      setError("Please assign at least one team member.");
      return;
    }

    performSubmit();
  };

  const PRIORITIES = settings.priorities.map(val =>
    priorityMeta[val]
      ? { val, ...priorityMeta[val] }
      : { val, dot: "#c084fc", bg: "rgba(233,213,255,0.4)", activeBorder: "rgba(196,181,253,0.6)", activeText: "#7c3aed" }
  );

  // IDs already on the task — excluded from share picker
  const currentAssigneeIds = form.assignedTo.map(String);

  const subtitle = isAdmin
    ? "Admin — full access"
    : isEdit
      ? "You can update description, time, status and links"
      : "Fill in the details — you'll be auto-assigned";

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: darkMode ? "rgba(15, 23, 42, 0.4)" : "rgba(79,50,130,0.18)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 50, padding: "16px",
      }}
    >
      <div
        style={{
          background: "var(--bg-modal)", backdropFilter: "blur(20px)",
          borderRadius: "22px", width: "100%", maxWidth: "500px",
          border: "1px solid var(--border-dim)",
          boxShadow: darkMode ? "0 20px 50px rgba(0,0,0,0.4)" : "0 24px 64px rgba(109,40,217,0.12)",
          maxHeight: "90vh", overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--border-dim)",
          background: darkMode ? "rgba(255,255,255,0.02)" : "linear-gradient(135deg, rgba(250,245,255,0.8), rgba(238,242,255,0.4))",
          position: "sticky", top: 0, zIndex: 1, borderRadius: "22px 22px 0 0",
        }}>
          <div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
              {isEdit ? "Edit task" : "Create new task"}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--accent-purple)", margin: "2px 0 0" }}>{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(196,181,253,0.15)", 
              border: "1px solid var(--border-dim)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--accent-purple)", fontSize: "16px",
            }}
          >×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {error && (
            <div style={{
              padding: "11px 14px", background: "rgba(254,242,242,0.8)",
              border: "1px solid rgba(252,165,165,0.4)", borderRadius: "11px",
              fontSize: "13px", color: "#be123c",
            }}>
              {error}
            </div>
          )}
          {conflictWarning && (
            <div style={{
              padding: "11px 14px", background: "rgba(255,251,235,0.8)",
              border: "1px solid rgba(253,211,77,0.4)", borderRadius: "11px",
              fontSize: "13px", color: "#92400e",
              display: "flex", alignItems: "center", gap: "8px"
            }}>
              <AlertTriangle size={14} strokeWidth={2} style={{ flexShrink: 0, color: "#f59e0b" }} />
              {conflictWarning}
            </div>
          )}

          {/* ── Title ─────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Label required darkMode={darkMode}>Title</Label>
            <input
              type="text"
              required
              name="title"
              disabled={!canEdit("title")}
              value={form.title}
              onChange={e => handle("title", e.target.value)}
              placeholder="Task title"
              style={{ ...inputStyle(!canEdit("title"), darkMode), height: "40px" }}
              onFocus={e => { if (canEdit("title")) e.target.style.borderColor = "var(--accent-purple)"; }}
              onBlur={e => e.target.style.borderColor = darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
            />
          </div>

          {/* ── Description ───────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Label darkMode={darkMode}>Description</Label>
            <textarea
              name="description"
              disabled={!canEdit("description")}
              value={form.description}
              onChange={e => handle("description", e.target.value)}
              rows={3}
              placeholder="Optional description…"
              style={{ ...inputStyle(!canEdit("description"), darkMode), resize: "none", lineHeight: 1.6, minHeight: "80px" }}
              onFocus={e => { if (canEdit("description")) e.target.style.borderColor = "var(--accent-purple)"; }}
              onBlur={e => e.target.style.borderColor = darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
            />
          </div>

          {/* ── Assigned to — Admin: full multi-select ────────── */}
          {isAdmin && (
            <div>
              <Label required darkMode={darkMode}>Assigned to</Label>
              <p style={{ fontSize: "11px", color: "var(--accent-purple)", margin: "0 0 8px" }}>
                Select one or more team members
              </p>
              <MemberPicker
                users={users}
                selectedIds={form.assignedTo}
                onToggle={toggleAssignee}
                darkMode={darkMode}
              />
            </div>
          )}

          {/* ── Also assign to — Member creating ──────────────── */}
          {!isAdmin && !isEdit && (
            <div>
              <Label darkMode={darkMode}>Also assign to</Label>
              <p style={{ fontSize: "11px", color: "var(--accent-purple)", margin: "0 0 8px" }}>
                You're auto-assigned. Optionally add teammates too.
              </p>
              <MemberPicker
                users={users}
                selectedIds={form.assignedTo}
                onToggle={toggleAssignee}
                excludeIds={[user?._id]}
                darkMode={darkMode}
              />
            </div>
          )}

          {/* ── Priority ──────────────────────────────────────── */}
          {canEdit("priority") && (
            <div>
              <Label darkMode={darkMode}>Priority</Label>
              <div style={{ display: "flex", gap: "8px" }}>
                {PRIORITIES.map(({ val, dot, bg, activeBorder, activeText }) => {
                  const isActive = form.priority === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handle("priority", val)}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: "10px",
                        background: isActive ? bg : (darkMode ? "rgba(255,255,255,0.02)" : "rgba(249,250,251,0.6)"),
                        border: isActive ? `1.5px solid ${activeBorder}` : (darkMode ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid #e5e7eb"),
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                        fontSize: "12px", fontWeight: isActive ? 600 : 400,
                        color: isActive ? activeText : "var(--text-muted)",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: dot, display: "inline-block", flexShrink: 0 }} />
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Category ──────────────────────────────────────── */}
          {canEdit("category") && (
            <div>
              <Label darkMode={darkMode}>Category</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => handle("category", "")}
                  style={{
                    padding: "5px 12px", borderRadius: "99px", fontSize: "12px",
                    border: !form.category 
                      ? (darkMode ? "1.5px solid rgba(167, 139, 250, 0.5)" : "1.5px solid rgba(124, 58, 237, 0.5)") 
                      : (darkMode ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid #e5e7eb"),
                    background: !form.category ? "rgba(139,92,246,0.15)" : "transparent",
                    color: !form.category ? "var(--accent-purple)" : "var(--text-muted)",
                    cursor: "pointer", fontWeight: !form.category ? 600 : 400, transition: "all 0.15s",
                  }}
                >
                  None
                </button>
                {settings.categories.map(cat => {
                  const isActive = form.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handle("category", cat)}
                      style={{
                        padding: "5px 12px", borderRadius: "99px", fontSize: "12px",
                        border: isActive 
                          ? (darkMode ? "1.5px solid rgba(167, 139, 250, 0.5)" : "1.5px solid rgba(124, 58, 237, 0.5)") 
                          : (darkMode ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid #e5e7eb"),
                        background: isActive ? "rgba(139,92,246,0.15)" : "transparent",
                        color: isActive ? "var(--accent-purple)" : "var(--text-muted)",
                        cursor: "pointer", fontWeight: isActive ? 600 : 400, transition: "all 0.15s",
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Schedule date + Estimated time ────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <Label darkMode={darkMode}>Start Date (Preferred)</Label>
              <input
                type="date"
                disabled={!canEdit("dueDate")}
                value={form.startDate}
                onChange={e => handle("startDate", e.target.value)}
                style={inputStyle(!canEdit("dueDate"), darkMode)}
              />
            </div>
            <div>
              <Label darkMode={darkMode}>Est. time (min)</Label>
              <select
                disabled={!canEdit("estimatedTime")}
                value={form.estimatedTime}
                onChange={e => handle("estimatedTime", e.target.value)}
                style={inputStyle(!canEdit("estimatedTime"), darkMode)}
              >
                {Array.from({ length: 16 }, (_, i) => (i + 1) * 30).map(min => (
                  <option key={min} value={min}>{min} minutes {min % 60 === 0 ? `(${min / 60}h)` : ""}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label required={canEdit("dueDate")} darkMode={darkMode}>Task Deadline</Label>
            <input
              type="date"
              required={canEdit("dueDate")}
              disabled={!canEdit("dueDate")}
              min={new Date().toISOString().split("T")[0]}
              value={form.dueDate}
              onChange={e => handle("dueDate", e.target.value)}
              style={inputStyle(!canEdit("dueDate"), darkMode)}
              onFocus={e => { if (canEdit("dueDate")) e.target.style.borderColor = "var(--accent-purple)"; }}
              onBlur={e => e.target.style.borderColor = darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
            />
          </div>

          {/* Multi-day hint */}
          {canEdit("estimatedTime") && (
            <div style={{
              padding: "10px 14px", borderRadius: "10px",
              background: darkMode ? "rgba(99,102,241,0.12)" : "rgba(238,242,255,0.6)", 
              border: "1px solid var(--border-dim)",
              fontSize: "12px", color: darkMode ? "#818cf8" : "#6366f1", lineHeight: 1.6,
              display: "flex", alignItems: "flex-start", gap: "8px"
            }}>
              <Lightbulb size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span><strong>Multi-day tasks:</strong> Every 480 min = 1 full working day. e.g. 960 min = 2 days on the calendar.</span>
            </div>
          )}

          {/* ── Status ────────────────────────────────────────── */}
          <div>
            <Label darkMode={darkMode}>Status</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {settings.statuses.map(s => {
                const sc       = statusColors[s] || { bg: "rgba(139,92,246,0.15)", text: "var(--accent-purple)", activeBorder: "rgba(139,92,246,0.3)" };
                const isActive = form.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!canEdit("status")}
                    onClick={() => canEdit("status") && handle("status", s)}
                    style={{
                      padding: "6px 12px", borderRadius: "10px", fontSize: "11px",
                      fontWeight: isActive ? 600 : 400,
                      background: isActive ? sc.bg : (darkMode ? "rgba(255,255,255,0.02)" : "rgba(249,250,251,0.6)"),
                      border: isActive ? `1.5px solid ${sc.activeBorder}` : (darkMode ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid #e5e7eb"),
                      color: isActive ? sc.text : "var(--text-muted)",
                      cursor: canEdit("status") ? "pointer" : "not-allowed",
                      opacity: canEdit("status") ? 1 : 0.5,
                      transition: "all 0.15s", textAlign: "center",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Files & Attachments ───────────────────────────── */}
          <div>
            <Label>Files & Attachments</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {form.attachments.map((file, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", background: "rgba(233,213,255,0.25)",
                  border: "1px solid rgba(196,181,253,0.3)", borderRadius: "10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                    <span style={{ display: "flex", alignItems: "center", color: "#7c3aed" }}>
                      {file.fileType === "file" ? <FileText size={15} strokeWidth={1.8} /> : <Link2 size={15} strokeWidth={1.8} />}
                    </span>
                    <span style={{ fontSize: "13px", color: "#4b5563", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handle("attachments", form.attachments.filter((_, idx) => idx !== i))}
                    style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "14px" }}
                  >×</button>
                </div>
              ))}
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    placeholder="Link URL (https://...)"
                    value={newLink.url}
                    onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                    style={{ ...inputStyle(false, darkMode), flex: 2, fontSize: "12px" }}
                  />
                  <input
                    placeholder="Tiny name (optional)"
                    value={newLink.name}
                    onChange={e => setNewLink({ ...newLink, name: e.target.value })}
                    style={{ ...inputStyle(false, darkMode), flex: 1, fontSize: "12px" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newLink.url) return;
                      if (form.attachments.length >= 8) {
                        setError("Maximum 8 attachments per task");
                        return;
                      }
                      handle("attachments", [...form.attachments, { 
                        name: newLink.name || newLink.url, 
                        url: newLink.url, 
                        fileType: "link" 
                      }]);
                      setNewLink({ name: "", url: "" });
                    }}
                    style={{
                      padding: "8px 16px", borderRadius: "10px",
                      background: "#7c3aed", color: "white", border: "none",
                      fontSize: "12px", fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    Add
                  </button>
                </div>

                <label style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "10px", borderRadius: "12px", border: darkMode ? "1.5px dashed rgba(255,255,255,0.15)" : "1.5px dashed rgba(196,181,253,0.5)",
                  background: darkMode ? "rgba(255,255,255,0.02)" : "rgba(250,245,255,0.4)", color: "var(--accent-purple)", fontSize: "12px",
                  fontWeight: 600, cursor: "pointer", transition: "all 0.15s"
                }}>
                  <Paperclip size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span>Upload File (Reference)</span>
                    <span style={{ fontSize: "10px", opacity: 0.7, fontWeight: 400 }}>Max 5MB</span>
                  </div>
                  <input
                    type="file"
                    style={{ display: "none" }}
                    disabled={form.attachments.length >= 8}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      // 1. Check file size (5MB limit)
                      if (file.size > 5 * 1024 * 1024) {
                        setError("File size exceeds 5MB limit");
                        return;
                      }

                      // 2. Check attachment count (Max 8)
                      if (form.attachments.length >= 8) {
                        setError("Maximum 8 attachments per task");
                        return;
                      }

                      const formData = new FormData();
                      formData.append("file", file);
                      try {
                        const res = await api.post("/tasks/upload", formData);
                        handle("attachments", [...form.attachments, res.data]);
                      } catch (err) {
                        setError(err.response?.data?.message || "Failed to upload file");
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* ── Share with teammates (member editing only) ────── */}
          {!isAdmin && isEdit && (
            <div style={{
              padding: "16px", borderRadius: "14px",
              background: darkMode ? "rgba(255,255,255,0.02)" : "rgba(250,245,255,0.6)", 
              border: "1px solid var(--border-dim)",
            }}>
              <Label darkMode={darkMode}>Share with teammates</Label>
              <p style={{ fontSize: "11px", color: "#a78bfa", margin: "0 0 10px" }}>
                Add members to this task — they'll see it on their calendar too
              </p>
              <MemberPicker
                users={users}
                selectedIds={shareIds}
                onToggle={toggleShareId}
                excludeIds={currentAssigneeIds}
                darkMode={darkMode}
              />
              {shareMsg && (
                <p style={{
                  fontSize: "12px", margin: "10px 0 0", fontWeight: 500,
                  color: shareMsg.startsWith("✓") ? "#10b981" : "#ef4444",
                }}>
                  {shareMsg}
                </p>
              )}
              {shareIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={sharing}
                  style={{
                    marginTop: "12px", padding: "8px 18px", borderRadius: "10px",
                    fontSize: "13px", fontWeight: 600,
                    background: "linear-gradient(135deg, #c084fc, #818cf8)",
                    border: "none", color: "white",
                    cursor: sharing ? "not-allowed" : "pointer",
                    opacity: sharing ? 0.7 : 1, transition: "opacity 0.15s", fontFamily: "inherit",
                  }}
                >
                  {sharing ? "Sharing…" : `Share with ${shareIds.length} member${shareIds.length > 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          )}

          {/* ── Actions ───────────────────────────────────────── */}
          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 500,
                background: "transparent", border: "1px solid var(--border-dim)",
                color: "var(--text-muted)", cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(233,213,255,0.2)"; e.currentTarget.style.color = "var(--accent-purple)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!isAdmin && isEdit && shareIds.length > 0)}
              style={{
                flex: 2, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
                background: (loading || (!isAdmin && isEdit && shareIds.length > 0)) ? "#e9d5ff" : "linear-gradient(135deg,#c084fc,#818cf8)",
                border: "none", color: "white", cursor: (loading || (!isAdmin && isEdit && shareIds.length > 0)) ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(139,92,246,0.25)", transition: "opacity 0.15s",
                opacity: (loading || (!isAdmin && isEdit && shareIds.length > 0)) ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!loading && (isAdmin || !isEdit || shareIds.length === 0)) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { if (!loading && (isAdmin || !isEdit || shareIds.length === 0)) e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? "Saving…" : isEdit ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>

      {showConflictConfirm && (
        <ConflictToast
          message={conflictWarning}
          onConfirm={() => performSubmit(true)}
          onDismiss={() => setShowConflictConfirm(false)}
        />
      )}

      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&display=swap" rel="stylesheet" />
    </div>
  );
}