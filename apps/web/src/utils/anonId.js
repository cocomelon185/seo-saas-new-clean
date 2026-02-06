const KEY = "rp_anon_id";

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `anon_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function getAnonId() {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const next = makeId();
    window.localStorage.setItem(KEY, next);
    return next;
  } catch {
    return "";
  }
}
