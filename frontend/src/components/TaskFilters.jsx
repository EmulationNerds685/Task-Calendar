export default function TaskFilters({ filters, onChange }) {
  const handle = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={filters.status || ""}
        onChange={(e) => handle("status", e.target.value)}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All statuses</option>
        <option>Not Started</option>
        <option>In Progress</option>
        <option>Completed</option>
        <option>Overdue</option>
      </select>

      <select
        value={filters.priority || ""}
        onChange={(e) => handle("priority", e.target.value)}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All priorities</option>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>

      <select
        value={filters.category || ""}
        onChange={(e) => handle("category", e.target.value)}
        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All categories</option>
        <option>Research</option>
        <option>Admin</option>
        <option>Investment Analysis</option>
        <option>Compliance</option>
        <option>Operations</option>
      </select>

      {(filters.status || filters.priority || filters.category) && (
        <button
          onClick={() => onChange({})}
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}