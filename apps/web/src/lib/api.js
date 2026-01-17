export const API_BASE = import.meta.env.VITE_API_BASE || "https://api.rankypulse.com";

export function getToken() {
  try { return localStorage.getItem("rankypulse_token") || ""; } catch { return ""; }
}

export function setToken(t) {
  try { localStorage.setItem("rankypulse_token", t || ""); } catch {}
}

export function clearToken() {
  try { localStorage.removeItem("rankypulse_token"); } catch {}
}

export async function api(path, { method = "GET", body } = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { ok: false, raw: text }; }

  if (!res.ok || json?.ok === false) {
    const msg = json?.error?.message || json?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json;
}
