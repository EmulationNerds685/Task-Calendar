import useUsers from "../hooks/useUsers";

const selectStyle = (active) => ({
  padding: "7px 28px 7px 12px", borderRadius: "10px", fontSize: "13px", fontWeight: 500,
  background: active ? "rgba(233,213,255,0.3)" : "rgba(255,255,255,0.85)",
  border: active ? "1px solid rgba(196,181,253,0.6)" : "1px solid rgba(196,181,253,0.3)",
  color: active ? "#7c3aed" : "#4b5563", cursor: "pointer", outline: "none",
  backdropFilter: "blur(8px)", transition: "all 0.15s", appearance: "none",
  fontFamily: "inherit",
});

const dateInputStyle = (active) => ({
  padding: "7px 12px", borderRadius: "10px", fontSize: "13px", fontWeight: 500,
  background: active ? "rgba(233,213,255,0.3)" : "rgba(255,255,255,0.85)",
  border: active ? "1px solid rgba(196,181,253,0.6)" : "1px solid rgba(196,181,253,0.3)",
  color: active ? "#7c3aed" : "#4b5563", cursor: "pointer", outline: "none",
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
  const { users } = useUsers();
  const handle = (key, val) => onChange({ ...filters, [key]: val });

  const hasFilters = filters.status || filters.priority || filters.category
    || filters.assignedTo || filters.dueDateFrom || filters.dueDateTo;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>

      {/* Status */}
      <div style={{ position: "relative" }}>
        <select
          value={filters.status || ""}
          onChange={e => handle("status", e.target.value)}
          style={selectStyle(!!filters.status)}
          onFocus={e => e.target.style.borderColor = "#c084fc"}
          onBlur={e => e.target.style.borderColor = filters.status ? "rgba(196,181,253,0.6)" : "rgba(196,181,253,0.3)"}
        >
          <option value="">All statuses</option>
          <option>Not Started</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Overdue</option>
        </select>
        <ChevronIcon active={!!filters.status} />
      </div>

      {/* Priority */}
      <div style={{ position: "relative" }}>
        <select
          value={filters.priority || ""}
          onChange={e => handle("priority", e.target.value)}
          style={selectStyle(!!filters.priority)}
          onFocus={e => e.target.style.borderColor = "#c084fc"}
          onBlur={e => e.target.style.borderColor = filters.priority ? "rgba(196,181,253,0.6)" : "rgba(196,181,253,0.3)"}
        >
          <option value="">All priorities</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <ChevronIcon active={!!filters.priority} />
      </div>

      {/* Category */}
      <div style={{ position: "relative" }}>
        <select
          value={filters.category || ""}
          onChange={e => handle("category", e.target.value)}
          style={selectStyle(!!filters.category)}
          onFocus={e => e.target.style.borderColor = "#c084fc"}
          onBlur={e => e.target.style.borderColor = filters.category ? "rgba(196,181,253,0.6)" : "rgba(196,181,253,0.3)"}
        >
          <option value="">All categories</option>
          <option>Research</option>
          <option>Admin</option>
          <option>Investment Analysis</option>
          <option>Compliance</option>
          <option>Operations</option>
        </select>
        <ChevronIcon active={!!filters.category} />
      </div>

      {/* Assigned to — person filter */}
      {users.length > 0 && (
        <div style={{ position: "relative" }}>
          <select
            value={filters.assignedTo || ""}
            onChange={e => handle("assignedTo", e.target.value)}
            style={selectStyle(!!filters.assignedTo)}
            onFocus={e => e.target.style.borderColor = "#c084fc"}
            onBlur={e => e.target.style.borderColor = filters.assignedTo ? "rgba(196,181,253,0.6)" : "rgba(196,181,253,0.3)"}
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
          style={dateInputStyle(!!filters.dueDateFrom)}
          onFocus={e => e.target.style.borderColor = "#c084fc"}
          onBlur={e => e.target.style.borderColor = filters.dueDateFrom ? "rgba(196,181,253,0.6)" : "rgba(196,181,253,0.3)"}
        />
        <span style={{ fontSize: "12px", color: "#d1d5db" }}>—</span>
        <input
          type="date"
          value={filters.dueDateTo || ""}
          onChange={e => handle("dueDateTo", e.target.value)}
          style={dateInputStyle(!!filters.dueDateTo)}
          onFocus={e => e.target.style.borderColor = "#c084fc"}
          onBlur={e => e.target.style.borderColor = filters.dueDateTo ? "rgba(196,181,253,0.6)" : "rgba(196,181,253,0.3)"}
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
          onMouseEnter={e => e.currentTarget.style.background = "rgba(233,213,255,0.3)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          ✕ Clear filters
        </button>
      )}
    </div>
  );
}