import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Layout from "../../components/Layout";
import TaskCard from "../../components/TaskCard";
import TaskFilters from "../../components/TaskFilters";
import TaskFormModal from "../../components/TaskFormModal";
import TaskDetailModal from "../../components/TaskDetailModal";
import useTasks from "../../hooks/useTasks";
import dayjs from "dayjs";

const KANBAN_COLUMNS = ["Not Started", "In Progress", "Completed", "Overdue"];

const columnStyle = {
  "Not Started": { accent: "#94a3b8", bg: "rgba(241,245,249,0.8)", dot: "#94a3b8" },
  "In Progress":  { accent: "#818cf8", bg: "rgba(238,242,255,0.8)", dot: "#818cf8" },
  "Completed":    { accent: "#34d399", bg: "rgba(236,253,245,0.8)", dot: "#34d399" },
  "Overdue":      { accent: "#f87171", bg: "rgba(254,242,242,0.8)", dot: "#f87171" },
};

const priorityConfig = {
  High:   { bg: "rgba(254,242,242,0.8)", text: "#ef4444", border: "rgba(252,165,165,0.4)", dot: "#ef4444" },
  Medium: { bg: "rgba(255,251,235,0.8)", text: "#f59e0b", border: "rgba(253,211,77,0.4)",  dot: "#f59e0b" },
  Low:    { bg: "rgba(236,253,245,0.8)", text: "#10b981", border: "rgba(110,231,183,0.4)", dot: "#10b981" },
};

const statusConfig = {
  "Not Started": { bg: "#f1f5f9",              text: "#64748b" },
  "In Progress":  { bg: "rgba(238,242,255,0.9)", text: "#6366f1" },
  "Completed":    { bg: "rgba(236,253,245,0.9)", text: "#10b981" },
  "Overdue":      { bg: "rgba(254,242,242,0.9)", text: "#ef4444" },
};

// CHANGE #2: 5th card for total active tasks
const summaryCards = [
  {
    key: "active",
    label: "Active tasks",
    color: "#7c3aed",
    bg: "rgba(250,245,255,0.7)",
    border: "rgba(196,181,253,0.4)",
    getFilter: () => ({}), // clears filters
    getCount: (tasks) => tasks.filter(t => t.status !== "Completed").length,
  },
  {
    key: "overdue",
    label: "Overdue",
    color: "#ef4444",
    bg: "rgba(254,242,242,0.7)",
    border: "rgba(252,165,165,0.4)",
    getFilter: () => ({ status: "Overdue" }),
    getCount: (tasks) => tasks.filter(t => t.status === "Overdue").length,
  },
  {
    key: "today",
    label: "Due today",
    color: "#f59e0b",
    bg: "rgba(255,251,235,0.7)",
    border: "rgba(253,211,77,0.4)",
    getFilter: () => ({ dueDateFrom: dayjs().format("YYYY-MM-DD"), dueDateTo: dayjs().format("YYYY-MM-DD") }),
    getCount: (tasks) => tasks.filter(t => dayjs(t.dueDate).isSame(dayjs().startOf("day"), "day")).length,
  },
  {
    key: "upcoming",
    label: "Upcoming",
    color: "#818cf8",
    bg: "rgba(238,242,255,0.7)",
    border: "rgba(196,181,253,0.4)",
    getFilter: () => ({ dueDateFrom: dayjs().add(1, "day").format("YYYY-MM-DD") }),
    getCount: (tasks) => tasks.filter(t => dayjs(t.dueDate).isAfter(dayjs().startOf("day")) && t.status !== "Completed").length,
  },
  {
    key: "done",
    label: "Completed",
    color: "#34d399",
    bg: "rgba(236,253,245,0.7)",
    border: "rgba(110,231,183,0.4)",
    getFilter: () => ({ status: "Completed" }),
    getCount: (tasks) => tasks.filter(t => t.status === "Completed").length,
  },
];

