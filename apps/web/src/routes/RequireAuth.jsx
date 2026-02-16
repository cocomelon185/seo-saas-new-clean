import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken, getAuthUser } from "../lib/authClient.js";
import AppShell from "../components/AppShell.jsx";

export default function RequireAuth({ children, role }) {
  const location = useLocation();
  const isServerRender = import.meta.env.SSR || typeof document === "undefined";
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (isServerRender || !isHydrated) {
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

  const token = getAuthToken();
  if (!token) {
    return <Navigate to={`/auth/signin?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  const user = getAuthUser();
  if (user && user.verified === false) {
    return <Navigate to={`/auth/verify?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (role) {
    if (role === "member") {
      if (user?.role && user.role !== "member" && user.role !== "admin") {
        return <Navigate to="/audit" replace />;
      }
    } else if (user?.role !== role) {
      return <Navigate to="/audit" replace />;
    }
  }
  return children;
}
