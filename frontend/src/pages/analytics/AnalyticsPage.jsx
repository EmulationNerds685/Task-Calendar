import dayjs from "dayjs";
import Layout from "../../components/Layout";
import useAnalytics from "../../hooks/useAnalytics";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const CATEGORY_COLORS = {
  Research:            "#818cf8",
  Admin:               "#c084fc",
  "Investment Analysis": "#f59e0b",
  Compliance:          "#f87171",
  Operations:          "#34d399",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(196,181,253,0.3)", borderRadius: "12px",
      padding: "10px 14px", boxShadow: "0 8px 24px rgba(139,92,246,0.1)",
      fontSize: "12px"
    }}>
      {label && <p style={{ color: "#9ca3af", margin: "0 0 6px" }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#6d28d9", fontWeight: 600, margin: "2px 0" }}>
          {p.name || "Minutes"}: {p.value}
          {p.name === "value" ? " min" : " min"}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { data, loading, error } = useAnalytics();

  const barData = data.map(entry => ({
    name: `${entry.userName.split(" ")[0]} · ${dayjs(entry.date).format("MMM D")}`,
    minutes: entry.totalMinutes,
  }));

  const categoryTotals = {};
  data.forEach(entry => {
    entry.byCategory.forEach(({ category, minutes }) => {
      if (!category) return;
      categoryTotals[category] = (categoryTotals[category] || 0) + minutes;
    });
  });
  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  const totalMinutes = data.reduce((sum, e) => sum + e.totalMinutes, 0);
  const uniqueUsers = [...new Set(data.map(e => e.userName))];
  const uniqueDays = [...new Set(data.map(e => dayjs(e.date).format("YYYY-MM-DD")))];

  const summaryCards = [
    { label: "Total time tracked", value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, color: "#818cf8", bg: "rgba(238,242,255,0.7)", border: "rgba(196,181,253,0.3)" },
    { label: "Team members", value: uniqueUsers.length, color: "#c084fc", bg: "rgba(250,245,255,0.7)", border: "rgba(233,213,255,0.4)" },
    { label: "Active days", value: uniqueDays.length, color: "#34d399", bg: "rgba(236,253,245,0.7)", border: "rgba(110,231,183,0.3)" },
  ];

  return (
    <Layout>
      <div style={{ padding: "28px 32px", maxWidth: "1280px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "13px", color: "#a78bfa", fontWeight: 500, margin: "0 0 4px" }}>Workspace insights</p>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "26px", fontWeight: 700, color: "#1e1b4b", margin: 0 }}>
            Analytics ✦
          </h1>
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
        ) : data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📊</div>
            <p style={{ fontSize: "15px", color: "#9ca3af" }}>No analytics data yet</p>
            <p style={{ fontSize: "13px", color: "#c4b5fd" }}>Create and schedule some tasks to see insights here</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" }}>
              {summaryCards.map(({ label, value, color, bg, border }) => (
                <div key={label} style={{
                  background: bg, border: `1px solid ${border}`, borderRadius: "16px",
                  padding: "20px 22px", backdropFilter: "blur(8px)"
                }}>
                  <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0 0 8px", fontWeight: 500 }}>{label}</p>
                  <p style={{ fontSize: "28px", fontWeight: 700, color, margin: 0, lineHeight: 1 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(196,181,253,0.18)", borderRadius: "18px",
              padding: "24px", marginBottom: "20px",
              boxShadow: "0 2px 12px rgba(139,92,246,0.05)"
            }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#4b5563", margin: "0 0 20px" }}>
                Time per person per day <span style={{ color: "#c4b5fd", fontWeight: 400 }}>(minutes)</span>
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,181,253,0.15)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#c4b5fd" }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#c4b5fd" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={i % 2 === 0 ? "#c084fc" : "#818cf8"} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

              {/* Pie chart */}
              <div style={{
                background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(196,181,253,0.18)", borderRadius: "18px",
                padding: "24px", boxShadow: "0 2px 12px rgba(139,92,246,0.05)"
              }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#4b5563", margin: "0 0 16px" }}>
                  Time by category
                </p>
                {pieData.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>No category data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map(entry => (
                          <Cell
                            key={entry.name}
                            fill={CATEGORY_COLORS[entry.name] || "#c4b5fd"}
                            fillOpacity={0.8}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={val => [`${val} min`, ""]} content={<CustomTooltip />} />
                      <Legend
                        iconType="circle"
                        iconSize={7}
                        wrapperStyle={{ fontSize: 12, color: "#9ca3af" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Breakdown table */}
              <div style={{
                background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(196,181,253,0.18)", borderRadius: "18px",
                padding: "24px", boxShadow: "0 2px 12px rgba(139,92,246,0.05)"
              }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#4b5563", margin: "0 0 16px" }}>
                  Per member breakdown
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(196,181,253,0.2)" }}>
                        {["Member", "Date", "Minutes"].map((h, i) => (
                          <th key={h} style={{
                            fontSize: "11px", fontWeight: 600, color: "#c4b5fd",
                            padding: "0 0 10px",
                            textAlign: i === 2 ? "right" : "left",
                            letterSpacing: "0.05em", textTransform: "uppercase"
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((entry, i) => (
                        <tr
                          key={i}
                          style={{ borderBottom: "1px solid rgba(196,181,253,0.08)", transition: "background 0.1s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(233,213,255,0.15)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "10px 0", fontSize: "13px", color: "#4b5563", fontWeight: 500 }}>{entry.userName}</td>
                          <td style={{ padding: "10px 0", fontSize: "12px", color: "#9ca3af" }}>
                            {dayjs(entry.date).format("MMM D, YYYY")}
                          </td>
                          <td style={{ padding: "10px 0", fontSize: "13px", fontWeight: 700, color: "#818cf8", textAlign: "right" }}>
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