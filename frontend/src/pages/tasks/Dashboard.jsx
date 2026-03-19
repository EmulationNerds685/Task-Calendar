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

const columnColors = {
  "Not Started": "border-t-gray-400",
  "In Progress": "border-t-blue-500",
  Completed: "border-t-green-500",
  Overdue: "border-t-red-500",
};

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [view, setView] = useState("list");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTask, setEditTask] = useState(null);

  const { tasks, pagination, loading, error, refetch } = useTasks({
    ...filters,
    page,
    limit: 10,
  });

  const today = dayjs().startOf("day");
  const dueTodayCount = tasks.filter((t) =>
    dayjs(t.dueDate).isSame(today, "day")
  ).length;
  const overdueCount = tasks.filter((t) => t.status === "Overdue").length;
  const upcomingCount = tasks.filter((t) =>
    dayjs(t.dueDate).isAfter(today) && t.status !== "Completed"
  ).length;

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Task Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  view === "list"
                    ? "bg-white text-gray-900 shadow-sm font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView("kanban")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  view === "kanban"
                    ? "bg-white text-gray-900 shadow-sm font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Kanban
              </button>
            </div>

            {/* Create button — admin only */}
            {isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                + New task
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div
            onClick={() => handleFilterChange({ status: "Overdue" })}
            className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-red-300 transition-colors"
          >
            <p className="text-xs text-gray-400 mb-1">Overdue</p>
            <p className="text-2xl font-semibold text-red-600">{overdueCount}</p>
          </div>
          <div
            onClick={() => handleFilterChange({})}
            className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-amber-300 transition-colors"
          >
            <p className="text-xs text-gray-400 mb-1">Due today</p>
            <p className="text-2xl font-semibold text-amber-600">{dueTodayCount}</p>
          </div>
          <div
            onClick={() => handleFilterChange({})}
            className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <p className="text-xs text-gray-400 mb-1">Upcoming</p>
            <p className="text-2xl font-semibold text-blue-600">{upcomingCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5">
          <TaskFilters filters={filters} onChange={handleFilterChange} />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            No tasks found
          </div>
        ) : view === "list" ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onClick={() => setSelectedTask(task)}
                />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {KANBAN_COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col);
              return (
                <div
                  key={col}
                  className={`bg-gray-50 rounded-xl border-t-2 ${columnColors[col]} p-4`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700">{col}</h3>
                    <span className="text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {colTasks.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Empty</p>
                    ) : (
                      colTasks.map((task) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          onClick={() => setSelectedTask(task)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <TaskFormModal
          onClose={() => setShowCreateModal(false)}
          onSaved={refetch}
        />
      )}

      {/* Detail modal */}
      {selectedTask && !editTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={(task) => setEditTask(task)}
          onDeleted={refetch}
        />
      )}

      {/* Edit modal */}
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