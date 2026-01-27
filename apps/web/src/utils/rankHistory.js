const KEY = "rankypulse.rank_checks.v1";

function safeParse(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

export function listRankChecks() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  const arr = safeParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

export function saveRankCheck(entry) {
  if (typeof window === "undefined") return null;
  if (!entry) return null;

  const createdAt = new Date().toISOString();
  const keyword = entry.keyword || "";
  const domain = entry.domain || "";
  const rank = entry.rank ?? entry.position ?? null;

  const item = {
    id: `${createdAt}__${keyword}__${domain}`,
    createdAt,
    keyword,
    domain,
    rank
  };

  const all = listRankChecks();
  const next = [item, ...all].slice(0, 100);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return item;
}

export function deleteRankCheck(id) {
  if (typeof window === "undefined") return;
  const next = listRankChecks().filter(x => x.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearRankChecks() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