// CHANGE #1: Table row component for list view
function TableRow({ task, onClick }) {
  const pc = priorityConfig[task.priority] || priorityConfig.Medium;
  const sc = statusConfig[task.status] || statusConfig["Not Started"];

  // CHANGE #3: multi-assignee
  const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : task.assignedTo ? [task.assignedTo] : [];
  const assigneeNames = assignees.map(a => a?.name || "").filter(Boolean).join(", ") || "—";

  return (
    <tr
      onClick={() => onClick(task)}
      style={{ borderBottom: "1px solid rgba(196,181,253,0.1)", cursor: "pointer", transition: "background 0.12s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(233,213,255,0.12)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Title */}
      <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 600, color: "#1f2937", maxWidth: "240px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</span>
          {task.category && (
            <span style={{ fontSize: "10px", color: "#7c3aed", fontWeight: 500, background: "rgba(233,213,255,0.4)", border: "1px solid rgba(196,181,253,0.3)", padding: "1px 7px", borderRadius: "99px", width: "fit-content" }}>
              {task.category}
            </span>
          )}
        </div>
      </td>
      {/* Assignee */}
      <td style={{ padding: "12px 14px", fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" }}>
        {assigneeNames}
      </td>
      {/* Priority */}
      <td style={{ padding: "12px 14px" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          padding: "3px 9px", borderRadius: "99px",
          background: pc.bg, border: `1px solid ${pc.border}`,
          fontSize: "11px", fontWeight: 600, color: pc.text, whiteSpace: "nowrap"
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: pc.dot, display: "inline-block" }} />
          {task.priority}
        </span>
      </td>
      {/* Status */}
      <td style={{ padding: "12px 14px" }}>
        <span style={{
          padding: "3px 9px", borderRadius: "99px",
          background: sc.bg, fontSize: "11px", fontWeight: 600, color: sc.text, whiteSpace: "nowrap"
        }}>
          {task.status}
        </span>
      </td>
      {/* Due date */}
      <td style={{ padding: "12px 14px", fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>
        {task.dueDate ? dayjs(task.dueDate).format("MMM D, YYYY") : "—"}
      </td>
      {/* Scheduled slot */}
      <td style={{ padding: "12px 14px", fontSize: "12px", color: "#818cf8", whiteSpace: "nowrap" }}>
        {task.scheduledSlot
          ? (
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="2" width="10" height="9" rx="2" stroke="#818cf8" strokeWidth="1" fill="none"/>
                <path d="M4 1v2M8 1v2M1 5h10" stroke="#818cf8" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              {task.scheduledSlot}
            </span>
          )
          : <span style={{ color: "#d1d5db" }}>—</span>
        }
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // CHANGE #1: view state now includes "table"
  const [view, setView] = useState("cards");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTask, setEditTask] = useState(null);

  const { tasks, pagination, loading, error, refetch } = useTasks({ ...filters, page, limit: 10 });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const viewOptions = [
    { key: "cards", label: "☰ Cards" },
    { key: "table", label: "⊟ Table" },
    { key: "kanban", label: "⊞ Board" },
  ];

  return (
    <Layout>
      <div style={{ padding: "28px 32px", maxWidth: "1280px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <p style={{ fontSize: "13px", color: "#a78bfa", fontWeight: 500, margin: "0 0 4px" }}>
              {dayjs().format("dddd, MMMM D")}
            </p>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "26px", fontWeight: 700, color: "#1e1b4b", margin: 0 }}>
              {greeting}, {user?.name?.split(" ")[0]} ✦
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* CHANGE #1: Three-way view toggle */}
            <div style={{
              display: "flex", alignItems: "center", gap: "2px",
              background: "rgba(255,255,255,0.8)", border: "1px solid rgba(196,181,253,0.3)",
              borderRadius: "12px", padding: "3px"
            }}>
              {viewOptions.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  style={{
                    padding: "6px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 500,
                    border: "none", cursor: "pointer", transition: "all 0.15s",
                    background: view === key ? "linear-gradient(135deg, #e9d5ff, #c7d2fe)" : "transparent",
                    color: view === key ? "#6d28d9" : "#9ca3af",
                    boxShadow: view === key ? "0 1px 4px rgba(139,92,246,0.15)" : "none",
                    fontFamily: "inherit"
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* FIX: all roles can create tasks — members auto-assign to themselves */}
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: "8px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
                background: "linear-gradient(135deg, #c084fc, #818cf8)",
                border: "none", color: "white", cursor: "pointer",
                boxShadow: "0 4px 14px rgba(139,92,246,0.3)", transition: "opacity 0.2s",
                fontFamily: "inherit"
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              + New task
            </button>
          </div>
        </div>

        {/* CHANGE #2: 5-card summary row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {summaryCards.map(({ key, label, color, bg, border, getFilter, getCount }) => {
            const count = getCount(tasks);
            const isActive = JSON.stringify(filters) === JSON.stringify(getFilter());
            return (
              <div
                key={key}
                onClick={() => handleFilterChange(isActive ? {} : getFilter())}
                style={{
                  background: bg,
                  border: `1px solid ${isActive ? color + "80" : border}`,
                  borderRadius: "16px", padding: "16px 18px", cursor: "pointer",
                  transition: "all 0.2s", backdropFilter: "blur(8px)",
                  boxShadow: isActive ? `0 4px 16px ${border}` : "none",
                  transform: isActive ? "translateY(-1px)" : "none"
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = `0 8px 24px ${border}`;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 6px", fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: "26px", fontWeight: 700, color, margin: 0, lineHeight: 1 }}>{count}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ marginBottom: "20px" }}>
          <TaskFilters filters={filters} onChange={handleFilterChange} />
        </div>

        {error && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "12px", fontSize: "13px", color: "#be123c" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid #e9d5ff", borderTopColor: "#a78bfa", animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🌸</div>
            <p style={{ fontSize: "15px", color: "#9ca3af" }}>No tasks found</p>
            {isAdmin && <p style={{ fontSize: "13px", color: "#c4b5fd" }}>Create your first task to get started</p>}
          </div>

        ) : view === "cards" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
              {tasks.map(task => (
                <TaskCard key={task._id} task={task} onClick={() => setSelectedTask(task)} />
              ))}
            </div>
            <Pagination page={page} pagination={pagination} setPage={setPage} />
          </>

        ) : view === "table" ? (
          /* CHANGE #1: Table list view */
          <>
            <div style={{
              background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(196,181,253,0.18)", borderRadius: "18px",
              overflow: "hidden", boxShadow: "0 2px 12px rgba(139,92,246,0.05)"
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(196,181,253,0.2)", background: "rgba(250,245,255,0.5)" }}>
                      {["Title", "Assignee", "Priority", "Status", "Deadline", "Scheduled slot"].map((h, i) => (
                        <th key={h} style={{
                          padding: "12px 14px",
                          fontSize: "11px", fontWeight: 600, color: "#c4b5fd",
                          textAlign: "left",
                          textTransform: "uppercase", letterSpacing: "0.05em",
                          whiteSpace: "nowrap"
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <TableRow key={task._id} task={task} onClick={() => setSelectedTask(task)} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={page} pagination={pagination} setPage={setPage} />
          </>

        ) : (
          /* Kanban view */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
            {KANBAN_COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col);
              const cs = columnStyle[col];
              return (
                <div key={col} style={{
                  background: cs.bg, borderRadius: "16px",
                  border: `1px solid ${cs.accent}30`,
                  borderTop: `3px solid ${cs.accent}`,
                  padding: "16px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: cs.dot }} />
                      <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#374151", margin: 0 }}>{col}</h3>
                    </div>
                    <span style={{
                      fontSize: "11px", padding: "2px 8px", borderRadius: "99px",
                      background: "rgba(255,255,255,0.7)", border: "1px solid rgba(196,181,253,0.2)",
                      color: "#6b7280", fontWeight: 600
                    }}>
                      {colTasks.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {colTasks.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "#d1d5db", textAlign: "center", padding: "20px 0" }}>Empty</p>
                    ) : (
                      colTasks.map(task => (
                        <TaskCard key={task._id} task={task} onClick={() => setSelectedTask(task)} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <TaskFormModal onClose={() => setShowCreateModal(false)} onSaved={refetch} />
      )}
      {selectedTask && !editTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={task => { setSelectedTask(null); setEditTask(task); }}
          onSaved={refetch}
          onDeleted={refetch}
        />
      )}
      {editTask && (
        <TaskFormModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSaved={refetch}
        />
      )}
    </Layout>
  );
}

function Pagination({ page, pagination, setPage }) {
  if (!pagination?.totalPages || pagination.totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "32px" }}>
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        style={{
          padding: "7px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 500,
          border: "1px solid rgba(196,181,253,0.3)", background: "white", color: "#7c3aed",
          cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1,
          fontFamily: "inherit"
        }}
      >
        ← Prev
      </button>
      <span style={{ fontSize: "13px", color: "#9ca3af", padding: "0 8px" }}>
        Page {page} of {pagination.totalPages}
      </span>
      <button
        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
        disabled={page === pagination.totalPages}
        style={{
          padding: "7px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 500,
          border: "1px solid rgba(196,181,253,0.3)", background: "white", color: "#7c3aed",
          cursor: page === pagination.totalPages ? "not-allowed" : "pointer",
          opacity: page === pagination.totalPages ? 0.4 : 1, fontFamily: "inherit"
        }}
      >
        Next →
      </button>
    </div>
  );
}