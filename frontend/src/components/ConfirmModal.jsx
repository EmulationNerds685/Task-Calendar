import React from "react";
import { useTheme } from "../context/ThemeContext";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({ 
  show, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger" // danger | warning | info
}) {
  const { darkMode } = useTheme();
  if (!show) return null;

  const typeConfig = {
    danger:  { color: "#ef4444", iconBg: darkMode ? "rgba(239, 68, 68, 0.15)" : "rgba(254, 242, 242, 0.9)", btnBg: "linear-gradient(135deg, #f87171, #ef4444)" },
    warning: { color: "#f59e0b", iconBg: darkMode ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 251, 235, 0.9)", btnBg: "linear-gradient(135deg, #fbbf24, #f59e0b)" },
    info:    { color: "#3b82f6", iconBg: darkMode ? "rgba(59, 130, 246, 0.15)" : "rgba(239, 246, 255, 0.9)", btnBg: "linear-gradient(135deg, #60a5fa, #3b82f6)" }
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: darkMode ? "rgba(15, 23, 42, 0.5)" : "rgba(15, 23, 42, 0.3)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: "20px",
        animation: "fadeIn 0.2s ease-out forwards"
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--bg-modal)", backdropFilter: "blur(20px)",
          borderRadius: "24px", width: "100%", maxWidth: "400px",
          border: "1px solid var(--border-dim)",
          boxShadow: darkMode ? "0 25px 50px -12px rgba(0,0,0,0.5)" : "0 25px 50px -12px rgba(109, 40, 217, 0.25)",
          padding: "24px", position: "relative",
          animation: "scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: "absolute", top: "16px", right: "16px",
            background: "none", border: "none", color: "#94a3b8",
            cursor: "pointer", padding: "4px", borderRadius: "8px",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9"; e.currentTarget.style.color = "var(--text-main)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#94a3b8"; }}
        >
          <X size={20} />
        </button>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "18px",
            background: config.iconBg, color: config.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "20px"
          }}>
            <AlertTriangle size={28} strokeWidth={2.5} />
          </div>

          <h3 style={{ 
            margin: "0 0 12px", fontSize: "18px", fontWeight: 700, 
            color: "var(--text-main)", fontFamily: "'Inter', sans-serif" 
          }}>
            {title}
          </h3>
          
          <p style={{ 
            margin: 0, fontSize: "14px", color: "var(--text-muted)", 
            lineHeight: 1.6, maxWidth: "300px" 
          }}>
            {message}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "12px", borderRadius: "14px", fontSize: "14px",
              fontWeight: 600, background: darkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9", border: "none",
              color: darkMode ? "#94a3b8" : "#475569", cursor: "pointer", transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0"}
            onMouseLeave={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9"}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "12px", borderRadius: "14px", fontSize: "14px",
              fontWeight: 600, background: config.btnBg, border: "none",
              color: "white", cursor: "pointer", transition: "all 0.2s",
              boxShadow: `0 8px 16px -4px ${config.color}40`
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
