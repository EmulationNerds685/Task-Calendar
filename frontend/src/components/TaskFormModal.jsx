import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import useUsers from "../hooks/useUsers";

const EMPTY_FORM = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "Medium",
  category: "",
  dueDate: "",
  estimatedTime: "",
  status: "Not Started",
};

const PRIORITIES = [
  { val: "High",   dot: "#ef4444", bg: "rgba(254,242,242,0.7)", activeBorder: "rgba(252,165,165,0.6)", activeText: "#ef4444" },
  { val: "Medium", dot: "#f59e0b", bg: "rgba(255,251,235,0.7)", activeBorder: "rgba(253,211,77,0.6)",  activeText: "#f59e0b" },
  { val: "Low",    dot: "#10b981", bg: "rgba(236,253,245,0.7)", activeBorder: "rgba(110,231,183,0.6)", activeText: "#10b981" },
];

const CATEGORIES = ["Research", "Admin", "Investment Analysis", "Compliance", "Operations"];
const STATUSES = ["Not Started", "In Progress", "Completed", "Overdue"];

const statusColors = {
  "Not Started": { bg: "#f1f5f9", text: "#64748b", activeBorder: "#94a3b8" },
  "In Progress":  { bg: "rgba(238,242,255,0.8)", text: "#6366f1", activeBorder: "#818cf8" },
  "Completed":    { bg: "rgba(236,253,245,0.8)", text: "#10b981", activeBorder: "#34d399" },
  "Overdue":      { bg: "rgba(254,242,242,0.8)", text: "#ef4444", activeBorder: "#f87171" },
};

const inputStyle = (disabled = false) => ({
  width: "100%", padding: "9px 13px", fontSize: "13px", fontFamily: "inherit",
  background: disabled ? "rgba(249,250,251,0.6)" : "#fafafa",
  border: "1.5px solid #e5e7eb", borderRadius: "11px",
  outline: "none", color: disabled ? "#9ca3af" : "#1f2937",
  transition: "border-color 0.15s", boxSizing: "border-box",
  cursor: disabled ? "not-allowed" : "text"
});

const Label = ({ children, required }) => (
  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#4b5563", marginBottom: "6px" }}>
    {children}
    {required && <span style={{ color: "#f87171", marginLeft: "3px" }}>*</span>}
  </label>
);

