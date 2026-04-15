import { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  // Keep a ref of timers so we can clear on manual dismiss
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * toast({ message, type, duration })
   * type: "success" | "error" | "warning" | "info"
   * duration: ms (default 4000, pass 0 for sticky)
   */
  const toast = useCallback(({ message, type = "info", duration = 4000 }) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      timers.current[id] = setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  // Convenience shortcuts
  toast.success = (msg, dur) => toast({ message: msg, type: "success", duration: dur });
  toast.error   = (msg, dur) => toast({ message: msg, type: "error",   duration: dur });
  toast.warning = (msg, dur) => toast({ message: msg, type: "warning", duration: dur });
  toast.info    = (msg, dur) => toast({ message: msg, type: "info",    duration: dur });

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ─── Internal Toast Container + individual Toast ─── */

const palette = {
  success: { bg: "rgba(236,253,245,0.97)", border: "#34d399", Icon: CheckCircle,    iconBg: "#34d399", text: "#065f46" },
  error:   { bg: "rgba(254,242,242,0.97)", border: "#f87171", Icon: XCircle,         iconBg: "#f87171", text: "#991b1b" },
  warning: { bg: "rgba(255,251,235,0.97)", border: "#fbbf24", Icon: AlertTriangle,   iconBg: "#f59e0b", text: "#92400e" },
  info:    { bg: "rgba(238,242,255,0.97)", border: "#818cf8", Icon: Info,            iconBg: "#818cf8", text: "#1e1b4b" },
};

function ToastItem({ id, message, type, onDismiss }) {
  const p = palette[type] || palette.info;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "14px",
        background: p.bg,
        border: `1px solid ${p.border}40`,
        boxShadow: `0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px ${p.border}25`,
        backdropFilter: "blur(16px)",
        minWidth: "280px",
        maxWidth: "380px",
        animation: "toastIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Coloured left bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: "4px", background: p.border, borderRadius: "14px 0 0 14px"
      }} />

      {/* Icon */}
      <div style={{
        width: "24px", height: "24px", borderRadius: "50%",
        background: p.border, flexShrink: 0, marginLeft: "4px",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white"
      }}>
        <p.Icon size={14} strokeWidth={2.5} />
      </div>

      {/* Message */}
      <p style={{
        margin: 0, flex: 1, fontSize: "13px", fontWeight: 500,
        color: p.text, lineHeight: 1.5, wordBreak: "break-word"
      }}>
        {message}
      </p>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(id)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: p.text, opacity: 0.5, fontSize: "16px", padding: "0 2px",
          lineHeight: 1, flexShrink: 0, transition: "opacity 0.15s"
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
        onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(120%) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem {...t} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
    </>
  );
}
