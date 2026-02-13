import { normalizeDomainForStore, normalizeKeywordForStore } from "./rankHistory.js";

const PROGRESS_KEY = "rankypulse.rank_progress.v1";
const ALERT_KEY = "rankypulse.rank_alert_prefs.v1";

const STEP_KEYS = ["title", "faq", "headings", "backlinks"];

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function defaultProgressState() {
  return {
    stepState: {
      title: false,
      faq: false,
      headings: false,
      backlinks: false
    },
    notes: "",
    updatedAt: new Date().toISOString()
  };
}

function defaultAlertPrefs() {
  return {
    weeklyEmail: false,
    rankDrop: false,
    competitorMove: false,
    opportunity: false,
    email: "",
    updatedAt: new Date().toISOString()
  };
}

export function normalizeScopeKey(domain, keyword) {
  const cleanDomain = normalizeDomainForStore(domain);
  const cleanKeyword = normalizeKeywordForStore(keyword);
  if (!cleanDomain || !cleanKeyword) return "global";
  return `${cleanDomain}::${cleanKeyword}`;
}

function readProgressMap() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(PROGRESS_KEY);
  const parsed = safeParse(raw, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

function writeProgressMap(next) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
}

function readAlertPrefs() {
  if (typeof window === "undefined") return defaultAlertPrefs();
  const raw = window.localStorage.getItem(ALERT_KEY);
  const parsed = safeParse(raw, null);
  if (!parsed || typeof parsed !== "object") return defaultAlertPrefs();
  return {
    ...defaultAlertPrefs(),
    ...parsed,
    email: String(parsed.email || "").trim()
  };
}

export function getProgressState(domain, keyword) {
  const key = normalizeScopeKey(domain, keyword);
  const map = readProgressMap();
  const hit = map[key];
  if (!hit || typeof hit !== "object") return defaultProgressState();
  return {
    ...defaultProgressState(),
    ...hit,
    stepState: {
      ...defaultProgressState().stepState,
      ...(hit.stepState || {})
    }
  };
}

export function setProgressStep(domain, keyword, stepKey, value) {
  if (!STEP_KEYS.includes(stepKey)) return getProgressState(domain, keyword);
  const key = normalizeScopeKey(domain, keyword);
  const map = readProgressMap();
  const current = getProgressState(domain, keyword);
  const next = {
    ...current,
    stepState: {
      ...current.stepState,
      [stepKey]: Boolean(value)
    },
    updatedAt: new Date().toISOString()
  };
  map[key] = next;
  writeProgressMap(map);
  return next;
}

export function setProgressNotes(domain, keyword, notes) {
  const key = normalizeScopeKey(domain, keyword);
  const map = readProgressMap();
  const current = getProgressState(domain, keyword);
  const next = {
    ...current,
    notes: String(notes || ""),
    updatedAt: new Date().toISOString()
  };
  map[key] = next;
  writeProgressMap(map);
  return next;
}

export function setProgressState(domain, keyword, partial) {
  const key = normalizeScopeKey(domain, keyword);
  const map = readProgressMap();
  const current = getProgressState(domain, keyword);
  const mergedStepState = {
    ...current.stepState,
    ...(partial?.stepState || {})
  };
  const next = {
    ...current,
    ...(partial || {}),
    stepState: mergedStepState,
    updatedAt: new Date().toISOString()
  };
  map[key] = next;
  writeProgressMap(map);
  return next;
}

export function getAlertPrefs() {
  return readAlertPrefs();
}

export function setAlertPrefs(partialOrFullPrefs) {
  const current = readAlertPrefs();
  const next = {
    ...current,
    ...(partialOrFullPrefs || {}),
    email: String(partialOrFullPrefs?.email ?? current.email ?? "").trim(),
    updatedAt: new Date().toISOString()
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ALERT_KEY, JSON.stringify(next));
  }
  return next;
}

function computeStdDev(values) {
  if (!values.length) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + ((v - mean) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function computeRankDerivedScore(latestRank, rankHistoryLast7 = []) {
  const rank = Number(latestRank);
  if (!Number.isFinite(rank) || rank <= 0) return null;
  const values = rankHistoryLast7
    .map((item) => Number(item?.rank ?? item))
    .filter((value) => Number.isFinite(value) && value > 0)
    .slice(-7);
  const stddev = computeStdDev(values);
  const base = clamp(100 - rank, 0, 100);
  const consistencyBonus = clamp(12 - stddev, 0, 12);
  return clamp(Math.round(base + consistencyBonus), 0, 100);
}

export function computeHybridSeoScore({ latestRank, rankHistory = [], auditScore } = {}) {
  const rankDerived = computeRankDerivedScore(latestRank, rankHistory);
  if (Number.isFinite(Number(auditScore))) {
    if (!Number.isFinite(rankDerived)) return clamp(Math.round(Number(auditScore)), 0, 100);
    return clamp(Math.round(Number(auditScore) * 0.6 + rankDerived * 0.4), 0, 100);
  }
  if (!Number.isFinite(rankDerived)) return null;
  return rankDerived;
}

export function computeMonthlyScoreSeries({ rankHistory = [], auditSnapshots = [], domain } = {}) {
  const cleanDomain = normalizeDomainForStore(domain);
  const monthlyChecks = rankHistory
    .filter((item) => {
      const ts = Date.parse(String(item?.createdAt || item?.checked_at || ""));
      if (!Number.isFinite(ts)) return false;
      if (!cleanDomain) return true;
      return normalizeDomainForStore(item?.domain) === cleanDomain;
    })
    .sort((a, b) => Date.parse(String(a?.createdAt || a?.checked_at || "")) - Date.parse(String(b?.createdAt || b?.checked_at || "")));

  const snapshotScore = (() => {
    const snap = (Array.isArray(auditSnapshots) ? auditSnapshots : []).find((entry) => {
      const url = String(entry?.url || "");
      return cleanDomain && url.includes(cleanDomain);
    });
    const score = Number(snap?.score ?? snap?.seo_score);
    return Number.isFinite(score) ? score : null;
  })();

  const points = monthlyChecks.map((item, idx) => {
    const ts = Date.parse(String(item?.createdAt || item?.checked_at || ""));
    const date = Number.isFinite(ts) ? new Date(ts) : null;
    const label = date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : `Check ${idx + 1}`;
    const rank = Number(item?.rank ?? item?.position);
    const value = computeHybridSeoScore({
      latestRank: rank,
      rankHistory: monthlyChecks.slice(Math.max(0, idx - 6), idx + 1),
      auditScore: snapshotScore
    });
    return { label, value: Number.isFinite(value) ? value : null };
  }).filter((item) => Number.isFinite(item.value));

  return points.slice(-12);
}

export function computeWinsStats({ stepState, checks30d = [] } = {}) {
  const state = {
    ...defaultProgressState().stepState,
    ...(stepState || {})
  };
  const completed = STEP_KEYS.filter((key) => Boolean(state[key])).length;
  const total = STEP_KEYS.length;
  const pending = total - completed;

  const daySet = new Set(
    checks30d
      .map((item) => {
        const ts = Date.parse(String(item?.createdAt || item?.checked_at || ""));
        if (!Number.isFinite(ts)) return "";
        return new Date(ts).toISOString().slice(0, 10);
      })
      .filter(Boolean)
  );

  let streak = 0;
  for (let i = 0; i < 60; i += 1) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (daySet.has(key)) {
      streak += 1;
    } else {
      break;
    }
  }

  return { completed, total, pending, streak };
}
