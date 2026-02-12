const hasStorage = () => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

export function getAuthToken() {
  try {
    if (!hasStorage()) return "";
    return window.localStorage.getItem("rp_auth_token") || "";
  } catch {
    return "";
  }
}

export function getAuthUser() {
  try {
    if (!hasStorage()) return null;
    const raw = window.localStorage.getItem("rp_auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAuthDisplayName(user = getAuthUser()) {
  if (!user || typeof user !== "object") return "";
  const fullName = String(
    user.name ||
    user.full_name ||
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    ""
  ).trim();
  if (fullName) return fullName;

  const givenFamily = [user.given_name, user.family_name].filter(Boolean).join(" ").trim();
  if (givenFamily) return givenFamily;
  return "";
}

export function setAuthSession({ token, user }) {
  try {
    if (!hasStorage()) return;
    if (token) window.localStorage.setItem("rp_auth_token", token);
    if (user) window.localStorage.setItem("rp_auth_user", JSON.stringify(user));
  } catch {}
}

export function clearAuthSession() {
  try {
    if (!hasStorage()) return;
    window.localStorage.removeItem("rp_auth_token");
    window.localStorage.removeItem("rp_auth_user");
  } catch {}
}
