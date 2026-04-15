import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { CheckCircle2, AlertCircle } from "lucide-react";

// Regex rules
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;

const validate = (form) => {
  const errors = {};
  if (!EMAIL_REGEX.test(form.email)) {
    errors.email = "Enter a valid email address";
  }
  if (!PASSWORD_REGEX.test(form.password)) {
    errors.password = "Password must be at least 6 characters with 1 letter and 1 number";
  }
  return errors;
};

export default function Login() {
  const { login } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    // Clear field error as user types
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setServerError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: "100%", padding: "10px 14px", fontSize: "14px",
    background: hasError ? (darkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(254,242,242,0.5)") : (darkMode ? "rgba(255,255,255,0.03)" : "#fafafa"),
    border: `1.5px solid ${hasError ? "rgba(239, 68, 68, 0.5)" : (darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb")}`,
    borderRadius: "12px", outline: "none",
    transition: "border-color 0.2s", boxSizing: "border-box", color: "var(--text-main)",
    fontFamily: "inherit"
  });

  return (
    <div className="min-h-screen flex" style={{ background: darkMode ? "var(--bg-main)" : "linear-gradient(135deg, #fdf6f0 0%, #f5eef8 50%, #eef4fd 100%)" }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div style={{ position: "absolute", top: "-60px", left: "-60px", width: "360px", height: "360px", borderRadius: "50%", background: darkMode ? "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(233,213,255,0.5) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "80px", right: "-40px", width: "280px", height: "280px", borderRadius: "50%", background: darkMode ? "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" : "radial-gradient(circle, rgba(186,230,255,0.4) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-40px", left: "120px", width: "200px", height: "200px", borderRadius: "50%", background: darkMode ? "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" : "radial-gradient(circle, rgba(254,215,170,0.4) 0%, transparent 70%)" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #c084fc, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
                <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 600, color: "var(--accent-purple)" }}>TaskFlow</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <p style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.08em", color: "#a855f7", textTransform: "uppercase", marginBottom: "12px" }}>
              Manage · Schedule · Thrive
            </p>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "42px", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.2 }}>
              Your team's tasks,<br />beautifully organised.
            </h1>
          </div>
          <p style={{ fontSize: "16px", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: "400px" }}>
            Auto-scheduling, smart priorities, and real-time analytics — everything your team needs in one calm, focused workspace.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {["Auto-scheduling", "Kanban & List views", "Team analytics", "Calendar sync"].map(f => (
              <span key={f} style={{ 
                padding: "6px 14px", borderRadius: "99px", 
                background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)", 
                border: "1px solid var(--border-dim)", 
                fontSize: "13px", color: "var(--accent-purple)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "6px" 
              }}>
                <CheckCircle2 size={12} strokeWidth={2} />{f}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 mb-4">
          <div style={{ 
            background: "var(--bg-card)", backdropFilter: "blur(12px)", 
            border: "1px solid var(--border-dim)", borderRadius: "16px", padding: "16px 20px", maxWidth: "340px", 
            boxShadow: darkMode ? "0 8px 32px rgba(0,0,0,0.2)" : "0 8px 32px rgba(139,92,246,0.08)" 
          }}>
            <div className="flex items-center gap-3 mb-3">
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-purple)" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Q4 Investment Analysis</span>
              <span style={{ marginLeft: "auto", fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: darkMode ? "rgba(245,158,11,0.2)" : "#fef3c7", color: "#f59e0b", fontWeight: 500 }}>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ height: "4px", flex: 1, borderRadius: "99px", background: darkMode ? "rgba(255,255,255,0.05)" : "#ede9fe", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "65%", borderRadius: "99px", background: "linear-gradient(90deg, #a78bfa, #818cf8)" }} />
              </div>
              <span style={{ fontSize: "11px", color: "var(--accent-purple)", fontWeight: 600 }}>65%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div style={{ 
          width: "100%", maxWidth: "420px", 
          background: "var(--bg-card)", backdropFilter: "blur(16px)", 
          borderRadius: "24px", border: "1px solid var(--border-dim)", 
          padding: "40px", boxShadow: darkMode ? "0 20px 60px rgba(0,0,0,0.3)" : "0 20px 60px rgba(139,92,246,0.08)" 
        }}>

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, #c084fc, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
                <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: "16px", fontWeight: 600, color: "var(--accent-purple)" }}>TaskFlow</span>
          </div>

          <div className="mb-8">
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "28px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px" }}>
              Welcome back
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Sign in to your workspace</p>
          </div>

          {serverError && (
            <div style={{ marginBottom: "20px", padding: "12px 16px", background: darkMode ? "rgba(239,68,68,0.1)" : "#fff1f2", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", fontSize: "13px", color: "#ef4444" }}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                Email address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => handleChange("email", e.target.value)}
                placeholder="you@example.com"
                style={inputStyle(!!errors.email)}
                onFocus={e => { if (!errors.email) e.target.style.borderColor = "var(--accent-purple)"; }}
                onBlur={e => { if (!errors.email) e.target.style.borderColor = darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb"; }}
              />
              {errors.email && (
                <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "5px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <AlertCircle size={12} strokeWidth={2.5} /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => handleChange("password", e.target.value)}
                placeholder="••••••••"
                style={inputStyle(!!errors.password)}
                onFocus={e => { if (!errors.password) e.target.style.borderColor = "var(--accent-purple)"; }}
                onBlur={e => { if (!errors.password) e.target.style.borderColor = darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb"; }}
              />
              {errors.password && (
                <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "5px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <AlertCircle size={12} strokeWidth={2.5} /> {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "11px", borderRadius: "12px",
                background: loading ? "#d8b4fe" : "linear-gradient(135deg, #c084fc 0%, #818cf8 100%)",
                border: "none", color: "white", fontSize: "14px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", transition: "opacity 0.2s",
                marginTop: "4px", fontFamily: "inherit"
              }}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <p style={{ marginTop: "24px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--accent-purple)", fontWeight: 600, textDecoration: "none" }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&display=swap" rel="stylesheet" />
    </div>
  );
}