import { useState } from "react";
import { LayoutList, LayoutGrid, Columns, Sparkles, Inbox } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Layout from "../../components/Layout";
import TaskCard from "../../components/TaskCard";
import TaskFilters from "../../components/TaskFilters";
import TaskFormModal from "../../components/TaskFormModal";
import TaskDetailModal from "../../components/TaskDetailModal";
import useTasks from "../../hooks/useTasks";
import dayjs from "dayjs";
import api from "../../api/axios";

const KANBAN_COLUMNS = ["Not Started", "In Progress", "Completed", "Overdue"];

const getColumnStyle = (darkMode) => ({
  "Not Started": { accent: "#94a3b8", bg: darkMode ? "rgba(30,41,59,0.4)" : "rgba(241,245,249,0.8)", dot: "#94a3b8" },
  "In Progress":  { accent: "#818cf8", bg: darkMode ? "rgba(99,102,241,0.12)" : "rgba(238,242,255,0.8)", dot: "#818cf8" },
  "Completed":    { accent: "#34d399", bg: darkMode ? "rgba(16,185,129,0.12)" : "rgba(236,253,245,0.8)", dot: "#34d399" },
  "Overdue":      { accent: "#f87171", bg: darkMode ? "rgba(239,68,68,0.12)" : "rgba(254,242,242,0.8)", dot: "#f87171" },
});

const getPriorityConfig = (darkMode) => ({
  High:   { bg: darkMode ? "rgba(239,68,68,0.15)" : "rgba(254,242,242,0.8)", text: "#ef4444", border: darkMode ? "rgba(239,68,68,0.25)" : "rgba(252,165,165,0.4)", dot: "#ef4444" },
  Medium: { bg: darkMode ? "rgba(245,158,11,0.15)" : "rgba(255,251,235,0.8)", text: "#f59e0b", border: darkMode ? "rgba(245,158,11,0.25)" : "rgba(253,211,77,0.4)",  dot: "#f59e0b" },
  Low:    { bg: darkMode ? "rgba(16,185,129,0.15)" : "rgba(236,253,245,0.8)", text: "#10b981", border: darkMode ? "rgba(16,185,129,0.25)" : "rgba(110,231,183,0.4)", dot: "#10b981" },
});

const getStatusConfig = (darkMode) => ({
  "Not Started": { bg: darkMode ? "rgba(71,85,105,0.3)" : "#f1f5f9",              text: darkMode ? "#94a3b8" : "#64748b" },
  "In Progress":  { bg: darkMode ? "rgba(99,102,241,0.15)" : "rgba(238,242,255,0.9)", text: darkMode ? "#818cf8" : "#6366f1" },
  "Completed":    { bg: darkMode ? "rgba(16,185,129,0.15)" : "rgba(236,253,245,0.9)", text: darkMode ? "#34d399" : "#10b981" },
  "Overdue":      { bg: darkMode ? "rgba(239,68,68,0.15)" : "rgba(254,242,242,0.9)", text: darkMode ? "#f87171" : "#ef4444" },
});

