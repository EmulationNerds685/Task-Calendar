import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { User, Zap, AlertCircle } from "lucide-react";

// Regex rules
const NAME_REGEX = /^[a-zA-Z\s]{2,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;

const validate = (form) => {
  const errors = {};

  if (!NAME_REGEX.test(form.name.trim())) {
    if (form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (form.name.trim().length > 50) {
      errors.name = "Name must be under 50 characters";
    } else {
      errors.name = "Name can only contain letters and spaces";
    }
  }

  if (!EMAIL_REGEX.test(form.email)) {
    errors.email = "Enter a valid email address";
  }

  if (!PASSWORD_REGEX.test(form.password)) {
    if (form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    } else if (!/[a-zA-Z]/.test(form.password)) {
      errors.password = "Password must contain at least 1 letter";
    } else {
      errors.password = "Password must contain at least 1 number";
    }
  }

  return errors;
};

export default function Register() {
  const { register } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });
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
      await register(form.name, form.email, form.password, form.role);
      navigate("/dashboard");
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed");
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

  const FieldError = ({ msg }) => msg ? (
    <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "5px", display: "flex", alignItems: "center", gap: "4px" }}>
      <AlertCircle size={12} strokeWidth={2.5} /> {msg}
    </p>
  ) : null;

  // Live password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    const hasLength = pwd.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const score = [hasLength, hasLetter, hasNumber].filter(Boolean).length;
    if (score === 3) return { label: "Strong", color: "#10b981", width: "100%" };
    if (score === 2) return { label: "Fair", color: "#f59e0b", width: "66%" };
    return { label: "Weak", color: "#ef4444", width: "33%" };
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: darkMode ? "var(--bg-main)" : "linear-gradient(135deg, #fdf6f0 0%, #f5eef8 50%, #eef4fd 100%)" }}>
      {/* Blobs */}
      <div style={{ position: "fixed", top: "-80px", right: "-60px", width: "400px", height: "400px", borderRadius: "50%", background: darkMode ? "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(186,230,255,0.4) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-60px", left: "-40px", width: "320px", height: "320px", borderRadius: "50%", background: darkMode ? "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" : "radial-gradient(circle, rgba(254,215,170,0.35) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: "40%", left: "-80px", width: "280px", height: "280px", borderRadius: "50%", background: darkMode ? "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" : "radial-gradient(circle, rgba(233,213,255,0.4) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "460px", position: "relative", zIndex: 10, background: "var(--bg-card)", backdropFilter: "blur(16px)", borderRadius: "24px", border: "1px solid var(--border-dim)", padding: "40px", boxShadow: darkMode ? "0 20px 60px rgba(0,0,0,0.3)" : "0 20px 60px rgba(139,92,246,0.08)" }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #c084fc, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: "17px", fontWeight: 600, color: "var(--accent-purple)" }}>TaskFlow</span>
        </div>

        <div className="mb-8">
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "28px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px" }}>
            Create your account
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Get your team up and running today</p>
        </div>

        {serverError && (
          <div style={{ marginBottom: "20px", padding: "12px 16px", background: darkMode ? "rgba(239,68,68,0.1)" : "#fff1f2", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", fontSize: "13px", color: "#ef4444" }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>Your name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange("name", e.target.value)}
              placeholder="Jane Smith"
              style={inputStyle(!!errors.name)}
              onFocus={e => { if (!errors.name) e.target.style.borderColor = "var(--accent-purple)"; }}
              onBlur={e => { if (!errors.name) e.target.style.borderColor = darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb"; }}
            />
            <FieldError msg={errors.name} />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>Email address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => handleChange("email", e.target.value)}
              placeholder="you@example.com"
              style={inputStyle(!!errors.email)}
              onFocus={e => { if (!errors.email) e.target.style.borderColor = "var(--accent-purple)"; }}
              onBlur={e => { if (!errors.email) e.target.style.borderColor = darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb"; }}
            />
            <FieldError msg={errors.email} />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => handleChange("password", e.target.value)}
              placeholder="Min. 6 characters with a letter and number"
              style={inputStyle(!!errors.password)}
              onFocus={e => { if (!errors.password) e.target.style.borderColor = "var(--accent-purple)"; }}
              onBlur={e => { if (!errors.password) e.target.style.borderColor = darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb"; }}
            />
            {/* Live strength bar */}
            {form.password && !errors.password && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ height: "3px", borderRadius: "99px", background: darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: strength?.width, background: strength?.color, borderRadius: "99px", transition: "width 0.3s, background 0.3s" }} />
                </div>
                <p style={{ fontSize: "11px", color: strength?.color, marginTop: "4px", fontWeight: 500 }}>
                  {strength?.label} password
                </p>
              </div>
            )}
            <FieldError msg={errors.password} />
          </div>

          {/* Role selector */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>I am a…</label>
            <div className="flex gap-3">
              {[
                { val: "member", label: "Team Member", Icon: User, desc: "View & update tasks" },
                { val: "admin", label: "Admin", Icon: Zap, desc: "Full access & create tasks" }
              ].map(({ val, label, Icon, desc }) => (
                <button
                  key={val}
                  type="button"
                  onConfirm={() => handleChange("role", val)}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "12px", textAlign: "left",
                    border: form.role === val ? "2px solid var(--accent-purple)" : "1.5px solid var(--border-dim)",
                    background: form.role === val ? (darkMode ? "rgba(139,92,246,0.15)" : "rgba(233,213,255,0.3)") : (darkMode ? "rgba(255,255,255,0.02)" : "white"),
                    cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "6px", color: form.role === val ? "var(--accent-purple)" : "var(--text-muted)" }}>
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>{label}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{desc}</div>
                </button>
              ))}
            </div>
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
            {loading ? "Creating account..." : "Create account →"}
          </button>
        </form>

        <p style={{ marginTop: "24px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent-purple)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&display=swap" rel="stylesheet" />
    </div>
  );
}