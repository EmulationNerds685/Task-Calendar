import { useState } from "react";
import dayjs from "dayjs";
import Layout from "../../components/Layout";
import useAnalytics from "../../hooks/useAnalytics";
import useUsers from "../../hooks/useUsers";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

// CHANGE #12: Fixed colour palette — each person gets a consistent colour by index
const PERSON_PALETTE = [
  "#818cf8", "#c084fc", "#f59e0b", "#34d399", "#f87171",
  "#38bdf8", "#a78bfa", "#fb923c", "#4ade80", "#e879f9"
];

const CATEGORY_COLORS = {
  Research:              "#818cf8",
  Admin:                 "#c084fc",
  "Investment Analysis": "#f59e0b",
  Compliance:            "#f87171",
  Operations:            "#34d399",
};

// Build a stable person → colour map from a list of unique names/ids
function buildPersonColorMap(dataEntries) {
  const seen = new Map();
  dataEntries.forEach(entry => {
    const key = String(entry.userId || entry.userName);
    if (!seen.has(key)) {
      seen.set(key, { name: entry.userName, color: PERSON_PALETTE[seen.size % PERSON_PALETTE.length] });
    }
  });
  return seen; // Map<userId|userName, { name, color }>
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(196,181,253,0.3)", borderRadius: "12px",
      padding: "10px 14px", boxShadow: "0 8px 24px rgba(139,92,246,0.1)",
      fontSize: "12px"
    }}>
      {label && <p style={{ color: "#9ca3af", margin: "0 0 6px" }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#6d28d9", fontWeight: 600, margin: "2px 0" }}>
          {p.name}: {p.value} min
        </p>
      ))}
    </div>
  );
};