// CHANGE #2: 5th card for total active tasks
const getSummaryCards = (darkMode) => [
  {
    key: "active",
    label: "Active tasks",
    color: darkMode ? "#a78bfa" : "#7c3aed",
    bg: darkMode ? "rgba(139,92,246,0.15)" : "rgba(250,245,255,0.7)",
    border: darkMode ? "rgba(139,92,246,0.3)" : "rgba(196,181,253,0.4)",
    getFilter: () => ({}), // clears filters
    getCount: (tasks) => tasks.filter(t => t.status !== "Completed").length,
  },
  {
    key: "overdue",
    label: "Overdue",
    color: "#f87171",
    bg: darkMode ? "rgba(239,68,68,0.15)" : "rgba(254,242,242,0.7)",
    border: darkMode ? "rgba(239,68,68,0.3)" : "rgba(252,165,165,0.4)",
    getFilter: () => ({ status: "Overdue" }),
    getCount: (tasks) => tasks.filter(t => t.status === "Overdue").length,
  },
  {
    key: "today",
    label: "Due today",
    color: "#fbbf24",
    bg: darkMode ? "rgba(245,158,11,0.15)" : "rgba(255,251,235,0.7)",
    border: darkMode ? "rgba(245,158,11,0.3)" : "rgba(253,211,77,0.4)",
    getFilter: () => ({ dueDateFrom: dayjs().format("YYYY-MM-DD"), dueDateTo: dayjs().format("YYYY-MM-DD") }),
    getCount: (tasks) => tasks.filter(t => dayjs(t.dueDate).isSame(dayjs().startOf("day"), "day")).length,
  },
  {
    key: "upcoming",
    label: "Upcoming",
    color: "#818cf8",
    bg: darkMode ? "rgba(99,102,241,0.15)" : "rgba(238,242,255,0.7)",
    border: darkMode ? "rgba(99,102,241,0.3)" : "rgba(196,181,253,0.4)",
    getFilter: () => ({ dueDateFrom: dayjs().add(1, "day").format("YYYY-MM-DD") }),
    getCount: (tasks) => tasks.filter(t => dayjs(t.dueDate).isAfter(dayjs().startOf("day")) && t.status !== "Completed").length,
  },
  {
    key: "done",
    label: "Completed",
    color: "#34d399",
    bg: darkMode ? "rgba(16,185,129,0.15)" : "rgba(236,253,245,0.7)",
    border: darkMode ? "rgba(16,185,129,0.3)" : "rgba(110,231,183,0.4)",
    getFilter: () => ({ status: "Completed" }),
    getCount: (tasks) => tasks.filter(t => t.status === "Completed").length,
  },
];

