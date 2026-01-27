const KEY = "rankypulse.audit_history.v1";
const MAX = 10;

export function loadAuditHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function pushAuditHistory(entry) {
  try {
    const prev = loadAuditHistory();
    const next = [entry, ...prev.filter((x) => x && x.url !== entry.url)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadAuditHistory();
  }
}
