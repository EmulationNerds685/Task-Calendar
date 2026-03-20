import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  {
    label: "Dashboard", path: "/dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8"/>
      </svg>
    )
  },
  {
    label: "Calendar", path: "/calendar",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="3" width="13" height="11.5" rx="2.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
        <path d="M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M1.5 6.5H14.5" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="5.5" cy="9.5" r="1" fill="currentColor"/>
        <circle cx="8" cy="9.5" r="1" fill="currentColor"/>
        <circle cx="10.5" cy="9.5" r="1" fill="currentColor"/>
      </svg>
    )
  },
  {
    label: "Analytics", path: "/analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 12L5.5 7.5L8.5 9.5L12 5L14 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 14H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    )
  },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&display=swap" rel="stylesheet" />
      <div className="flex h-screen overflow-hidden" style={{ background: "#faf8ff" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: collapsed ? "64px" : "220px",
            display: "flex",
            flexDirection: "column",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(12px)",
            borderRight: "1px solid rgba(196,181,253,0.2)",
            transition: "width 0.2s ease",
            flexShrink: 0,
            boxShadow: "2px 0 20px rgba(139,92,246,0.04)"
          }}
        >
          {/* Logo */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "18px 0" : "18px 16px",
            borderBottom: "1px solid rgba(196,181,253,0.15)"
          }}>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div style={{
                  width: "28px", height: "28px", borderRadius: "8px",
                  background: "linear-gradient(135deg, #c084fc, #818cf8)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
                    <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                    <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                    <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: "15px", fontWeight: 600, color: "#4c1d95", whiteSpace: "nowrap" }}>
                  TaskFlow
                </span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "7px", border: "1px solid rgba(196,181,253,0.3)", background: "transparent",
                cursor: "pointer", color: "#a78bfa", transition: "background 0.15s"
              }}
              onMouseEnter={e => e.target.style.background = "rgba(233,213,255,0.4)"}
              onMouseLeave={e => e.target.style.background = "transparent"}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                {collapsed
                  ? <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  : <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                }
              </svg>
            </button>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: collapsed ? "10px 0" : "9px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: "10px",
                  fontSize: "13.5px",
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: "none",
                  transition: "all 0.15s",
                  color: isActive ? "#7c3aed" : "#6b7280",
                  background: isActive ? "rgba(233,213,255,0.5)" : "transparent",
                  border: isActive ? "1px solid rgba(196,181,253,0.3)" : "1px solid transparent"
                })}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* User + Logout */}
          <div style={{ padding: "8px", borderTop: "1px solid rgba(196,181,253,0.15)" }}>
            {!collapsed && (
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", marginBottom: "4px",
                borderRadius: "10px", background: "rgba(250,245,255,0.6)"
              }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #e9d5ff, #c7d2fe)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 700, color: "#7c3aed"
                }}>
                  {initials}
                </div>
                <div style={{ overflow: "hidden", minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#1f2937", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user?.name}
                  </p>
                  <p style={{ fontSize: "11px", color: "#a78bfa", margin: 0, textTransform: "capitalize" }}>{user?.role}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
                gap: "8px", width: "100%", padding: collapsed ? "10px 0" : "9px 12px",
                borderRadius: "10px", border: "none", background: "transparent",
                fontSize: "13px", color: "#9ca3af", cursor: "pointer", transition: "all 0.15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(254,226,226,0.5)"; e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2H3C2.4 2 2 2.4 2 3V11C2 11.6 2.4 12 3 12H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M9 4L12 7L9 10M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {!collapsed && <span>Sign out</span>}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto" style={{ background: "#faf8ff" }}>
          {children}
        </main>
      </div>
    </>
  );
}