export function getAuthToken() {
  try {
    return localStorage.getItem("rp_auth_token") || "";
  } catch {
    return "";
  }
}

export function getAuthUser() {
  try {
    const raw = localStorage.getItem("rp_auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthSession({ token, user }) {
  try {
    if (token) localStorage.setItem("rp_auth_token", token);
    if (user) localStorage.setItem("rp_auth_user", JSON.stringify(user));
  } catch {}
}

export function clearAuthSession() {
  try {
    localStorage.removeItem("rp_auth_token");
    localStorage.removeItem("rp_auth_user");
  } catch {}
}
