const KEY = "rankypulse.rank_checks.v1";
const NEAR_DUP_WINDOW_MS = 30 * 1000;

function safeParse(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

export function normalizeKeywordForStore(keyword) {
  return String(keyword || "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeDomainForStore(domain) {
  const raw = String(domain || "").trim().toLowerCase();
  if (!raw) return "";
  return raw
    .replace(/^https?:\/\//, "")
    .replace(/[?#].*$/, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

function normalizeTimestamp(value) {
  const ts = Date.parse(String(value || ""));
  return Number.isFinite(ts) ? ts : null;
}

function sanitizeEntry(entry) {
  const createdAt = String(entry?.createdAt || new Date().toISOString());
  const keyword = normalizeKeywordForStore(entry?.keyword);
  const domain = normalizeDomainForStore(entry?.domain);
  const rank = entry?.rank ?? entry?.position ?? null;
  const id = String(entry?.id || `${createdAt}__${keyword}__${domain}`);
  return { id, createdAt, keyword, domain, rank };
}

export function listRankChecks() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  const arr = safeParse(raw, []);
  if (!Array.isArray(arr)) return [];
  return arr.map(sanitizeEntry);
}

export function saveRankCheck(entry) {
  if (typeof window === "undefined") return null;
  if (!entry) return null;

  const createdAt = new Date().toISOString();
  const keyword = normalizeKeywordForStore(entry.keyword);
  const domain = normalizeDomainForStore(entry.domain);
  const rank = entry.rank ?? entry.position ?? null;

  const item = {
    id: `${createdAt}__${keyword}__${domain}`,
    createdAt,
    keyword,
    domain,
    rank
  };

  const all = listRankChecks().map(sanitizeEntry);
  const nowMs = normalizeTimestamp(createdAt) || Date.now();
  const nearIndex = all.findIndex((x) => {
    if (x.keyword !== keyword || x.domain !== domain) return false;
    const xMs = normalizeTimestamp(x.createdAt);
    if (!xMs) return false;
    return Math.abs(nowMs - xMs) <= NEAR_DUP_WINDOW_MS;
  });

  let next;
  let savedItem = item;
  if (nearIndex >= 0) {
    const existing = all[nearIndex];
    const merged = {
      ...existing,
      createdAt,
      rank
    };
    savedItem = merged;
    const without = all.filter((_, idx) => idx !== nearIndex);
    next = [merged, ...without].slice(0, 100);
  } else {
    next = [item, ...all].slice(0, 100);
  }

  window.localStorage.setItem(KEY, JSON.stringify(next));
  return savedItem;
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
