import { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import dayjs from "dayjs";
import Layout from "../../components/Layout";
import useCalendarEvents from "../../hooks/useCalendarEvents";
import api from "../../api/axios";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "en-US": enUS },
});

// Wrap Calendar with drag-and-drop capability
const DnDCalendar = withDragAndDrop(Calendar);

const priorityConfig = {
  High:   { color: "#ef4444", bg: "rgba(254,242,242,0.9)", text: "#be123c" },
  Medium: { color: "#f59e0b", bg: "rgba(255,251,235,0.9)", text: "#92400e" },
  Low:    { color: "#10b981", bg: "rgba(236,253,245,0.9)", text: "#065f46" },
};

const statusConfig = {
  "Not Started": { bg: "#f8fafc", text: "#64748b" },
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
  .rbc-off-range-bg { background: rgba(250,245,255,0.3) !important; }
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

export default function CalendarPage() {
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dragError, setDragError] = useState("");

  const startDate = dayjs(date).startOf("month").subtract(7, "day").toISOString();
  const endDate = dayjs(date).endOf("month").add(7, "day").toISOString();

  const { events, loading, error, refetch } = useCalendarEvents(startDate, endDate);

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

  // Drag-and-drop handler — called when user drops an event on a new date/time
  const handleEventDrop = useCallback(async ({ event, start }) => {
    setDragError("");
    const eventId = event.id;
    const newDate = dayjs(start).toISOString();

    // Compute new start/end times preserving the original slot duration
    const originalStart = dayjs(event.start);
    const originalEnd = dayjs(event.end);
    const durationMs = originalEnd.diff(originalStart);

    const newStart = dayjs(start);
    const newEnd = newStart.add(durationMs, "ms");

    const startTime = newStart.format("HH:mm");
    const endTime = newEnd.format("HH:mm");

    try {
      await api.patch(`/calendar/${eventId}`, {
        date: newDate,
        startTime,
        endTime,
      });
      // Refetch so the calendar reflects the new position
      await refetch();
    } catch (err) {
      setDragError(
        err.response?.data?.message || "Failed to reschedule. Please try again."
      );
      // Refetch to restore original position on failure
      await refetch();
    }
  }, [refetch]);

  // Also handle resize (drag bottom edge to change duration)
  const handleEventResize = useCallback(async ({ event, start, end }) => {
    setDragError("");
    const newDate = dayjs(start).toISOString();
    const startTime = dayjs(start).format("HH:mm");
    const endTime = dayjs(end).format("HH:mm");

    try {
      await api.patch(`/calendar/${event.id}`, { date: newDate, startTime, endTime });
      await refetch();
    } catch (err) {
      setDragError(err.response?.data?.message || "Failed to resize event.");
      await refetch();
    }
  }, [refetch]);

  const task = selectedEvent?.resource?.task;
  const assignedUser = selectedEvent?.resource?.user;
  const pc = task ? (priorityConfig[task.priority] || priorityConfig.Medium) : null;
  const sc = task ? (statusConfig[task.status] || statusConfig["Not Started"]) : null;

  return (
    <Layout>
      <style>{CALENDAR_STYLES}</style>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{ padding: "28px 32px", maxWidth: "1280px", margin: "0 auto" }}>

        {/* Header */}
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
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <span>{error || dragError}</span>
            {dragError && (
              <button
                onClick={() => setDragError("")}
                style={{ background: "none", border: "none", color: "#be123c", cursor: "pointer", fontSize: "16px" }}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Legend + drag hint */}
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
            border: "1px solid rgba(196,181,253,0.2)"
          }}>
            Drag events to reschedule
          </span>
        </div>

        {/* Calendar */}
        <div style={{
          background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(196,181,253,0.18)", borderRadius: "20px",
          padding: "24px", boxShadow: "0 4px 24px rgba(139,92,246,0.06)"
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
              onSelectEvent={event => setSelectedEvent(event)}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              eventPropGetter={eventStyleGetter}
              resizable
              style={{ height: 580 }}
              views={["month", "week", "day"]}
              draggableAccessor={() => true}
            />
          )}
        </div>
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(79,50,130,0.18)",
            backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
            justifyContent: "center", zIndex: 50, padding: "16px"
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)",
              borderRadius: "20px", width: "100%", maxWidth: "360px",
              border: "1px solid rgba(196,181,253,0.25)",
              boxShadow: "0 24px 64px rgba(109,40,217,0.12)",
              overflow: "hidden"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              padding: "20px 22px 16px",
              borderBottom: "1px solid rgba(196,181,253,0.15)",
              background: "linear-gradient(135deg, rgba(250,245,255,0.8), rgba(238,242,255,0.4))"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "16px", fontWeight: 700, color: "#1e1b4b", margin: 0, lineHeight: 1.3 }}>
                  {selectedEvent.title}
                </h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  style={{
                    width: "26px", height: "26px", borderRadius: "7px", flexShrink: 0,
                    background: "rgba(196,181,253,0.15)", border: "1px solid rgba(196,181,253,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#a78bfa", fontSize: "15px"
                  }}
                >
                  ×
                </button>
              </div>
              {/* Badges */}
              <div style={{ display: "flex", gap: "7px", marginTop: "10px", flexWrap: "wrap" }}>
                {pc && (
                  <span style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    padding: "3px 9px", borderRadius: "99px",
                    background: pc.bg, border: `1px solid ${pc.color}30`,
                    fontSize: "11px", fontWeight: 600, color: pc.text
                  }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: pc.color }} />
                    {task.priority}
                  </span>
                )}
                {sc && (
                  <span style={{
                    padding: "3px 9px", borderRadius: "99px",
                    background: sc.bg, fontSize: "11px", fontWeight: 600, color: sc.text
                  }}>
                    {task.status}
                  </span>
                )}
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Date", value: dayjs(selectedEvent.start).format("dddd, MMM D, YYYY") },
                {
                  label: "Time",
                  value: `${dayjs(selectedEvent.start).format("h:mm A")} — ${dayjs(selectedEvent.end).format("h:mm A")}`
                },
                task?.category ? { label: "Category", value: task.category } : null,
                assignedUser?.name ? { label: "Assigned to", value: assignedUser.name } : null,
              ].filter(Boolean).map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#c4b5fd", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                  </span>
                  <span style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: "14px 22px 20px" }}>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  width: "100%", padding: "9px", borderRadius: "11px", fontSize: "13px", fontWeight: 600,
                  background: "linear-gradient(135deg,#c084fc,#818cf8)",
                  border: "none", color: "white", cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(139,92,246,0.25)", fontFamily: "inherit"
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}