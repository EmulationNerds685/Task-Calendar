import { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import dayjs from "dayjs";
import Layout from "../../components/Layout";
import useCalendarEvents from "../../hooks/useCalendarEvents";

// dayjs localizer setup
const locales = { "en-US": require => require };
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "en-US": enUS },
});

const priorityColors = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#22c55e",
};

export default function CalendarPage() {
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  const startDate = dayjs(date).startOf("month").subtract(7, "day").toISOString();
  const endDate = dayjs(date).endOf("month").add(7, "day").toISOString();

  const { events, loading, error } = useCalendarEvents(startDate, endDate);

  const eventStyleGetter = useCallback((event) => {
    const priority = event.resource?.task?.priority;
    const color = priorityColors[priority] || "#3b82f6";
    return {
      style: {
        backgroundColor: color + "20",
        borderLeft: `3px solid ${color}`,
        color: "#111",
        borderRadius: "6px",
        fontSize: "12px",
        padding: "2px 6px",
      },
    };
  }, []);

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Auto-scheduled tasks and deadlines</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          {Object.entries(priorityColors).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              view={view}
              date={date}
              onView={setView}
              onNavigate={setDate}
              onSelectEvent={(event) => setSelectedEvent(event)}
              eventPropGetter={eventStyleGetter}
              style={{ height: 600 }}
              views={["month", "week", "day"]}
            />
          )}
        </div>

        {/* Event detail modal */}
        {selectedEvent && (
          <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  {selectedEvent.title}
                </h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span>{dayjs(selectedEvent.start).format("MMM D, YYYY")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time</span>
                  <span>
                    {dayjs(selectedEvent.start).format("h:mm A")} —{" "}
                    {dayjs(selectedEvent.end).format("h:mm A")}
                  </span>
                </div>
                {selectedEvent.resource?.task?.priority && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Priority</span>
                    <span>{selectedEvent.resource.task.priority}</span>
                  </div>
                )}
                {selectedEvent.resource?.task?.category && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category</span>
                    <span>{selectedEvent.resource.task.category}</span>
                  </div>
                )}
                {selectedEvent.resource?.task?.status && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span>{selectedEvent.resource.task.status}</span>
                  </div>
                )}
                {selectedEvent.resource?.user?.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Assigned to</span>
                    <span>{selectedEvent.resource.user.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}