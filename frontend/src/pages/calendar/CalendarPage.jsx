import { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import dayjs from "dayjs";
import Layout from "../../components/Layout";
import TaskFormModal from "../../components/TaskFormModal";
import TaskDetailModal from "../../components/TaskDetailModal";
import useCalendarEvents from "../../hooks/useCalendarEvents";
import useTasks from "../../hooks/useTasks";
import useSettings from "../../hooks/useSettings";
import api from "../../api/axios";
import TaskCard from "../../components/TaskCard";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { useAuth } from "../../context/AuthContext";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "en-US": enUS },
});

const DnDCalendar = withDragAndDrop(Calendar);

const priorityConfig = {
  High:   { color: "#ef4444", bg: "rgba(254,242,242,0.9)", text: "#be123c" },
  Medium: { color: "#f59e0b", bg: "rgba(255,251,235,0.9)", text: "#92400e" },
  Low:    { color: "#10b981", bg: "rgba(236,253,245,0.9)", text: "#065f46" },
};

const statusColors = {
  "Not Started": { bg: "#f1f5f9",               text: "#64748b" },
  "In Progress":  { bg: "rgba(238,242,255,0.9)", text: "#6366f1" },
  "Completed":    { bg: "rgba(236,253,245,0.9)", text: "#10b981" },
  "Overdue":      { bg: "rgba(254,242,242,0.9)", text: "#ef4444" },
};


const CALENDAR_STYLES = `
  .rbc-calendar { font-family: 'DM Sans', sans-serif !important; background: transparent !important; }
  .rbc-header { padding: 10px 0 8px !important; font-size: 12px !important; font-weight: 600 !important; color: #a78bfa !important; border-bottom: 1px solid rgba(196,181,253,0.2) !important; background: rgba(250,245,255,0.4) !important; text-transform: uppercase !important; letter-spacing: 0.06em !important; }
  .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: none !important; }
  .rbc-month-row { border-top: 1px solid rgba(196,181,253,0.15) !important; }
  .rbc-day-bg { background: transparent !important; }
  .rbc-day-bg + .rbc-day-bg { border-left: 1px solid rgba(196,181,253,0.12) !important; }
  .rbc-off-range-bg { background: rgba(243, 244, 246, 0.4) !important; }
  .rbc-off-range .rbc-button-link { color: #d1d5db !important; }
  .rbc-off-range { opacity: 0.6 !important; }
  .rbc-today { background: rgba(233,213,255,0.18) !important; }
  .rbc-date-cell { padding: 6px 8px 2px !important; font-size: 12px !important; font-weight: 500 !important; color: #6b7280 !important; }
  .rbc-date-cell.rbc-now a { color: #7c3aed !important; font-weight: 700 !important; }
  .rbc-date-cell a { color: #9ca3af !important; text-decoration: none !important; }
  .rbc-toolbar { margin-bottom: 18px !important; gap: 10px !important; flex-wrap: wrap !important; }
  .rbc-toolbar-label { font-family: 'Fraunces', serif !important; font-size: 18px !important; font-weight: 700 !important; color: #1e1b4b !important; }
  .rbc-btn-group button { padding: 6px 14px !important; font-size: 12px !important; font-weight: 500 !important; font-family: 'DM Sans', sans-serif !important; background: rgba(255,255,255,0.85) !important; border: 1px solid rgba(196,181,253,0.3) !important; color: #6b7280 !important; border-radius: 8px !important; transition: all 0.15s !important; cursor: pointer !important; }
  .rbc-btn-group button:hover { background: rgba(233,213,255,0.4) !important; color: #7c3aed !important; border-color: rgba(196,181,253,0.5) !important; }
  .rbc-btn-group button.rbc-active { background: linear-gradient(135deg,#c084fc,#818cf8) !important; color: white !important; border-color: transparent !important; }
  .rbc-btn-group { display: flex !important; gap: 4px !important; }
  .rbc-btn-group > button + button { margin-left: 0 !important; border-radius: 8px !important; }
  .rbc-event { border-radius: 7px !important; padding: 2px 7px !important; font-size: 11px !important; font-weight: 600 !important; border: none !important; box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important; }
  .rbc-event:focus { outline: 2px solid rgba(196,181,253,0.5) !important; outline-offset: 1px !important; }
  .rbc-event-label { display: none !important; }
  .rbc-show-more { color: #a78bfa !important; font-size: 11px !important; font-weight: 600 !important; background: transparent !important; }
  .rbc-time-slot { font-size: 11px !important; color: #c4b5fd !important; }
  .rbc-timeslot-group { border-bottom: 1px solid rgba(196,181,253,0.08) !important; }
  .rbc-time-content { border-top: 1px solid rgba(196,181,253,0.15) !important; }
  .rbc-current-time-indicator { background: #c084fc !important; height: 2px !important; opacity: 0.7 !important; }
  .rbc-addons-dnd .rbc-addons-dnd-drag-preview { opacity: 0.75 !important; border-radius: 7px !important; }
  .rbc-addons-dnd-over { background: rgba(233,213,255,0.25) !important; }
`;

