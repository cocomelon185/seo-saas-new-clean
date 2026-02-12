import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken, getAuthUser } from "../lib/authClient.js";
import AppShell from "../components/AppShell.jsx";

export default function RequireAuth({ children, role }) {
  const location = useLocation();
  const token = getAuthToken();
  // Only treat true server render as SSR fallback.
  // In browser, import.meta.env.SSR can be misleading in some build modes.
  const isSsg = typeof window === "undefined";

  if (isSsg) {
    return (
      <AppShell
        title="Sign in required"
        subtitle="Please sign in to access this page."
      >
        <div className="rp-card p-6 text-sm text-[var(--rp-text-500)]">
          Sign in to continue.
        </div>
      </AppShell>
    );
  }
  if (!token) {
    return <Navigate to={`/auth/signin?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  const user = getAuthUser();
  if (user && user.verified === false) {
    return <Navigate to={`/auth/verify?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (role) {
    if (role === "member") {
      if (!user?.role || (user.role !== "member" && user.role !== "admin")) {
        return <Navigate to="/audit" replace />;
      }
    } else if (user?.role !== role) {
      return <Navigate to="/audit" replace />;
    }
  }
  return children;
}
