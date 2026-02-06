const KEY = "rankypulse.monitors.v1";

function safeParse(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    return u.toString();
  } catch {
    return String(raw || "").trim();
  }
}

export function listMonitors() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  const arr = safeParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

export function isMonitored(url) {
  const u = normalizeUrl(url);
  return listMonitors().some((m) => normalizeUrl(m.url) === u);
}

export function upsertMonitor(entry) {
  if (typeof window === "undefined") return null;
  if (!entry?.url) return null;
  const u = normalizeUrl(entry.url);
  const all = listMonitors();
  const existing = all.find((m) => normalizeUrl(m.url) === u);
  const next = existing ? all.map((m) => (normalizeUrl(m.url) === u ? { ...m, ...entry } : m)) : [{ ...entry, url: u }, ...all];
  window.localStorage.setItem(KEY, JSON.stringify(next.slice(0, 50)));
  return entry;
}

export function removeMonitor(url) {
  if (typeof window === "undefined") return;
  const u = normalizeUrl(url);
  const next = listMonitors().filter((m) => normalizeUrl(m.url) !== u);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function updateMonitorFromAudit(url, score, issuesCount) {
  if (!url) return;
  const now = new Date();
  const nextCheck = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return upsertMonitor({
    url,
    lastScore: typeof score === "number" ? score : null,
    lastIssues: typeof issuesCount === "number" ? issuesCount : null,
    lastChecked: now.toISOString(),
    nextCheck: nextCheck.toISOString()
  });
}
