export function getToken() {
  return localStorage.getItem("rp_token") || "";
}

export function setToken(token) {
  localStorage.setItem("rp_token", token || "");
}

export function clearToken() {
  localStorage.removeItem("rp_token");
}

export async function apiFetch(path, opts = {}) {
  const headers = new Headers(opts.headers || {});
  if (!headers.has("Content-Type") && opts.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(path, { ...opts, headers, credentials: "include" });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json().catch(() => null) : await res.text().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || res.statusText);
  return data;
}
