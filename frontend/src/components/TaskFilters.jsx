import useUsers from "../hooks/useUsers";
import useSettings from "../hooks/useSettings"; // CHANGE #4
import { useTheme } from "../context/ThemeContext";
import { X } from "lucide-react";

const selectStyle = (active, darkMode) => ({
  padding: "7px 28px 7px 12px", borderRadius: "10px", fontSize: "13px", fontWeight: 500,
  background: active 
    ? (darkMode ? "rgba(139,92,246,0.15)" : "rgba(233,213,255,0.3)") 
    : "var(--bg-card)",
  border: active 
    ? (darkMode ? "1px solid rgba(167, 139, 250, 0.6)" : "1px solid rgba(124, 58, 237, 0.6)") 
    : "1px solid var(--border-dim)",
  color: active ? "var(--accent-purple)" : "var(--text-muted)", cursor: "pointer", outline: "none",
  backdropFilter: "blur(8px)", transition: "all 0.15s", appearance: "none",
  fontFamily: "inherit",
});

const dateInputStyle = (active, darkMode) => ({
  padding: "7px 12px", borderRadius: "10px", fontSize: "13px", fontWeight: 500,
  background: active 
    ? (darkMode ? "rgba(139,92,246,0.15)" : "rgba(233,213,255,0.3)") 
    : "var(--bg-card)",
  border: active 
    ? "1px solid var(--accent-purple)60" 
    : "1px solid var(--border-dim)",
  color: active ? "var(--accent-purple)" : "var(--text-muted)", cursor: "pointer", outline: "none",
  backdropFilter: "blur(8px)", transition: "all 0.15s", fontFamily: "inherit",
});

const ChevronIcon = ({ active }) => (
  <svg
    style={{ position: "absolute", right: "9px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
    width="10" height="10" viewBox="0 0 10 10" fill="none"
  >
    <path d="M2 3.5L5 6.5L8 3.5" stroke={active ? "#a78bfa" : "#9ca3af"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function TaskFilters({ filters, onChange }) {
  const { darkMode } = useTheme();
  const { users } = useUsers();
  const { settings } = useSettings(); // CHANGE #4: dynamic values

  const handle = (key, val) => onChange({ ...filters, [key]: val });

  const hasFilters = filters.status || filters.priority || filters.category
    || filters.assignedTo || filters.dueDateFrom || filters.dueDateTo;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>

      {/* Status — CHANGE #4 */}
      <div style={{ position: "relative" }}>
        <select
          value={filters.status || ""}
          onChange={e => handle("status", e.target.value)}
          style={selectStyle(!!filters.status, darkMode)}
          onFocus={e => e.target.style.borderColor = "var(--accent-purple)"}
          onBlur={e => e.target.style.borderColor = filters.status ? (darkMode ? "rgba(167, 139, 250, 0.6)" : "rgba(124, 58, 237, 0.6)") : "var(--border-dim)"}
        >
          <option value="">All statuses</option>
          {settings.statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <ChevronIcon active={!!filters.status} />
      </div>

      {/* Priority — CHANGE #4 */}
      <div style={{ position: "relative" }}>
        <select
          value={filters.priority || ""}
          onChange={e => handle("priority", e.target.value)}
          style={selectStyle(!!filters.priority, darkMode)}
          onFocus={e => e.target.style.borderColor = "var(--accent-purple)"}
          onBlur={e => e.target.style.borderColor = filters.priority ? (darkMode ? "rgba(167, 139, 250, 0.6)" : "rgba(124, 58, 237, 0.6)") : "var(--border-dim)"}
        >
          <option value="">All priorities</option>
          {settings.priorities.map(p => <option key={p}>{p}</option>)}
        </select>
        <ChevronIcon active={!!filters.priority} />
      </div>

      {/* Category — CHANGE #4 */}
      <div style={{ position: "relative" }}>
        <select
          value={filters.category || ""}
          onChange={e => handle("category", e.target.value)}
          style={selectStyle(!!filters.category, darkMode)}
          onFocus={e => e.target.style.borderColor = "var(--accent-purple)"}
          onBlur={e => e.target.style.borderColor = filters.category ? (darkMode ? "rgba(167, 139, 250, 0.6)" : "rgba(124, 58, 237, 0.6)") : "var(--border-dim)"}
        >
          <option value="">All categories</option>
          {settings.categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <ChevronIcon active={!!filters.category} />
      </div>

      {/* Assigned to */}
      {users.length > 0 && (
        <div style={{ position: "relative" }}>
          <select
            value={filters.assignedTo || ""}
            onChange={e => handle("assignedTo", e.target.value)}
            style={selectStyle(!!filters.assignedTo, darkMode)}
            onFocus={e => e.target.style.borderColor = "var(--accent-purple)"}
            onBlur={e => e.target.style.borderColor = filters.assignedTo ? (darkMode ? "rgba(167, 139, 250, 0.6)" : "rgba(124, 58, 237, 0.6)") : "var(--border-dim)"}
          >
            <option value="">All members</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
          <ChevronIcon active={!!filters.assignedTo} />
        </div>
      )}

      {/* Date range */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "12px", color: "#c4b5fd", fontWeight: 500, whiteSpace: "nowrap" }}>Due:</span>
        <input
          type="date"
          value={filters.dueDateFrom || ""}
          onChange={e => handle("dueDateFrom", e.target.value)}
          style={dateInputStyle(!!filters.dueDateFrom, darkMode)}
          onFocus={e => e.target.style.borderColor = "var(--accent-purple)"}
          onBlur={e => e.target.style.borderColor = filters.dueDateFrom ? (darkMode ? "rgba(167, 139, 250, 0.6)" : "rgba(124, 58, 237, 0.6)") : "var(--border-dim)"}
        />
        <span style={{ fontSize: "12px", color: "#d1d5db" }}>—</span>
        <input
          type="date"
          value={filters.dueDateTo || ""}
          onChange={e => handle("dueDateTo", e.target.value)}
          style={dateInputStyle(!!filters.dueDateTo, darkMode)}
          onFocus={e => e.target.style.borderColor = "var(--accent-purple)"}
          onBlur={e => e.target.style.borderColor = filters.dueDateTo ? (darkMode ? "rgba(167, 139, 250, 0.6)" : "rgba(124, 58, 237, 0.6)") : "var(--border-dim)"}
        />
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={() => onChange({})}
          style={{
            padding: "7px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 500,
            background: "transparent", border: "1px solid rgba(196,181,253,0.3)",
            color: "#a78bfa", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit"
          }}
          onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(233,213,255,0.3)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <X size={12} strokeWidth={2.5} /> Clear filters
          </span>
        </button>
      )}
    </div>
  );
}