import dayjs from "dayjs";
import Layout from "../../components/Layout";
import useAnalytics from "../../hooks/useAnalytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CATEGORY_COLORS = {
  Research: "#3b82f6",
  Admin: "#8b5cf6",
  "Investment Analysis": "#f59e0b",
  Compliance: "#ef4444",
  Operations: "#22c55e",
};

export default function AnalyticsPage() {
  const { data, loading, error } = useAnalytics();

  // Build bar chart data — total minutes per user per day
  const barData = data.map((entry) => ({
    name: `${entry.userName} · ${dayjs(entry.date).format("MMM D")}`,
    minutes: entry.totalMinutes,
  }));

  // Build pie chart data — total minutes by category across all entries
  const categoryTotals = {};
  data.forEach((entry) => {
    entry.byCategory.forEach(({ category, minutes }) => {
      if (!category) return;
      categoryTotals[category] = (categoryTotals[category] || 0) + minutes;
    });
  });
  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  }));

  // Summary cards
  const totalMinutes = data.reduce((sum, e) => sum + e.totalMinutes, 0);
  const uniqueUsers = [...new Set(data.map((e) => e.userName))];
  const uniqueDays = [...new Set(data.map((e) => dayjs(e.date).format("YYYY-MM-DD")))];

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Time tracking across team members and categories
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            No analytics data yet. Create and schedule some tasks first.
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs text-gray-400 mb-1">Total time tracked</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs text-gray-400 mb-1">Team members</p>
                <p className="text-2xl font-semibold text-gray-900">{uniqueUsers.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs text-gray-400 mb-1">Active days</p>
                <p className="text-2xl font-semibold text-gray-900">{uniqueDays.length}</p>
              </div>
            </div>

            {/* Bar chart — time per person per day */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-4">
                Time per person per day (minutes)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 4, right: 16, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom row — pie chart + breakdown table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Pie chart — by category */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-sm font-medium text-gray-700 mb-4">
                  Time by category
                </h2>
                {pieData.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">No category data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={CATEGORY_COLORS[entry.name] || "#94a3b8"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => `${val} min`}
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Breakdown table */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-sm font-medium text-gray-700 mb-4">
                  Per member breakdown
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs text-gray-400 font-medium pb-2">Member</th>
                        <th className="text-left text-xs text-gray-400 font-medium pb-2">Date</th>
                        <th className="text-right text-xs text-gray-400 font-medium pb-2">Minutes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((entry, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 text-gray-700">{entry.userName}</td>
                          <td className="py-2 text-gray-500">
                            {dayjs(entry.date).format("MMM D, YYYY")}
                          </td>
                          <td className="py-2 text-right text-gray-700 font-medium">
                            {entry.totalMinutes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </Layout>
  );
}