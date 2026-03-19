import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import dayjs from "dayjs";

const priorityColors = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-green-50 text-green-700 border-green-200",
};

const statusColors = {
  "Not Started": "bg-gray-100 text-gray-600",
  "In Progress": "bg-blue-50 text-blue-600",
  Completed: "bg-green-50 text-green-600",
  Overdue: "bg-red-50 text-red-600",
};

export default function TaskDetailModal({ task, onClose, onEdit, onDeleted }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${task._id}`);
      onDeleted();
      onClose();
    } catch {
      alert("Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <h2 className="text-base font-semibold text-gray-900">{task.title}</h2>
            {task.category && (
              <p className="text-xs text-gray-400 mt-0.5">{task.category}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {task.description && (
            <p className="text-sm text-gray-600">{task.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-1">Priority</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}>
                {task.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Due date</p>
              <p className="text-gray-700">{dayjs(task.dueDate).format("MMM D, YYYY")}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Estimated time</p>
              <p className="text-gray-700">
                {task.estimatedTime ? `${task.estimatedTime} min` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Assigned to</p>
              <p className="text-gray-700">{task.assignedTo?.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Created by</p>
              <p className="text-gray-700">{task.createdBy?.name || "—"}</p>
            </div>
            {task.scheduledSlot && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Scheduled slot</p>
                <p className="text-gray-700">{task.scheduledSlot}</p>
              </div>
            )}
            {task.scheduledDate && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Scheduled date</p>
                <p className="text-gray-700">
                  {dayjs(task.scheduledDate).format("MMM D, YYYY")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => { onClose(); onEdit(task); }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {isAdmin ? "Edit" : "Update status"}
          </button>
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50"
            >
              {deleting ? "..." : "Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}