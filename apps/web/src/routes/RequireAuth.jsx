import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken, getAuthUser } from "../lib/authClient.js";

export default function RequireAuth({ children, role }) {
  const location = useLocation();
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
      if (!user?.role || (user.role !== "member" && user.role !== "admin")) {
        return <Navigate to="/audit" replace />;
      }
    } else if (user?.role !== role) {
      return <Navigate to="/audit" replace />;
    }
  }
  return children;
}
