import React from "react";

export default function ConflictToast({ message, onConfirm, onDismiss }) {
  if (!message) return null;

  return (
    <div 
      onClick={e => e.stopPropagation()}
      style={{
        position: "fixed", top: "24px", left: "50%", transform: "translateX(-50%)",
        zIndex: 1000, width: "100%", maxWidth: "420px", padding: "0 16px",
        animation: "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
      
      <div style={{
        background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(16px)",
        borderRadius: "20px", border: "1px solid rgba(196, 181, 253, 0.3)",
        boxShadow: "0 12px 40px rgba(124, 58, 237, 0.15)",
        padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px",
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div style={{
            minWidth: "36px", height: "36px", borderRadius: "12px",
            background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
          }}>
            ⚠️
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1f2937" }}>
              Schedule Overlap
            </h4>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280", lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
          <button
            onClick={onDismiss}
            style={{
              background: "transparent", border: "none", color: "#9ca3af",
              fontSize: "18px", cursor: "pointer", padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={onDismiss}
            style={{
              padding: "6px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 600,
              background: "#f3f4f6", border: "none", color: "#4b5563",
              cursor: "pointer", transition: "background 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
            onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}
          >
            Review
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "6px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 600,
              background: "linear-gradient(135deg, #c084fc, #818cf8)",
              border: "none", color: "white", cursor: "pointer", transition: "opacity 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Save Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
