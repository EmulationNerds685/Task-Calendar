import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";
import useSettings from "../../hooks/useSettings";
import { useTheme } from "../../context/ThemeContext";
import { Check, Sparkles } from "lucide-react";

/*
 CHANGE #4: Admin settings panel.
 Manage categories, statuses, priorities (add / rename / remove).
 CHANGE #14: Set weekly allocated hours per category.
*/

const getInputStyle = (darkMode) => ({
  padding: "8px 12px", borderRadius: "10px", fontSize: "13px", fontFamily: "inherit",
  background: darkMode ? "rgba(255,255,255,0.03)" : "#fafafa", 
  border: darkMode ? "1.5px solid rgba(255,255,255,0.1)" : "1.5px solid #e5e7eb",
  outline: "none", color: "var(--text-main)", transition: "border-color 0.15s",
  boxSizing: "border-box"
});

// Reusable tag-list editor: shows current values as pills, can add/rename/remove
function TagListEditor({ title, description, items, onUpdate, darkMode, color = "var(--accent-purple)", accent = "rgba(139,92,246,0.15)" }) {
  const [draft, setDraft] = useState("");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingVal, setEditingVal] = useState("");
  const [saving, setSaving] = useState(false);
  const inputStyle = getInputStyle(darkMode);

  const add = async () => {
    const trimmed = draft.trim();
    if (!trimmed || items.includes(trimmed)) return;
    setSaving(true);
    await onUpdate([...items, trimmed]);
    setDraft("");
    setSaving(false);
  };

  const remove = async (idx) => {
    await onUpdate(items.filter((_, i) => i !== idx));
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditingVal(items[idx]);
  };

  const saveEdit = async (idx) => {
    const trimmed = editingVal.trim();
    if (!trimmed) return;
    const updated = items.map((item, i) => i === idx ? trimmed : item);
    await onUpdate(updated);
    setEditingIdx(null);
  };

  return (
    <div style={{
      background: "var(--bg-card)", backdropFilter: "blur(8px)",
      border: "1px solid var(--border-dim)", borderRadius: "18px",
      padding: "22px 24px", boxShadow: darkMode ? "none" : "0 2px 12px rgba(139,92,246,0.04)"
    }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "16px", fontWeight: 700, color: "var(--text-main)", margin: "0 0 4px" }}>
          {title}
        </h3>
        {description && <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{description}</p>}
      </div>

      {/* Current items */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px", minHeight: "36px" }}>
        {items.map((item, idx) => (
          <div key={idx} style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "5px 10px", borderRadius: "99px",
            background: accent, border: "1px solid var(--border-dim)"
          }}>
            {editingIdx === idx ? (
              <input
                autoFocus
                value={editingVal}
                onChange={e => setEditingVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveEdit(idx); if (e.key === "Escape") setEditingIdx(null); }}
                onBlur={() => saveEdit(idx)}
                style={{
                  ...inputStyle, padding: "2px 6px", fontSize: "12px",
                  background: darkMode ? "rgba(0,0,0,0.2)" : "white", minWidth: "80px", maxWidth: "160px"
                }}
              />
            ) : (
              <span
                onClick={() => startEdit(idx)}
                title="Click to rename"
                style={{ fontSize: "12px", fontWeight: 500, color, cursor: "text" }}
              >
                {item}
              </span>
            )}
            <button
              onClick={() => remove(idx)}
              style={{
                width: "16px", height: "16px", borderRadius: "50%", border: "none",
                background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(196,181,253,0.3)", 
                color: "var(--accent-purple)", fontSize: "10px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                lineHeight: 1, padding: 0, transition: "background 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(239,68,68,0.2)" : "rgba(252,165,165,0.4)"}
              onMouseLeave={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.08)" : "rgba(196,181,253,0.3)"}
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <span style={{ fontSize: "12px", color: "var(--text-muted)", padding: "6px 0" }}>No items yet</span>
        )}
      </div>

      {/* Add new */}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") add(); }}
          placeholder={`Add new ${title.toLowerCase().replace(/s$/, "")}…`}
          style={{ ...inputStyle, flex: 1 }}
          onFocus={e => e.target.style.borderColor = "var(--accent-purple)"}
          onBlur={e => e.target.style.borderColor = darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
        />
        <button
          onClick={add}
          disabled={saving || !draft.trim()}
          style={{
            padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
            background: "linear-gradient(135deg, #c084fc, #818cf8)",
            border: "none", color: "white", cursor: saving || !draft.trim() ? "not-allowed" : "pointer",
            opacity: saving || !draft.trim() ? 0.5 : 1, transition: "opacity 0.15s",
            whiteSpace: "nowrap", fontFamily: "inherit"
          }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}

// CHANGE #14: Allocated hours editor per category
function AllocatedHoursEditor({ categories, allocatedHours, onUpdate, darkMode }) {
  const inputStyle = getInputStyle(darkMode);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Pre-populate draft from current allocatedHours
    const init = {};
    categories.forEach(cat => {
      init[cat] = allocatedHours[cat] !== undefined ? String(allocatedHours[cat]) : "";
    });
    setDraft(init);
  }, [categories, allocatedHours]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {};
    Object.entries(draft).forEach(([cat, val]) => {
      const n = parseFloat(val);
      if (!isNaN(n) && n >= 0) payload[cat] = n;
    });
    await onUpdate(payload);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{
      background: "var(--bg-card)", backdropFilter: "blur(8px)",
      border: "1px solid var(--border-dim)", borderRadius: "18px",
      padding: "22px 24px", boxShadow: darkMode ? "none" : "0 2px 12px rgba(139,92,246,0.04)"
    }}>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "16px", fontWeight: 700, color: "var(--text-main)", margin: "0 0 4px" }}>
          Weekly allocated hours
        </h3>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
          Set target hours per category per week — used in the analytics allocated vs actual chart.
        </p>
      </div>

      {categories.length === 0 ? (
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No categories defined yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          {categories.map(cat => (
            <div key={cat}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-main)", marginBottom: "5px" }}>
                {cat}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={draft[cat] ?? ""}
                  onChange={e => setDraft(d => ({ ...d, [cat]: e.target.value }))}
                  placeholder="hrs"
                  style={{ ...inputStyle, width: "90px" }}
                  onFocus={e => e.target.style.borderColor = "var(--accent-purple)"}
                  onBlur={e => e.target.style.borderColor = darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
                />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>hrs / week</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || categories.length === 0}
        style={{
          padding: "9px 22px", borderRadius: "11px", fontSize: "13px", fontWeight: 600,
          background: saved ? (darkMode ? "rgba(16,185,129,0.2)" : "rgba(236,253,245,0.9)") : "linear-gradient(135deg, #c084fc, #818cf8)",
          border: saved ? "1px solid rgba(110,231,183,0.5)" : "none",
          color: saved ? (darkMode ? "#34d399" : "#10b981") : "white",
          cursor: saving || categories.length === 0 ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1, transition: "all 0.2s", fontFamily: "inherit"
        }}
      >
        {saved ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <Check size={14} strokeWidth={2.5} /> Saved
          </span>
        ) : saving ? "Saving…" : "Save allocations"}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { darkMode } = useTheme();
  const { settings, loading, refetch } = useSettings();
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

  const showSuccess = (msg) => {
    setGlobalSuccess(msg);
    setTimeout(() => setGlobalSuccess(""), 2500);
  };

  const patch = async (payload) => {
    setGlobalError("");
    try {
      await api.patch("/settings", payload);
      await refetch();
      showSuccess("Settings updated");
    } catch (err) {
      setGlobalError(err.response?.data?.message || "Failed to update settings");
    }
  };

  return (
    <Layout>
      <div style={{ padding: "28px 32px", maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "13px", color: "var(--accent-purple)", fontWeight: 500, margin: "0 0 4px" }}>Admin only</p>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "26px", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            Settings <Sparkles size={18} color="var(--accent-purple)" style={{ flexShrink: 0 }} />
          </h1>
        </div>

        {globalError && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", background: darkMode ? "rgba(239,68,68,0.1)" : "rgba(254,242,242,0.8)", border: "1px solid rgba(252,165,165,0.4)", borderRadius: "12px", fontSize: "13px", color: "#ef4444" }}>
            {globalError}
          </div>
        )}
        {globalSuccess && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", background: darkMode ? "rgba(16,185,129,0.1)" : "rgba(236,253,245,0.8)", border: "1px solid rgba(110,231,183,0.4)", borderRadius: "12px", fontSize: "13px", color: "#34d399", display: "flex", alignItems: "center", gap: "8px" }}>
            <Check size={14} strokeWidth={2.5} /> {globalSuccess}
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid #e9d5ff", borderTopColor: "#a78bfa", animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Hint banner */}
            <div style={{
              padding: "14px 18px", borderRadius: "14px",
              background: darkMode ? "rgba(139,92,246,0.1)" : "rgba(238,242,255,0.7)", 
              border: "1px solid var(--border-dim)",
              fontSize: "13px", color: "var(--accent-purple)", lineHeight: 1.6
            }}>
              <strong>Tip:</strong> Click any tag label to rename it inline. Changes apply immediately across all dropdowns in TaskForm and Filters.
            </div>

            {/* Categories */}
            <TagListEditor
              title="Categories"
              description="Task categories shown in forms and filters."
              items={settings.categories}
              onUpdate={cats => patch({ categories: cats })}
              darkMode={darkMode}
            />

            {/* Statuses */}
            <TagListEditor
              title="Statuses"
              description="Task status options. Removing a status won't change existing tasks."
              items={settings.statuses}
              onUpdate={statuses => patch({ statuses })}
              color="var(--accent-purple)"
              accent={darkMode ? "rgba(99,102,241,0.15)" : "rgba(238,242,255,0.6)"}
              darkMode={darkMode}
            />

            {/* Priorities */}
            <TagListEditor
              title="Priorities"
              description="Priority levels. Keep High / Medium / Low for auto-scheduler compatibility."
              items={settings.priorities}
              onUpdate={priorities => patch({ priorities })}
              color="#f59e0b"
              accent={darkMode ? "rgba(245,158,11,0.15)" : "rgba(255,251,235,0.6)"}
              darkMode={darkMode}
            />

            {/* CHANGE #14: Allocated hours */}
            <AllocatedHoursEditor
              categories={settings.categories}
              allocatedHours={settings.allocatedHours}
              onUpdate={allocatedHours => patch({ allocatedHours })}
              darkMode={darkMode}
            />

          </div>
        )}
      </div>
    </Layout>
  );
}