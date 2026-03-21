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

const summaryCards = [
  {
    key: "overdue",
    label: "Overdue",
    color: "#ef4444",
    bg: "rgba(254,242,242,0.7)",
    border: "rgba(252,165,165,0.4)",
    // clicking filters to show only overdue tasks
    getFilter: () => ({ status: "Overdue" }),
  },
  {
    key: "today",
    label: "Due today",
    color: "#f59e0b",
    bg: "rgba(255,251,235,0.7)",
    border: "rgba(253,211,77,0.4)",
    // clicking filters to today's date range
    getFilter: () => ({
      dueDateFrom: dayjs().format("YYYY-MM-DD"),
      dueDateTo: dayjs().format("YYYY-MM-DD"),
    }),
  },
  {
    key: "upcoming",
    label: "Upcoming",
    color: "#818cf8",
    bg: "rgba(238,242,255,0.7)",
    border: "rgba(196,181,253,0.4)",
    // clicking filters to tasks due from tomorrow onwards
    getFilter: () => ({
      dueDateFrom: dayjs().add(1, "day").format("YYYY-MM-DD"),
    }),
  },
  {
    key: "done",
    label: "Completed",
    color: "#34d399",
    bg: "rgba(236,253,245,0.7)",
    border: "rgba(110,231,183,0.4)",
    getFilter: () => ({ status: "Completed" }),
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [view, setView] = useState("list");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTask, setEditTask] = useState(null);

  const { tasks, pagination, loading, error, refetch } = useTasks({ ...filters, page, limit: 10 });

  const today = dayjs().startOf("day");
  const counts = {
    overdue:  tasks.filter(t => t.status === "Overdue").length,
    today:    tasks.filter(t => dayjs(t.dueDate).isSame(today, "day")).length,
    upcoming: tasks.filter(t => dayjs(t.dueDate).isAfter(today) && t.status !== "Completed").length,
    done:     tasks.filter(t => t.status === "Completed").length,
  };

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
            {/* View toggle */}
            <div style={{
              display: "flex", alignItems: "center", gap: "2px",
              background: "rgba(255,255,255,0.8)", border: "1px solid rgba(196,181,253,0.3)",
              borderRadius: "12px", padding: "3px"
            }}>
              {["list", "kanban"].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: "6px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 500,
                    border: "none", cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
                    background: view === v ? "linear-gradient(135deg, #e9d5ff, #c7d2fe)" : "transparent",
                    color: view === v ? "#6d28d9" : "#9ca3af",
                    boxShadow: view === v ? "0 1px 4px rgba(139,92,246,0.15)" : "none",
                    fontFamily: "inherit"
                  }}
                >
                  {v === "list" ? "☰ List" : "⊞ Board"}
                </button>
              ))}
            </div>

            {isAdmin && (
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
            )}
          </div>
        </div>

        {/* Summary cards — each applies a meaningful filter on click */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
          {summaryCards.map(({ key, label, color, bg, border, getFilter }) => {
            const isActive = JSON.stringify(filters) === JSON.stringify(getFilter());
            return (
              <div
                key={key}
                onClick={() => handleFilterChange(isActive ? {} : getFilter())}
                style={{
                  background: bg,
                  border: `1px solid ${isActive ? color + "80" : border}`,
                  borderRadius: "16px", padding: "18px 20px", cursor: "pointer",
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
                <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0 0 6px", fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: "28px", fontWeight: 700, color, margin: 0, lineHeight: 1 }}>{counts[key]}</p>
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
        ) : view === "list" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
              {tasks.map(task => (
                <TaskCard key={task._id} task={task} onClick={() => setSelectedTask(task)} />
              ))}
            </div>

            {pagination?.totalPages > 1 && (
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
            )}
          </>
        ) : (
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
          onEdit={task => setEditTask(task)}
          onDeleted={refetch}
        />
      )}
      {editTask && (
        <TaskFormModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSaved={() => { refetch(); setEditTask(null); }}
        />
      )}
    </Layout>
  );
}