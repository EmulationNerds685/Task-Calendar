import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #fdf6f0 0%, #f5eef8 50%, #eef4fd 100%)"
      }}>
        {/* Soft blobs */}
        <div style={{
          position: "fixed", top: "-80px", right: "-60px",
          width: "320px", height: "320px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(186,230,255,0.35) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "fixed", bottom: "-40px", left: "-40px",
          width: "260px", height: "260px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(233,213,255,0.4) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        {/* Logo mark */}
        <div style={{
          width: "44px", height: "44px", borderRadius: "13px",
          background: "linear-gradient(135deg, #c084fc, #818cf8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "20px",
          boxShadow: "0 8px 24px rgba(139,92,246,0.25)"
        }}>
          <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
            <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
            <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
          </svg>
        </div>

        {/* Spinner */}
        <div style={{
          width: "28px", height: "28px", borderRadius: "50%",
          border: "3px solid rgba(233,213,255,0.6)", borderTopColor: "#a78bfa",
          animation: "spin 0.7s linear infinite"
        }} />

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
}