// CHANGE #14: Progress bar comparing allocated vs actual hours
function AllocatedVsActual({ allocatedHours, weeklyActualMinutes, categories }) {
  const cats = categories.filter(c => allocatedHours[c] !== undefined || weeklyActualMinutes[c]);
  if (cats.length === 0) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
      border: "1px solid rgba(196,181,253,0.18)", borderRadius: "18px",
      padding: "24px", boxShadow: "0 2px 12px rgba(139,92,246,0.05)",
      marginBottom: "20px"
    }}>
      <p style={{ fontSize: "13px", fontWeight: 600, color: "#4b5563", margin: "0 0 18px" }}>
        Allocated vs actual hours <span style={{ color: "#c4b5fd", fontWeight: 400 }}>(this week)</span>
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {cats.map(cat => {
          const allocated = (allocatedHours[cat] || 0) * 60; // convert hrs → min
          const actual    = weeklyActualMinutes[cat] || 0;
          const pct       = allocated > 0 ? Math.min(100, Math.round((actual / allocated) * 100)) : 0;
          const over      = actual > allocated && allocated > 0;
          const barColor  = over ? "#f87171" : CATEGORY_COLORS[cat] || "#818cf8";

          return (
            <div key={cat}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#4b5563" }}>{cat}</span>
                <span style={{ fontSize: "11px", color: over ? "#ef4444" : "#9ca3af", fontWeight: 500 }}>
                  {Math.round(actual / 60 * 10) / 10}h actual
                  {allocated > 0 ? ` / ${allocatedHours[cat]}h allocated` : " (no allocation set)"}
                  {over && " ⚠ Over"}
                </span>
              </div>
              <div style={{ height: "8px", borderRadius: "99px", background: "rgba(196,181,253,0.15)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "99px",
                  width: allocated > 0 ? `${pct}%` : "0%",
                  background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                  transition: "width 0.4s ease"
                }} />
              </div>
              {allocated > 0 && (
                <div style={{ fontSize: "10px", color: "#c4b5fd", marginTop: "3px", textAlign: "right" }}>
                  {pct}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  // CHANGE #13: member selector
  const [selectedUserId, setSelectedUserId] = useState("");
  const { users } = useUsers();

  const { data, allocatedHours, weeklyActualMinutes, loading, error } = useAnalytics(selectedUserId);

  // CHANGE #12: build stable colour map for all people in the data
  const personColorMap = buildPersonColorMap(data);

  // Bar chart — one bar per person-day entry, coloured by person
  const barData = data.map(entry => {
    const key = String(entry.userId || entry.userName);
    const color = personColorMap.get(key)?.color || "#c084fc";
    return {
      name: `${entry.userName.split(" ")[0]} · ${dayjs(entry.date).format("MMM D")}`,
      minutes: entry.totalMinutes,
      color,
      personKey: key,
    };
  });

  // Summary counts
  const totalMinutes  = data.reduce((sum, e) => sum + e.totalMinutes, 0);
  const uniqueUsers   = [...new Set(data.map(e => e.userName))];
  const uniqueDays    = [...new Set(data.map(e => dayjs(e.date).format("YYYY-MM-DD")))];

  // CHANGE #13: per-person pie data (category breakdown for selected user or all)
  const categoryTotals = {};
  data.forEach(entry => {
    (entry.byCategory || []).forEach(({ category, minutes }) => {
      if (!category) return;
      categoryTotals[category] = (categoryTotals[category] || 0) + minutes;
    });
  });
  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  // All categories seen
  const allCategories = [...new Set([
    ...Object.keys(allocatedHours),
    ...Object.keys(weeklyActualMinutes),
    ...Object.keys(categoryTotals)
  ])];

  const summaryCards = [
    { label: "Total time tracked",  value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, color: "#818cf8", bg: "rgba(238,242,255,0.7)", border: "rgba(196,181,253,0.3)" },
    { label: "Team members",        value: uniqueUsers.length,  color: "#c084fc", bg: "rgba(250,245,255,0.7)", border: "rgba(233,213,255,0.4)" },
    { label: "Active days",         value: uniqueDays.length,   color: "#34d399", bg: "rgba(236,253,245,0.7)", border: "rgba(110,231,183,0.3)" },
  ];

  // CHANGE #12: Legend for bar chart person colours
  const personLegend = [...personColorMap.entries()].map(([key, { name, color }]) => ({ key, name, color }));

  return (
    <Layout>
      <div style={{ padding: "28px 32px", maxWidth: "1280px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "13px", color: "#a78bfa", fontWeight: 500, margin: "0 0 4px" }}>Workspace insights</p>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "26px", fontWeight: 700, color: "#1e1b4b", margin: 0 }}>
              Analytics ✦
            </h1>
          </div>

          {/* CHANGE #13: Member selector dropdown */}
          <div style={{ position: "relative" }}>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              style={{
                padding: "8px 32px 8px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 500,
                background: selectedUserId ? "rgba(233,213,255,0.4)" : "rgba(255,255,255,0.85)",
                border: selectedUserId ? "1px solid rgba(196,181,253,0.6)" : "1px solid rgba(196,181,253,0.3)",
                color: selectedUserId ? "#7c3aed" : "#4b5563",
                cursor: "pointer", outline: "none", appearance: "none",
                fontFamily: "inherit", backdropFilter: "blur(8px)"
              }}
            >
              <option value="">All members</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
            <svg style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 3.5L5 6.5L8 3.5" stroke={selectedUserId ? "#a78bfa" : "#9ca3af"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
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

            {/* CHANGE #14: Allocated vs actual hours */}
            <AllocatedVsActual
              allocatedHours={allocatedHours}
              weeklyActualMinutes={weeklyActualMinutes}
              categories={allCategories}
            />

            {/* CHANGE #12: Bar chart with per-person colours + legend */}
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(196,181,253,0.18)", borderRadius: "18px",
              padding: "24px", marginBottom: "20px",
              boxShadow: "0 2px 12px rgba(139,92,246,0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#4b5563", margin: 0 }}>
                  Time per person per day <span style={{ color: "#c4b5fd", fontWeight: 400 }}>(minutes)</span>
                </p>
                {/* CHANGE #12: Colour-coded legend */}
                {personLegend.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                    {personLegend.map(({ key, name, color }) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>{name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                  <Bar dataKey="minutes" radius={[6, 6, 0, 0]} name="Minutes">
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.75} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom row: pie + breakdown table */}
            <div style={{ display: "grid", gridTemplateColumns: selectedUserId ? "1fr 1fr" : "1fr 1fr", gap: "20px" }}>

              {/* CHANGE #13: Pie chart — category breakdown (for selected member or all) */}
              <div style={{
                background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(196,181,253,0.18)", borderRadius: "18px",
                padding: "24px", boxShadow: "0 2px 12px rgba(139,92,246,0.05)"
              }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#4b5563", margin: "0 0 4px" }}>
                  Time by category
                </p>
                {selectedUserId && (
                  <p style={{ fontSize: "11px", color: "#a78bfa", margin: "0 0 12px" }}>
                    {users.find(u => u._id === selectedUserId)?.name || "Member"}
                  </p>
                )}
                {!selectedUserId && (
                  <p style={{ fontSize: "11px", color: "#a78bfa", margin: "0 0 12px" }}>All members</p>
                )}
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
                            fillOpacity={0.82}
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

              {/* Per-member breakdown table */}
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
                      {data.map((entry, i) => {
                        const key = String(entry.userId || entry.userName);
                        const color = personColorMap.get(key)?.color || "#818cf8";
                        return (
                          <tr
                            key={i}
                            style={{ borderBottom: "1px solid rgba(196,181,253,0.08)", transition: "background 0.1s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(233,213,255,0.15)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            {/* CHANGE #12: colour dot matches bar chart */}
                            <td style={{ padding: "10px 0", fontSize: "13px", color: "#4b5563", fontWeight: 500 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                                {entry.userName}
                              </div>
                            </td>
                            <td style={{ padding: "10px 0", fontSize: "12px", color: "#9ca3af" }}>
                              {dayjs(entry.date).format("MMM D, YYYY")}
                            </td>
                            <td style={{ padding: "10px 0", fontSize: "13px", fontWeight: 700, color, textAlign: "right" }}>
                              {entry.totalMinutes}
                            </td>
                          </tr>
                        );
                      })}
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