// CHANGE #1: Table row component for list view
function TableRow({ task, onClick, onToggle, darkMode }) {
  const priorityConfig = getPriorityConfig(darkMode);
  const statusConfig = getStatusConfig(darkMode);
  const pc = priorityConfig[task.priority] || priorityConfig.Medium;
  const sc = statusConfig[task.status] || statusConfig["Not Started"];

  const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : task.assignedTo ? [task.assignedTo] : [];
  const assigneeNames = assignees.map(a => a?.name || "").filter(Boolean).join(", ") || "—";

  return (
    <tr
      onClick={() => onClick(task)}
      style={{ borderBottom: "1px solid var(--border-dim)", cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(233,213,255,0.12)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <td style={{ padding: "12px 0 12px 14px", width: "40px", textAlign: "center" }}>
        <input
          type="checkbox"
          checked={task.status === "Completed"}
          onClick={(e) => e.stopPropagation()}
          onChange={async (e) => {
            e.stopPropagation();
            onToggle?.(task._id, task.status === "Completed" ? "Not Started" : "Completed");
          }}
          style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#7c3aed" }}
        />
      </td>
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
  const { darkMode } = useTheme();
  const isAdmin = user?.role === "admin";

  const [view, setView] = useState("cards");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTask, setEditTask] = useState(null);

  const { tasks, pagination, loading, error, refetch } = useTasks({ ...filters, page, limit: 10 });

  const columnStyle = getColumnStyle(darkMode);
  const summaryCards = getSummaryCards(darkMode);

  const handleToggleStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      refetch();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
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

  const viewOptions = [
    { key: "cards", icon: LayoutList,  label: "Cards"  },
    { key: "table", icon: LayoutGrid,  label: "Table"  },
    { key: "kanban", icon: Columns,     label: "Board"  },
  ];

  return (
    <Layout>
      <div style={{ padding: "28px 32px", maxWidth: "1280px", margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <p style={{ fontSize: "13px", color: "#a78bfa", fontWeight: 500, margin: "0 0 4px" }}>
              {dayjs().format("dddd, MMMM D")}
            </p>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "26px", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              {greeting}, {user?.name?.split(" ")[0]} <Sparkles size={18} color="#a78bfa" style={{ flexShrink: 0 }} />
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "2px",
              background: "var(--bg-card)", border: "1px solid var(--border-dim)",
              borderRadius: "12px", padding: "3px"
            }}>
              {viewOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setView(opt.key)}
                  style={{
                    padding: "6px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 500,
                    border: "none", cursor: "pointer", transition: "all 0.15s",
                    background: view === opt.key ? (darkMode ? "rgba(139,92,246,0.15)" : "rgba(233,213,255,0.5)") : "transparent",
                    color: view === opt.key ? "var(--accent-purple)" : "var(--text-muted)",
                    fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  <opt.icon size={14} strokeWidth={1.8} />
                  {opt.label}
                </button>
              ))}
            </div>

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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "28px" }}>
          {summaryCards.map((card) => {
            const count = card.getCount(tasks);
            const isActive = JSON.stringify(filters) === JSON.stringify(card.getFilter());
            return (
              <div
                key={card.key}
                onClick={() => handleFilterChange(isActive ? {} : card.getFilter())}
                style={{
                  background: card.bg,
                  border: `1px solid ${isActive ? card.color + "80" : card.border}`,
                  borderRadius: "16px", padding: "16px 20px", cursor: "pointer",
                  transition: "all 0.2s", backdropFilter: "blur(8px)",
                  boxShadow: isActive ? `0 4px 16px ${card.border}` : (darkMode ? "none" : "0 4px 12px rgba(139,92,246,0.03)"),
                  transform: isActive ? "translateY(-1px)" : "none"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = darkMode ? "0 8px 24px rgba(0,0,0,0.2)" : "0 8px 24px rgba(139,92,246,0.08)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = isActive ? "translateY(-1px)" : "translateY(0)";
                  e.currentTarget.style.boxShadow = isActive ? `0 4px 16px ${card.border}` : (darkMode ? "none" : "0 4px 12px rgba(139,92,246,0.03)");
                }}
              >
                <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 6px", fontWeight: 500 }}>{card.label}</p>
                <p style={{ fontSize: "26px", fontWeight: 700, color: card.color, margin: 0, lineHeight: 1 }}>{count}</p>
              </div>
            );
          })}
        </div>

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
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "#d8b4fe" }}>
              <Inbox size={42} strokeWidth={1.2} />
            </div>
            <p style={{ fontSize: "15px", color: "#9ca3af" }}>No tasks found</p>
            {isAdmin && <p style={{ fontSize: "13px", color: "#c4b5fd" }}>Create your first task to get started</p>}
          </div>

        ) : view === "cards" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
              {tasks.map(task => (
                <TaskCard key={task._id} task={task} onClick={() => setSelectedTask(task)} onToggle={handleToggleStatus} />
              ))}
            </div>
            <Pagination page={page} pagination={pagination} setPage={setPage} />
          </>

        ) : view === "table" ? (
          <>
            <div style={{
              background: "var(--bg-card)", backdropFilter: "blur(8px)",
              border: "1px solid var(--border-dim)", borderRadius: "18px",
              overflow: "hidden", boxShadow: darkMode ? "none" : "0 2px 12px rgba(139,92,246,0.05)"
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(196,181,253,0.2)", background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(250,245,255,0.5)" }}>
                      <th style={{ width: "40px" }}></th>
                      {["Title", "Assignee", "Priority", "Status", "Deadline", "Scheduled slot"].map((h) => (
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
                      <TableRow key={task._id} task={task} onClick={() => setSelectedTask(task)} onToggle={handleToggleStatus} darkMode={darkMode} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={page} pagination={pagination} setPage={setPage} />
          </>

        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
            {KANBAN_COLUMNS.map(colName => {
              const colTasks = tasks.filter(t => t.status === colName);
              const style = columnStyle[colName];
              return (
                <div key={colName} style={{
                  background: style.bg, borderRadius: "16px",
                  border: `1px solid ${style.accent}30`,
                  overflow: "hidden"
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px",
                    background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(250,245,255,0.5)",
                    borderBottom: "1px solid var(--border-dim)"
                  }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: style.dot }} />
                    <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", margin: 0, letterSpacing: "0.02em" }}>{colName}</h3>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, marginLeft: "auto", background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)", padding: "2px 6px", borderRadius: "6px" }}>{colTasks.length}</span>
                  </div>
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {colTasks.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "#d1d5db", textAlign: "center", padding: "20px 0" }}>Empty</p>
                    ) : (
                      colTasks.map(task => (
                        <TaskCard key={task._id} task={task} onClick={() => setSelectedTask(task)} onToggle={handleToggleStatus} />
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