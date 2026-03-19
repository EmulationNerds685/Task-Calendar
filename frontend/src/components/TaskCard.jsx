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

export default function TaskCard({ task, onClick }) {
  return (
    <div
      onClick={() => onClick?.(task)}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-gray-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-900 leading-snug">{task.title}</h3>
        <span
          className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${priorityColors[task.priority]}`}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}>
          {task.status}
        </span>
        <span className="text-xs text-gray-400">
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
        </span>
      </div>

      {task.assignedTo && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 font-medium">
            {task.assignedTo.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-xs text-gray-500">{task.assignedTo.name}</span>
        </div>
      )}
    </div>
  );
}