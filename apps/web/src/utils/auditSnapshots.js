const KEY = "rankypulse_audit_snapshots_v1";

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

export function listSnapshots() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  const arr = safeParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

export function saveSnapshot(result) {
  if (typeof window === "undefined") return null;
  if (!result) return null;

  const url = result.url || "";
  const score = result.score ?? null;
  const issues = Array.isArray(result.issues) ? result.issues : [];
  const createdAt = new Date().toISOString();

  const snap = {
    id: `${createdAt}__${url || "no-url"}`,
    createdAt,
    url,
    score,
    issues,
  };

  const all = listSnapshots();
  const next = [snap, ...all].slice(0, 50);

  window.localStorage.setItem(KEY, JSON.stringify(next));
  return snap;
}

export function deleteSnapshot(id) {
  if (typeof window === "undefined") return;
  const next = listSnapshots().filter(s => s.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearSnapshots() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function getSnapshot(id) {
  return listSnapshots().find(s => s.id === id) || null;
}

export function summarize(obj) {
  const issues = Array.isArray(obj?.issues) ? obj.issues : [];
  return {
    score: obj?.score ?? null,
    fixNow: issues.filter(i => i.priority === "fix_now").length,
    fixNext: issues.filter(i => i.priority === "fix_next").length,
    fixLater: issues.filter(i => i.priority === "fix_later").length,
    total: issues.length,
  };
}