export default function TaskFormModal({ task, onClose, onSaved }) {
  const { user } = useAuth();
  const { users } = useUsers();
  const isEdit = !!task;
  const isAdmin = user?.role === "admin";

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        assignedTo: task.assignedTo?._id || task.assignedTo || "",
        priority: task.priority || "Medium",
        category: task.category || "",
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        estimatedTime: task.estimatedTime || "",
        status: task.status || "Not Started",
      });
    }
  }, [task]);

  const handle = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        estimatedTime: form.estimatedTime ? Number(form.estimatedTime) : undefined,
      };
      if (isEdit) {
        await api.patch(`/tasks/${task._id}`, payload);
      } else {
        await api.post("/tasks", payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

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
          borderRadius: "22px", width: "100%", maxWidth: "500px",
          border: "1px solid rgba(196,181,253,0.25)",
          boxShadow: "0 24px 64px rgba(109,40,217,0.12), 0 0 0 1px rgba(255,255,255,0.8)",
          maxHeight: "90vh", overflowY: "auto"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(196,181,253,0.15)",
          background: "linear-gradient(135deg, rgba(250,245,255,0.8), rgba(238,242,255,0.4))",
          position: "sticky", top: 0, zIndex: 1, borderRadius: "22px 22px 0 0"
        }}>
          <div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 700, color: "#1e1b4b", margin: 0 }}>
              {isEdit ? "Edit task" : "Create new task"}
            </h2>
            <p style={{ fontSize: "12px", color: "#a78bfa", margin: "2px 0 0" }}>
              {isAdmin ? "Admin — full access" : "Update task "}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: "rgba(196,181,253,0.15)", border: "1px solid rgba(196,181,253,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#a78bfa", fontSize: "16px"
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {error && (
            <div style={{
              padding: "11px 14px", background: "rgba(254,242,242,0.8)",
              border: "1px solid rgba(252,165,165,0.4)", borderRadius: "11px",
              fontSize: "13px", color: "#be123c"
            }}>
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <Label required>Title</Label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={form.title}
              onChange={e => handle("title", e.target.value)}
              placeholder="Task title"
              style={inputStyle(!isAdmin)}
              onFocus={e => { if (isAdmin) e.target.style.borderColor = "#c084fc"; }}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <textarea
              disabled={false}
              value={form.description}
              onChange={e => handle("description", e.target.value)}
              rows={3}
              placeholder="Optional description…"
              style={{ ...inputStyle(!isAdmin), resize: "none", lineHeight: 1.6 }}
              onFocus={e => { if (isAdmin) e.target.style.borderColor = "#c084fc"; }}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          {/* Assigned to — admin only */}
          {isAdmin && (
            <div>
              <Label required>Assigned to</Label>
              <div style={{ position: "relative" }}>
                <select
                  required
                  value={form.assignedTo}
                  onChange={e => handle("assignedTo", e.target.value)}
                  style={{ ...inputStyle(false), paddingRight: "32px", appearance: "none", cursor: "pointer" }}
                  onFocus={e => e.target.style.borderColor = "#c084fc"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                >
                  <option value="">Select a team member</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
                <svg style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          )}

          {/* Priority picker */}
          <div>
            <Label>Priority</Label>
            <div style={{ display: "flex", gap: "8px" }}>
              {PRIORITIES.map(({ val, dot, bg, activeBorder, activeText }) => {
                const isActive = form.priority === val;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => handle("priority", val)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: "10px",
                      background: isActive ? bg : "rgba(249,250,251,0.6)",
                      border: isActive ? `1.5px solid ${activeBorder}` : "1.5px solid #e5e7eb",
                      cursor: isAdmin ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      fontSize: "12px", fontWeight: isActive ? 600 : 400,
                      color: isActive ? activeText : "#9ca3af",
                      transition: "all 0.15s", opacity: !isAdmin ? 0.5 : 1
                    }}
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: dot, display: "inline-block", flexShrink: 0 }} />
                    {val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <button
                type="button"
                disabled={!isAdmin}
                onClick={() => handle("category", "")}
                style={{
                  padding: "5px 12px", borderRadius: "99px", fontSize: "12px",
                  border: !form.category ? "1.5px solid rgba(196,181,253,0.5)" : "1.5px solid #e5e7eb",
                  background: !form.category ? "rgba(233,213,255,0.4)" : "transparent",
                  color: !form.category ? "#7c3aed" : "#9ca3af",
                  cursor: isAdmin ? "pointer" : "not-allowed", fontWeight: !form.category ? 600 : 400,
                  opacity: !isAdmin ? 0.5 : 1, transition: "all 0.15s"
                }}
              >
                None
              </button>
              {CATEGORIES.map(cat => {
                const isActive = form.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => handle("category", cat)}
                    style={{
                      padding: "5px 12px", borderRadius: "99px", fontSize: "12px",
                      border: isActive ? "1.5px solid rgba(196,181,253,0.5)" : "1.5px solid #e5e7eb",
                      background: isActive ? "rgba(233,213,255,0.4)" : "transparent",
                      color: isActive ? "#7c3aed" : "#9ca3af",
                      cursor: isAdmin ? "pointer" : "not-allowed", fontWeight: isActive ? 600 : 400,
                      opacity: !isAdmin ? 0.5 : 1, transition: "all 0.15s"
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due date + Estimated time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <Label required>Due date</Label>
              <input
                type="date"
                required
                disabled={!isAdmin}
                value={form.dueDate}
                onChange={e => handle("dueDate", e.target.value)}
                style={inputStyle(!isAdmin)}
                onFocus={e => { if (isAdmin) e.target.style.borderColor = "#c084fc"; }}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
            <div>
              <Label>Est. time (min)</Label>
              <input
                type="number"
                min={1}
                disabled={false}
                value={form.estimatedTime}
                onChange={e => handle("estimatedTime", e.target.value)}
                placeholder="e.g. 90"
                style={inputStyle(!isAdmin)}
                onFocus={e => { if (isAdmin) e.target.style.borderColor = "#c084fc"; }}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px" }}>
              {STATUSES.map(s => {
                const sc = statusColors[s];
                const isActive = form.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handle("status", s)}
                    style={{
                      padding: "7px 4px", borderRadius: "10px", fontSize: "11px", fontWeight: isActive ? 600 : 400,
                      background: isActive ? sc.bg : "rgba(249,250,251,0.6)",
                      border: isActive ? `1.5px solid ${sc.activeBorder}` : "1.5px solid #e5e7eb",
                      color: isActive ? sc.text : "#9ca3af",
                      cursor: "pointer", transition: "all 0.15s", textAlign: "center"
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 500,
                background: "transparent", border: "1px solid rgba(196,181,253,0.35)",
                color: "#9ca3af", cursor: "pointer", transition: "all 0.15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(233,213,255,0.2)"; e.currentTarget.style.color = "#7c3aed"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, padding: "10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
                background: loading ? "#d8b4fe" : "linear-gradient(135deg,#c084fc,#818cf8)",
                border: "none", color: "white", cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(139,92,246,0.25)", transition: "opacity 0.15s"
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              {loading ? "Saving…" : isEdit ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&display=swap" rel="stylesheet" />
    </div>
  );
}