// Read-only task detail panel shown when clicking a calendar event
// TaskDetailPanel was removed and replaced by the global TaskDetailModal component in ../../components/TaskDetailModal


export default function CalendarPage() {
  const [view, setView]               = useState("month");
  const [date, setDate]               = useState(new Date());
  const [dragError, setDragError]     = useState("");
  const [detailTask, setDetailTask]   = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const startDate = dayjs(date).startOf("month").subtract(7, "day").toISOString();
  const endDate   = dayjs(date).endOf("month").add(7, "day").toISOString();

  const { events, loading, error, refetch } = useCalendarEvents(startDate, endDate);
  const { tasks, refetch: refetchTasks } = useTasks({ limit: 20 });
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleToggleStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      refetchTasks();
      refetch();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const eventStyleGetter = useCallback((event) => {
    const priority = event.resource?.task?.priority;
    const pc = priorityConfig[priority] || { bg: "rgba(238,242,255,0.9)", color: "#818cf8", text: "#4338ca" };
    return {
      style: {
        backgroundColor: pc.bg,
        borderLeft: `3px solid ${pc.color}`,
        color: pc.text,
        borderRadius: "7px",
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 7px",
      },
    };
  }, []);

  // Click → show detail panel first
  const handleSelectEvent = useCallback((event) => {
    const task = event.resource?.task;
    if (!task) return;
    setDetailTask({ ...task, assignedTo: task.assignedTo || [] });
  }, []);

  // Check if current user can edit this task
  const canEditTask = (task) => {
    if (isAdmin) return true;
    const assignees = task?.assignedTo || [];
    return assignees.some(a => String(typeof a === "object" ? a._id : a) === String(user?._id));
  };

  const handleEventDrop = useCallback(async ({ event, start, end }) => {
    const newStartDay = dayjs(start).startOf("day");
    const newEndDay   = dayjs(end).startOf("day");
    const today       = dayjs().startOf("day");

    if (newStartDay.isBefore(today)) {
      setDragError("Cannot reschedule tasks to the past.");
      return;
    }

    const isMultiDay  = newEndDay.diff(newStartDay, "day") >= 1;
    let startTime, endTime, computedEndDate;
    if (isMultiDay) {
      startTime       = dayjs(event.start).format("HH:mm");
      endTime         = dayjs(event.end).format("HH:mm");
      computedEndDate = newEndDay.toISOString();
    } else {
      const durationMs = dayjs(event.end).diff(dayjs(event.start));
      const newStart   = dayjs(start);
      const newEnd     = newStart.add(durationMs, "ms");
      startTime        = newStart.format("HH:mm");
      endTime          = newEnd.format("HH:mm");
      computedEndDate  = newStartDay.toISOString();
    }

    try {
      await api.patch(`/calendar/${event.id}`, {
        date: dayjs(start).toISOString(), endDate: computedEndDate, startTime, endTime,
      });
      await refetch();
    } catch (err) {
      setDragError(err.response?.data?.message || "Failed to reschedule. Please try again.");
      await refetch();
    }
  }, [refetch]);

  const handleEventResize = useCallback(async ({ event, start, end }) => {
    setDragError("");
    const newStartDay = dayjs(start).startOf("day");
    if (newStartDay.isBefore(dayjs().startOf("day"))) {
      setDragError("Cannot resize tasks into the past.");
      return;
    }
    const startTime = dayjs(start).format("HH:mm");
    const endTime   = dayjs(end).format("HH:mm");
    const endDay    = dayjs(end).startOf("day").toISOString();
    try {
      await api.patch(`/calendar/${event.id}`, {
        date: dayjs(start).toISOString(), endDate: endDay, startTime, endTime,
      });
      await refetch();
    } catch (err) {
      setDragError(err.response?.data?.message || "Failed to resize event.");
      await refetch();
    }
  }, [refetch]);

  // Only allow drag/resize if the user can edit the task
  const isDraggable = useCallback((event) => {
    return canEditTask(event.resource?.task);
  }, [isAdmin, user]);

  return (
    <Layout>
      <style>{CALENDAR_STYLES}</style>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{ padding: "28px 32px", maxWidth: "1280px", margin: "0 auto" }}>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "13px", color: "#a78bfa", fontWeight: 500, margin: "0 0 4px" }}>
            Auto-scheduled tasks
          </p>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "26px", fontWeight: 700, color: "#1e1b4b", margin: 0 }}>
            Calendar ✦
          </h1>
        </div>

        {(error || dragError) && (
          <div style={{
            marginBottom: "16px", padding: "12px 16px",
            background: "rgba(254,242,242,0.8)", border: "1px solid rgba(252,165,165,0.4)",
            borderRadius: "12px", fontSize: "13px", color: "#be123c",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span>{error || dragError}</span>
            {dragError && (
              <button onClick={() => setDragError("")} style={{ background: "none", border: "none", color: "#be123c", cursor: "pointer", fontSize: "16px" }}>×</button>
            )}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <span style={{ fontSize: "12px", color: "#c4b5fd", fontWeight: 500 }}>Priority:</span>
            {Object.entries(priorityConfig).map(([label, cfg]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.color }} />
                <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
          <span style={{
            fontSize: "11px", color: "#c4b5fd", padding: "4px 10px",
            borderRadius: "99px", background: "rgba(233,213,255,0.2)",
            border: "1px solid rgba(196,181,253,0.2)",
          }}>
            Click to view · Drag to reschedule
          </span>
        </div>

        {/* Main Content Area: Calendar + Sidebar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
          {/* Calendar */}
          <div style={{
            background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(196,181,253,0.18)", borderRadius: "20px",
            padding: "24px", boxShadow: "0 4px 24px rgba(139,92,246,0.06)",
          }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid #e9d5ff", borderTopColor: "#a78bfa", animation: "spin 0.7s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <DnDCalendar
                localizer={localizer}
                events={events}
                view={view}
                date={date}
                onView={setView}
                onNavigate={setDate}
                onSelectEvent={handleSelectEvent}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                eventPropGetter={eventStyleGetter}
                draggableAccessor={isDraggable}
                resizable
                style={{ height: 580 }}
                views={["month", "week", "day"]}
              />
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 700, color: "#1e1b4b", margin: "0 0 4px" }}>My Tasks</h3>
            <div style={{ 
              display: "flex", flexDirection: "column", gap: "12px", 
              maxHeight: "600px", overflowY: "auto", paddingRight: "8px" 
            }}>
              {tasks.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", padding: "20px" }}>No tasks found</p>
              ) : (
                tasks.map(task => (
                  <TaskCard 
                    key={task._id} 
                    task={task} 
                    onClick={() => setDetailTask(task)} 
                    onToggle={handleToggleStatus}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task detail panel — shown on click */}
      {detailTask && !editingTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onEdit={(task) => {
            setEditingTask(task);
            setDetailTask(null);
          }}
          onDeleted={refetch}
        />
      )}

      {/* Edit form — shown after clicking Edit in detail panel */}
      {editingTask && (
        <TaskFormModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSaved={refetch}
        />
      )}
    </Layout>
  );
}