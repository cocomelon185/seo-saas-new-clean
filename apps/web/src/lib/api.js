const BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE) ||
  "";

export async function api(path, { method = "GET", headers = {}, body } = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "omit",
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const err = new Error("API_ERROR");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function getToken() { return ""; }
export function setToken() {}
export function clearToken() {}
