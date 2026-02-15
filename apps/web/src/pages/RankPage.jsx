import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { IconArrowRight, IconCompass, IconChart, IconReport } from "../components/Icons.jsx";
import ShareRankButton from "../components/ShareRankButton.jsx";
import DeferredRender from "../components/DeferredRender.jsx";
import {
  buildRankScopeKey,
  listRankChecks,
  listRankChecksByScope,
  normalizeDomainForStore,
  normalizeKeywordForStore,
  saveRankCheck
} from "../utils/rankHistory.js";
import {
  computeHybridSeoScore,
  computeMonthlyScoreSeries,
  computeWinsStats,
  getAlertPrefs,
  getProgressState,
  setAlertPrefs,
  setProgressState,
  setProgressStep
} from "../utils/rankProgress.js";
import { decodeSharePayload } from "../utils/shareRank.js";
import { listSnapshots } from "../utils/auditSnapshots.js";
import {
  SOURCE_HINTS,
  SOURCE_TAGS,
  buildRankProvenance,
  getModeledRecommendationIntro,
  getObservedFactsIntro,
  getKeywordOpportunitySourceCopy,
  getScenarioEstimateLabel,
  getSerpSnapshotSourceCopy
} from "../utils/rankProvenance.js";
import { getAuthToken, getAuthUser } from "../lib/authClient.js";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";
import ApexSparkline from "../components/charts/ApexSparkline.jsx";
import SafeApexChart from "../components/charts/SafeApexChart.jsx";

const PricingModal = lazy(() => import("../components/PricingModal.jsx"));
const RankHistoryPanel = lazy(() => import("../components/RankHistoryPanel.jsx"));

const EXAMPLE_KEYWORDS = [
  "seo audit tool",
  "technical seo audit",
  "rank tracker for agencies"
];

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "IN", label: "India" }
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" }
];

const SUCCESS_STEPS = [
  {
    key: "title",
    label: "Fix title intent match",
    why: "A clearer title improves relevance and click-through from search.",
    ctrLift: 6,
    visits: 14,
    actionLabel: "Generate improved title"
  },
  {
    key: "faq",
    label: "Add FAQ section",
    why: "FAQ content captures long-tail searches and supports rich snippets.",
    ctrLift: 12,
    visits: 18,
    actionLabel: "Create FAQ section"
  },
  {
    key: "headings",
    label: "Add missing headings",
    why: "Matching topic headings helps search engines trust your page coverage.",
    ctrLift: 8,
    visits: 16,
    actionLabel: "Add missing headings now"
  },
  {
    key: "backlinks",
    label: "Build contextual backlinks",
    why: "Relevant backlinks improve page authority in competitive SERPs.",
    ctrLift: 10,
    visits: 22,
    actionLabel: "Plan 3 backlinks"
  }
];

function isEmailLike(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function formatScopeLabel(domain, keyword) {
  const d = normalizeDomainForStore(domain);
  const k = keywordToTitleCase(keyword);
  if (d && k) return `${k} • ${d}`;
  if (d) return d;
  if (k) return k;
  return "Current keyword scope";
}

const TOPIC_LIBRARY = {
  "seo audit tool": [
    "Technical SEO checklist",
    "On-page issues and fixes",
    "Core Web Vitals overview",
    "Crawl and indexation basics"
  ],
  "technical seo audit": [
    "Crawl budget optimization",
    "Canonical and index rules",
    "Structured data validation",
    "Internal link architecture"
  ],
  "rank checker": [
    "Keyword grouping by intent",
    "Position tracking workflow",
    "Competitor movement analysis",
    "SERP feature opportunities"
  ]
};

function rankExplain(r) {
  if (!hasValidRank(r)) return "";
  const x = Number(r);
  if (x <= 10) return "First page (Top 10). Strong visibility.";
  if (x <= 20) return "Second page (11-20). Close to page one.";
  if (x <= 50) return "Pages 3-5 (21-50). Needs improvement.";
  return "Beyond 50. Big opportunity.";
}

function rankBadge(r) {
  if (!hasValidRank(r)) return null;
  const x = Number(r);
  if (x <= 3) return { label: "Top 3", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
  if (x <= 10) return { label: "Top 10", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
  if (x <= 20) return { label: "Page 2", cls: "bg-amber-100 text-amber-700 border border-amber-200" };
  if (x <= 50) return { label: "Page 3-5", cls: "bg-amber-50 text-amber-700 border border-amber-200" };
  return { label: "50+", cls: "bg-[var(--rp-gray-50)] text-[var(--rp-text-600)] border border-[var(--rp-border)]" };
}

function domainFromInput(s) {
  const raw = String(s || "").trim();
  if (!raw) return "";
  return normalizeDomainForStore(raw);
}

function normalizeDomainInput(value) {
  const parsed = domainFromInput(value);
  if (parsed) return parsed;
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();
}

function keywordToTitleCase(keyword) {
  const normalized = normalizeKeywordForStore(keyword);
  if (!normalized) return "";
  const acronymMap = { seo: "SEO", serp: "SERP", ai: "AI", ctr: "CTR", cwv: "CWV" };
  return normalized
    .split(" ")
    .map((token) => acronymMap[token] || `${token.charAt(0).toUpperCase()}${token.slice(1)}`)
    .join(" ");
}

function isLikelyDomain(value) {
  const clean = domainFromInput(value);
  if (!clean) return false;
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(clean);
}

function estimateCtr(rank) {
  const r = Number(rank);
  if (!Number.isFinite(r)) return 0;
  if (r <= 1) return 0.28;
  if (r <= 3) return 0.18;
  if (r <= 5) return 0.1;
  if (r <= 10) return 0.05;
  if (r <= 20) return 0.02;
  return 0.008;
}

function estimateMonthlyClicksGain(rank, targetRank = 10, monthlyVolume = 1200) {
  const r = Number(rank);
  if (!Number.isFinite(r)) return 0;
  const currentCtr = estimateCtr(r);
  const targetCtr = estimateCtr(targetRank);
  return Math.max(0, Math.round((targetCtr - currentCtr) * monthlyVolume));
}

function opportunityInsight(rank) {
  const r = Number(rank);
  if (!Number.isFinite(r) || r <= 0) return "Run a check to get a clear keyword opportunity recommendation.";
  if (r <= 3) return "You are already near the top. Protect this ranking with freshness updates and internal links.";
  if (r <= 10) return "This keyword is on page 1. Improving CTR (title/meta) can move it to higher positions.";
  if (r <= 20) return "This keyword is close to page 1. Improving content depth and topical relevance could push it higher.";
  if (r <= 40) return "This keyword has potential. Strengthen on-page content and backlinks to climb toward page 1.";
  return "This keyword is a long-term opportunity. Start with intent-matched content and stronger authority signals.";
}

function hasValidRank(rank) {
  const r = Number(rank);
  return Number.isFinite(r) && r > 0;
}

function latestKeywordIdeasForDomain(domain) {
  const d = domainFromInput(domain);
  if (!d) return [];
  const snaps = Array.isArray(listSnapshots()) ? listSnapshots() : [];
  const hit = snaps.find(s => {
    const u = String(s?.url || "");
    return u.includes(d);
  });
  const ideas = Array.isArray(hit?.keyword_ideas) ? hit.keyword_ideas : [];
  return ideas.map(x => String(x || "").trim()).filter(Boolean).slice(0, 8);
}

function clusterKeywords(baseKeyword) {
  const base = String(baseKeyword || "").trim().toLowerCase();
  if (!base) return [];
  const map = {
    "seo audit tool": [
      "website seo audit",
      "technical seo audit",
      "seo checker",
      "seo audit checklist",
      "on page seo audit"
    ],
    "technical seo audit": [
      "technical seo checklist",
      "site crawl audit",
      "indexability audit",
      "core web vitals audit",
      "schema audit"
    ],
    "rank checker": [
      "google rank checker",
      "keyword rank tracker",
      "serp position checker",
      "daily rank monitor",
      "mobile rank checker"
    ]
  };
  if (map[base]) return map[base];
  const tokens = base.split(/\s+/).filter(Boolean);
  const head = tokens.slice(0, 2).join(" ") || base;
  return [
    `${head} checker`,
    `${head} tool`,
    `${head} guide`,
    `${head} strategy`,
    `${head} template`
  ];
}

function whyRankHere(rank, difficulty) {
  const r = Number(rank);
  const d = Number(difficulty);
  if (!Number.isFinite(r) || r <= 0) return [];
  const backlinksGap = r > 30 ? "Top results appear to have around 4x-6x stronger backlink profiles." : "Top results still have stronger backlink depth.";
  const contentGap = r > 20 ? "Competing pages likely cover broader subtopics and longer intent-matched sections." : "Competing pages likely have tighter content depth and clarity.";
  const structureGap = d > 65 ? "Your page likely misses structured data and supporting internal links." : "Your page can gain from stronger structured data and internal linking.";
  return [backlinksGap, contentGap, structureGap];
}

function nextBestMove(rank) {
  const r = Number(rank);
  if (!Number.isFinite(r) || r <= 0) return { move: "Run one check to unlock your next best move.", gain: null };
  if (r <= 10) return { move: "Improve CTR with stronger title/meta copy and add 2-3 internal links from high-authority pages.", gain: 2 };
  if (r <= 20) return { move: "Expand the page with comparison sections and FAQ schema, then strengthen internal links.", gain: 4 };
  if (r <= 40) return { move: "Upgrade title intent match and add missing topic sections competitors cover.", gain: 6 };
  return { move: "Rework page intent, add complete topic coverage, and improve backlink quality.", gain: 8 };
}

function contentGapPreview(keyword, domain) {
  const base = String(keyword || "").trim().toLowerCase();
  const pool = TOPIC_LIBRARY[base] || [
    "Pricing comparison",
    "Implementation steps",
    "Before/after outcomes",
    "FAQ for objections"
  ];
  const competitors = [
    { domain: "ahrefs.com", headings: ["What is SEO audit", "How to run an audit", "Common audit mistakes"] },
    { domain: "semrush.com", headings: ["SEO audit workflow", "Priority fixes", "Technical SEO checks"] },
    { domain: "moz.com", headings: ["On-page checklist", "Crawl issues", "Indexation guidance"] }
  ].filter((item) => item.domain !== String(domain || "").toLowerCase());
  const missingKeywords = clusterKeywords(base).slice(0, 4);
  return {
    competitors: competitors.slice(0, 3),
    missingTopics: pool.slice(0, 4),
    missingKeywords
  };
}

function estimateFixImpactClicks(baseClicks, ratio) {
  const base = Number(baseClicks);
  if (!Number.isFinite(base) || base <= 0) return 0;
  return Math.max(4, Math.round(base * ratio));
}

function resolvePrimaryNextAction({ shownRank, missingTopicRows, nextIncompleteStep, auditTargetDomain, navigate, setKeyword, actionRef }) {
  if (!hasValidRank(shownRank)) {
    return {
      key: "run_check",
      label: "Run next optimization",
      reason: "Run a fresh check to unlock a ranked next action.",
      onClick: () => actionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    };
  }
  const topTopic = missingTopicRows?.[0]?.topic;
  const incompleteKey = nextIncompleteStep?.key;
  if (incompleteKey === "headings" && topTopic) {
    return {
      key: "headings",
      label: "Add missing headings now",
      reason: `Prioritize heading coverage: start with "${topTopic}".`,
      onClick: () => setKeyword(String(topTopic).toLowerCase())
    };
  }
  if (incompleteKey === "faq" && auditTargetDomain) {
    return {
      key: "faq",
      label: "Create FAQ section",
      reason: "FAQ is the fastest pending step to expand intent coverage.",
      onClick: () => navigate(`/audit?url=${encodeURIComponent(`https://${auditTargetDomain}`)}`)
    };
  }
  if (incompleteKey === "title" && auditTargetDomain) {
    return {
      key: "title",
      label: "Generate improved title",
      reason: "Title intent match is the highest-leverage pending on-page improvement.",
      onClick: () => navigate(`/audit?url=${encodeURIComponent(`https://${auditTargetDomain}`)}`)
    };
  }
  if (incompleteKey === "backlinks" && auditTargetDomain) {
    return {
      key: "backlinks",
      label: "Plan 3 backlinks",
      reason: "Authority reinforcement is the primary remaining ranking constraint.",
      onClick: () => navigate(`/audit?url=${encodeURIComponent(`https://${auditTargetDomain}`)}`)
    };
  }
  return {
    key: nextIncompleteStep?.key || "optimize",
    label: nextIncompleteStep?.actionLabel || "Run next optimization",
    reason: "Continue with the next pending optimization step.",
    onClick: () => actionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  };
}

function defaultSitelinks(keyword) {
  const title = keywordToTitleCase(keyword) || "SEO Audit Tool";
  return [
    `${title} checklist`,
    `${title} comparison`,
    `${title} pricing`,
    `${title} FAQ`
  ];
}

function normalizeSerpSnippetSource(entry) {
  const raw = String(
    entry?.snippetSource
    || entry?.snippet_source
    || entry?.snippetProvenance
    || entry?.snippet_provenance
    || entry?.source
    || ""
  ).trim().toLowerCase();
  if (raw) return raw.includes("live") ? "Live snippet" : "Estimated snippet";
  if (entry?.isLiveSnippet === true || entry?.is_live_snippet === true || entry?.liveSnippet === true) return "Live snippet";
  return String(entry?.description || "").trim() ? "Live snippet" : "Estimated snippet";
}

function inferKeywordIntent(keyword) {
  const text = normalizeKeywordForStore(keyword);
  if (!text) return "Informational";
  const transactionalTerms = ["buy", "price", "cost", "pricing", "cheap", "discount", "demo", "trial", "subscribe"];
  const commercialTerms = ["best", "top", "vs", "comparison", "compare", "tool", "software", "service", "agency", "review"];
  if (transactionalTerms.some((term) => text.includes(term))) return "Transactional";
  if (commercialTerms.some((term) => text.includes(term))) return "Commercial";
  return "Informational";
}

function estimateDifficulty(rank, keywordText = "") {
  const r = Number(rank);
  if (!Number.isFinite(r) || r <= 0) return null;
  const keywordComplexity = Math.min(20, String(keywordText || "").trim().split(/\s+/).filter(Boolean).length * 4);
  const rankPressure = Math.max(0, 100 - r);
  return Math.max(1, Math.min(100, Math.round(40 + keywordComplexity + rankPressure * 0.35)));
}

function estimateTrafficPotential(rank) {
  const r = Number(rank);
  if (!Number.isFinite(r) || r <= 0) return null;
  const ctr = estimateCtr(r);
  return Math.max(120, Math.round(ctr * 22000));
}

function estimateOpportunity(rank, difficulty) {
  const r = Number(rank);
  const d = Number(difficulty);
  if (!Number.isFinite(r) || r <= 0) return null;
  if (!Number.isFinite(d)) return Math.max(1, Math.min(100, Math.round((60 - Math.min(50, r)) + 30)));
  return Math.max(1, Math.min(100, Math.round((70 - Math.min(60, r)) + (100 - d) * 0.4)));
}

function ProvenanceBadge({ tag }) {
  const live = tag === SOURCE_TAGS.LIVE;
  const hybrid = tag === SOURCE_TAGS.HYBRID;
  return (
    <span
      title={SOURCE_HINTS[tag] || SOURCE_HINTS[SOURCE_TAGS.ESTIMATED]}
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        live
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : hybrid
            ? "border-[var(--rp-indigo-200)] bg-[var(--rp-indigo-50)] text-[var(--rp-indigo-800)]"
            : "border-amber-200 bg-amber-50 text-amber-700"
      ].join(" ")}
    >
      {tag || SOURCE_TAGS.ESTIMATED}
      <span className="ml-1 text-[10px]">i</span>
    </span>
  );
}

function TrendMarkers({ checks = [] }) {
  if (!checks.length) return { best: null, worst: null };
  const mapped = checks.map((item, index) => ({ index, label: item.label, rank: Number(item.rank) }))
    .filter((item) => Number.isFinite(item.rank));
  if (!mapped.length) return { best: null, worst: null };
  const best = mapped.reduce((acc, cur) => (cur.rank < acc.rank ? cur : acc), mapped[0]);
  const worst = mapped.reduce((acc, cur) => (cur.rank > acc.rank ? cur : acc), mapped[0]);
  return { best, worst };
}

function parseIsoMs(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : null;
}

function deriveTrendRangeConfidenceFromChecks(checks, nowMs = Date.now(), fallbackRank = null) {
  const sorted = (Array.isArray(checks) ? checks : [])
    .map((item) => ({
      rank: Number(item?.rank ?? item?.position ?? item?.position_current),
      checkedAtMs: parseIsoMs(item?.createdAt || item?.checked_at || item?.checkedAt)
    }))
    .filter((item) => Number.isFinite(item.rank) && Number.isFinite(item.checkedAtMs))
    .sort((a, b) => a.checkedAtMs - b.checkedAtMs);

  let ranks = sorted.map((item) => item.rank);
  if (!ranks.length && Number.isFinite(Number(fallbackRank))) {
    ranks = [Number(fallbackRank)];
  }

  const sampleCount = ranks.length;
  const min = sampleCount ? Math.min(...ranks) : null;
  const max = sampleCount ? Math.max(...ranks) : null;
  const first = sampleCount ? ranks[0] : null;
  const last = sampleCount ? ranks[sampleCount - 1] : null;
  const delta = Number.isFinite(first) && Number.isFinite(last) ? first - last : 0;
  const direction = delta >= 2 ? "up" : delta <= -2 ? "down" : "stable";
  const latestCheckMs = sorted.length ? sorted[sorted.length - 1].checkedAtMs : nowMs;
  const rangeWidth = Number.isFinite(min) && Number.isFinite(max) ? max - min : null;

  let score = 0;
  if (sampleCount >= 4) score += 2;
  else if (sampleCount >= 2) score += 1;
  if (Number.isFinite(rangeWidth) && rangeWidth <= 3) score += 1;
  if (nowMs - latestCheckMs <= 6 * 60 * 60 * 1000) score += 1;

  let confidence = "low";
  if (score >= 4) confidence = "high";
  else if (score >= 2) confidence = "medium";

  return {
    position_range_24h: {
      min: Number.isFinite(min) ? Math.round(min) : null,
      max: Number.isFinite(max) ? Math.round(max) : null,
      sample_count: sampleCount
    },
    trend_24h: {
      direction,
      delta: Math.round(delta),
      window_hours: 24
    },
    confidence
  };
}

function trendLabel(direction, delta) {
  if (direction === "up") return `↑ improving (${delta > 0 ? "+" : ""}${delta})`;
  if (direction === "down") return `↓ declining (${delta})`;
  return "→ stable";
}

export default function RankPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") || searchParams.get("keyword") || "").trim();
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  const [pricingOpen, setPricingOpen] = useState(false);

  const [keyword, setKeyword] = useState(q);
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("US");
  const [city, setCity] = useState("");
  const [device, setDevice] = useState("desktop");
  const [language, setLanguage] = useState("en");
  const [forceFresh, setForceFresh] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [inlineErrors, setInlineErrors] = useState({ keyword: "", domain: "" });
  const [progressState, setProgressStateUI] = useState(() => getProgressState("", ""));
  const [alertPrefs, setAlertPrefsUI] = useState(() => getAlertPrefs());
  const [alertMessage, setAlertMessage] = useState("");
  const [alertErrors, setAlertErrors] = useState({ email: "" });
  const authUser = getAuthUser();
  const [requestStatus, setRequestStatus] = useState("");
  const [allowRank, setAllowRank] = useState(true);
  const historyRef = useRef(null);
  const trendRef = useRef(null);
  const actionRef = useRef(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch(apiUrl("/api/account-settings"), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => safeJson(r))
      .then((data) => {
        if (data?.ok && data?.settings) setAllowRank(data.settings.allow_rank !== false);
      })
      .catch(() => {});
  }, []);

  const canRun = useMemo(() => {
    return keyword.trim().length > 0 && domain.trim().length > 0 && !inlineErrors.keyword && !inlineErrors.domain;
  }, [keyword, domain, inlineErrors]);

  useEffect(() => {
    const next = { keyword: "", domain: "" };
    if (keyword.trim() && keyword.trim().length < 2) next.keyword = "Use at least 2 characters.";
    if (domain.trim() && !isLikelyDomain(domain)) next.domain = "Use a real domain like example.com (no https).";
    setInlineErrors(next);
  }, [keyword, domain]);

  useEffect(() => {
    if (status !== "loading") {
      setLoadingStep(0);
      return;
    }
    const id = setInterval(() => {
      setLoadingStep((prev) => (prev >= 2 ? 2 : prev + 1));
    }, 850);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || "");
      const share = (params.get("share") || "").trim();
      const kw = (params.get("q") || params.get("keyword") || "").trim();
      const dm = (params.get("domain") || "").trim();
      const ctry = (params.get("country") || "").trim();
      const lang = (params.get("language") || "").trim();
      const dev = (params.get("device") || "").trim();
      const cityParam = (params.get("city") || "").trim();

      if (kw) setKeyword(kw);
      if (dm) setDomain(normalizeDomainInput(dm));
      if (ctry) setCountry(ctry.toUpperCase());
      if (lang) setLanguage(lang.toLowerCase());
      if (dev) setDevice(dev.toLowerCase() === "mobile" ? "mobile" : "desktop");
      if (cityParam) setCity(cityParam);

      if (share) {
        const payload = decodeSharePayload(share);
        if (payload && payload.kind === "rank") {
          const normalized = {
            keyword: payload.keyword || kw || "",
            domain: normalizeDomainInput(payload.domain || dm || ""),
            rank: payload.rank ?? null,
            checked_at: payload.checked_at || payload.created_at || null
          };
          setResult(normalized);
          setStatus("success");
        }
      }
    } catch {}
  }, [location.search]);

  async function checkRank() {
    setError("");
    setResult(null);
    const normalizedDomain = normalizeDomainInput(domain);

    if (!allowRank) {
      setStatus("error");
      setError("Rank Tracker disabled for your team.");
      return;
    }
    if (!keyword.trim() || !normalizedDomain) {
      setStatus("error");
      setError("Enter both a keyword and a valid root domain.");
      return;
    }
    if (inlineErrors.keyword || inlineErrors.domain) {
      setStatus("error");
      setError("Please fix the highlighted fields before running the check.");
      return;
    }

    setDomain(normalizedDomain);
    setStatus("loading");
    try {
      const requestScope = {
        keyword: keyword.trim(),
        domain: normalizedDomain,
        country,
        city: city.trim(),
        device,
        language
      };
      const scopeHash = buildRankScopeKey(requestScope);
      const res = await fetch(apiUrl("/api/rank-check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestScope,
          force_fresh: forceFresh,
          scope_hash: scopeHash
        })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await safeJson(res);
      if (!data || typeof data !== "object") {
        throw new Error("Unexpected response.");
      }
      const normalized = {
        ...data,
        keyword: String(data?.keyword ?? keyword ?? "").trim(),
        domain: normalizeDomainForStore(data?.domain || domain),
        rank: data?.position_current ?? data.rank ?? data.position,
        position_current: data?.position_current ?? data.rank ?? data.position,
        country: String(data?.country || country).toUpperCase(),
        city: String(data?.city || city || "").trim(),
        device: String(data?.device || device).toLowerCase() === "mobile" ? "mobile" : "desktop",
        language: String(data?.language || language).toLowerCase(),
        serp_preview: Array.isArray(data?.serp_preview) ? data.serp_preview : [],
        traffic_potential: Number(data?.traffic_potential),
        difficulty_score: Number(data?.difficulty_score),
        opportunity_score: Number(data?.opportunity_score),
        served_from_cache: Boolean(data?.served_from_cache),
        cache_expires_at: String(data?.cache_expires_at || ""),
        position_range_24h: data?.position_range_24h || null,
        trend_24h: data?.trend_24h || null,
        confidence: String(data?.confidence || "").toLowerCase()
      };
      if (!normalized.position_range_24h || !normalized.trend_24h || !normalized.confidence) {
        const fallbackChecks = listRankChecksByScope({
          keyword: normalized.keyword,
          domain: normalized.domain,
          country: normalized.country,
          city: normalized.city,
          device: normalized.device,
          language: normalized.language
        }).filter((item) => {
          const ts = parseIsoMs(item?.createdAt || item?.checked_at);
          return Number.isFinite(ts) && ts >= Date.now() - (24 * 60 * 60 * 1000);
        });
        const fallbackMetrics = deriveTrendRangeConfidenceFromChecks(fallbackChecks, Date.now(), normalized.position_current);
        normalized.position_range_24h = normalized.position_range_24h || fallbackMetrics.position_range_24h;
        normalized.trend_24h = normalized.trend_24h || fallbackMetrics.trend_24h;
        normalized.confidence = normalized.confidence || fallbackMetrics.confidence;
      }
      setResult(normalized);
      try { saveRankCheck(normalized); } catch {}
      setLastCheckedAt(normalized?.checked_at || new Date().toISOString());
      if (forceFresh) setForceFresh(false);
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(String(e?.message || "Request failed."));
    }
  }

  const shownRank = result?.position_current ?? result?.rank ?? result?.position ?? null;
  const badge = rankBadge(shownRank);

  const ideas = useMemo(() => {
    if (keyword.trim()) return [];
    return latestKeywordIdeasForDomain(domain);
  }, [domain, keyword]);

  const safeKeyword = String(result?.keyword || keyword || "");
  const safeDomain = normalizeDomainForStore(result?.domain || domainFromInput(domain) || "");
  const auditTargetDomain = safeDomain || domainFromInput(domain);
  const displayKeyword = keywordToTitleCase(safeKeyword);
  const allChecks = useMemo(() => listRankChecks(), [result, lastCheckedAt, status]);
  const scopeDomain = safeDomain || domainFromInput(domain);
  const scopeKeyword = safeKeyword || keyword;

  useEffect(() => {
    setProgressStateUI(getProgressState(scopeDomain, scopeKeyword));
  }, [scopeDomain, scopeKeyword]);

  const history = useMemo(() => {
    const all = allChecks;
    if (!safeKeyword && !safeDomain) return all.slice(0, 12);
    return all.filter((x) => {
      const kwMatch = safeKeyword ? String(x.keyword || "").toLowerCase() === safeKeyword.toLowerCase() : true;
      const dmMatch = safeDomain ? String(x.domain || "").toLowerCase().includes(safeDomain.toLowerCase()) : true;
      return kwMatch && dmMatch;
    }).slice(0, 12);
  }, [safeKeyword, safeDomain, allChecks]);

  const checks30d = useMemo(() => {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return allChecks.filter((item) => {
      const ts = Date.parse(String(item?.createdAt || item?.checked_at || ""));
      if (!Number.isFinite(ts) || ts < cutoff) return false;
      if (!scopeDomain) return true;
      return normalizeDomainForStore(item?.domain) === normalizeDomainForStore(scopeDomain);
    });
  }, [allChecks, scopeDomain]);

  const checksThisMonth = useMemo(() => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    return checks30d.filter((item) => {
      const ts = Date.parse(String(item?.createdAt || item?.checked_at || ""));
      if (!Number.isFinite(ts)) return false;
      const d = new Date(ts);
      return d.getUTCFullYear() === year && d.getUTCMonth() === month;
    });
  }, [checks30d]);

  const last7Checks = useMemo(() => {
    return history
      .slice(0, 7)
      .reverse()
      .map((item, idx) => ({
        label: item?.checked_at || item?.createdAt
          ? new Date(item?.checked_at || item?.createdAt).toLocaleDateString()
          : `Check ${idx + 1}`,
        rank: Number(item?.rank)
      }))
      .filter((item) => Number.isFinite(item.rank));
  }, [history]);

  const previousRank = useMemo(() => {
    if (!history.length || !hasValidRank(shownRank)) return null;
    const previous = history
      .map((x) => Number(x.rank))
      .filter((x) => Number.isFinite(x))
      .find((x) => x !== Number(shownRank));
    return Number.isFinite(previous) ? previous : null;
  }, [history, shownRank]);

  const rankDelta = useMemo(() => {
    if (!hasValidRank(shownRank) || !hasValidRank(previousRank)) return null;
    return Number(previousRank) - Number(shownRank);
  }, [shownRank, previousRank]);
  const trend24h = useMemo(() => {
    const direction = String(result?.trend_24h?.direction || "").toLowerCase();
    const delta = Number(result?.trend_24h?.delta);
    if (["up", "down", "stable"].includes(direction) && Number.isFinite(delta)) {
      return { direction, delta };
    }
    const fallbackChecks = listRankChecksByScope({
      keyword: safeKeyword || keyword,
      domain: safeDomain || domainFromInput(domain),
      country,
      city,
      device,
      language
    }).filter((item) => {
      const ts = parseIsoMs(item?.createdAt || item?.checked_at);
      return Number.isFinite(ts) && ts >= Date.now() - (24 * 60 * 60 * 1000);
    });
    return deriveTrendRangeConfidenceFromChecks(fallbackChecks, Date.now(), shownRank).trend_24h;
  }, [result?.trend_24h, safeKeyword, keyword, safeDomain, domain, country, city, device, language, shownRank]);
  const range24h = useMemo(() => {
    const min = Number(result?.position_range_24h?.min);
    const max = Number(result?.position_range_24h?.max);
    const sampleCount = Number(result?.position_range_24h?.sample_count);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return {
        min: Math.round(min),
        max: Math.round(max),
        sample_count: Number.isFinite(sampleCount) ? sampleCount : null
      };
    }
    const fallbackChecks = listRankChecksByScope({
      keyword: safeKeyword || keyword,
      domain: safeDomain || domainFromInput(domain),
      country,
      city,
      device,
      language
    }).filter((item) => {
      const ts = parseIsoMs(item?.createdAt || item?.checked_at);
      return Number.isFinite(ts) && ts >= Date.now() - (24 * 60 * 60 * 1000);
    });
    return deriveTrendRangeConfidenceFromChecks(fallbackChecks, Date.now(), shownRank).position_range_24h;
  }, [result?.position_range_24h, safeKeyword, keyword, safeDomain, domain, country, city, device, language, shownRank]);
  const confidenceLabel = useMemo(() => {
    const confidence = String(result?.confidence || "").toLowerCase();
    if (confidence === "high" || confidence === "medium" || confidence === "low") return confidence;
    const fallbackChecks = listRankChecksByScope({
      keyword: safeKeyword || keyword,
      domain: safeDomain || domainFromInput(domain),
      country,
      city,
      device,
      language
    }).filter((item) => {
      const ts = parseIsoMs(item?.createdAt || item?.checked_at);
      return Number.isFinite(ts) && ts >= Date.now() - (24 * 60 * 60 * 1000);
    });
    return deriveTrendRangeConfidenceFromChecks(fallbackChecks, Date.now(), shownRank).confidence;
  }, [result?.confidence, safeKeyword, keyword, safeDomain, domain, country, city, device, language, shownRank]);
  const freshnessCopy = result?.served_from_cache
    ? "Reused check from within 24h window."
    : "Fresh check completed.";

  const topCompetitors = useMemo(() => {
    const candidates = Array.isArray(result?.top_competitors) ? result.top_competitors : [];
    if (candidates.length) {
      return candidates
        .map((entry, idx) => ({
          domain: String(entry?.domain || "").trim(),
          position: Number(entry?.position ?? idx + 1)
        }))
        .filter((entry) => entry.domain)
        .slice(0, 3);
    }
    return [];
  }, [result?.top_competitors]);
  const inferredCompetitor = useMemo(() => {
    if (hasValidRank(shownRank) && Number(shownRank) <= 1) return "You are currently leading";
    if (topCompetitors[0]?.domain) return topCompetitors[0].domain;
    const known = String(result?.top_competitor || result?.competitor || "").trim();
    if (known) return known;
    return "Not available yet";
  }, [shownRank, topCompetitors, result?.top_competitor, result?.competitor]);

  const difficultyScore = useMemo(() => {
    const apiValue = Number(result?.difficulty_score);
    if (Number.isFinite(apiValue) && apiValue > 0) return Math.max(1, Math.min(100, Math.round(apiValue)));
    return estimateDifficulty(shownRank, safeKeyword);
  }, [result?.difficulty_score, shownRank, safeKeyword]);

  const trafficPotential = useMemo(() => {
    const apiValue = Number(result?.traffic_potential);
    if (Number.isFinite(apiValue) && apiValue > 0) return Math.round(apiValue);
    return estimateTrafficPotential(shownRank);
  }, [result?.traffic_potential, shownRank]);

  const opportunityScore = useMemo(() => {
    const apiValue = Number(result?.opportunity_score);
    if (Number.isFinite(apiValue) && apiValue > 0) return Math.max(1, Math.min(100, Math.round(apiValue)));
    return estimateOpportunity(shownRank, difficultyScore);
  }, [result?.opportunity_score, shownRank, difficultyScore]);
  const liveRankReasons = useMemo(() => {
    if (!Array.isArray(result?.rank_reasons)) return [];
    return result.rank_reasons.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 4);
  }, [result?.rank_reasons]);
  const rawSerpPreview = useMemo(() => (
    Array.isArray(result?.serp_preview) ? result.serp_preview : []
  ), [result?.serp_preview]);

  const serpProvenanceRows = useMemo(() => {
    return rawSerpPreview.slice(0, 5).map((entry, idx) => ({
      position: Number(entry?.position ?? idx + 1),
      title: String(entry?.title || "").trim(),
      domain: String(entry?.domain || entry?.url || "").trim(),
      url: String(entry?.url || "").trim(),
      type: String(entry?.type || "").trim(),
      description: String(entry?.description || "").trim(),
      snippetSource: normalizeSerpSnippetSource(entry)
    }));
  }, [rawSerpPreview]);

  const serpPreview = useMemo(() => {
    if (rawSerpPreview.length) {
      return rawSerpPreview.slice(0, 5).map((entry, idx) => ({
        position: Number(entry?.position ?? idx + 1),
        title: String(entry?.title || "").trim() || "Untitled result",
        domain: domainFromInput(entry?.url || entry?.domain || "") || "unknown-domain",
        type: String(entry?.type || "Organic"),
        description: String(entry?.description || "").trim() || `Result for ${keywordToTitleCase(safeKeyword) || "this keyword"} with intent-matched on-page content.`,
        snippetSource: normalizeSerpSnippetSource(entry),
        sitelinks: Array.isArray(entry?.sitelinks) && entry.sitelinks.length
          ? entry.sitelinks.slice(0, 4).map((x) => String(x || "").trim()).filter(Boolean)
          : []
      }));
    }
    return topCompetitors.map((entry, idx) => ({
      position: Number(entry.position ?? idx + 1),
      title:
        idx === 0
          ? `Top result for "${keywordToTitleCase(safeKeyword) || "keyword"}"`
          : `${keywordToTitleCase(safeKeyword) || "Keyword"} ${idx === 1 ? "guide" : idx === 2 ? "checklist" : "examples"}`,
      domain: entry.domain,
      type: idx === 0 ? "Comparison" : "Organic",
      description: idx === 0
        ? `Modeled SERP preview: this result likely wins with strong comparison sections and richer buyer-intent coverage.`
        : `Modeled SERP preview: this page likely includes stronger topic depth and clearer execution steps.`,
      snippetSource: "Estimated snippet",
      sitelinks: idx === 0
        ? ["Checklist", "Tools comparison", "Pricing", "FAQ"]
        : defaultSitelinks(safeKeyword).slice(0, 4)
    }));
  }, [rawSerpPreview, topCompetitors, safeKeyword]);

  const relatedKeywordCluster = useMemo(() => {
    const fromTracked = clusterKeywords(safeKeyword);
    const fromIdeas = ideas.slice(0, 5);
    return [...new Set([...fromTracked, ...fromIdeas])].filter(Boolean).slice(0, 8);
  }, [safeKeyword, ideas]);
  const detailedRankReasons = useMemo(() => {
    if (!hasValidRank(shownRank)) return [];
    if (liveRankReasons.length) {
      return liveRankReasons.map((text) => ({
        source: "Live signal",
        metric: `Position ${shownRank}`,
        interpretation: text,
        action: "Prioritize the next best action below and rerun rank check after publish."
      }));
    }
    const firstCompetitor = topCompetitors[0]?.domain || serpPreview[0]?.domain || "top competitors";
    const seed = String(firstCompetitor).split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const compWords = 1900 + (seed % 700);
    const ownWords = Math.max(500, Math.round(compWords * 0.55));
    const compBacklinks = 600 + (seed % 900);
    const ownBacklinks = Math.max(30, Math.round(compBacklinks * 0.24));
    return [
      {
        source: "Pattern-based estimate",
        metric: `Words ${ownWords} vs top ~${compWords}`,
        interpretation: `${firstCompetitor} and similar results likely include deeper comparison coverage than your current page.`,
        action: "Add 900-1200 words across workflow, FAQ, and comparison sections."
      },
      {
        source: "Pattern-based estimate",
        metric: `Referring links ${ownBacklinks} vs top ~${compBacklinks}`,
        interpretation: "Authority gap likely limits ranking stability even when relevance is close.",
        action: "Build 3-5 contextual links from relevant pages to this URL."
      }
    ];
  }, [shownRank, liveRankReasons, topCompetitors, serpPreview]);
  const bestMove = useMemo(() => nextBestMove(shownRank), [shownRank]);
  const keywordIntent = useMemo(() => inferKeywordIntent(safeKeyword), [safeKeyword]);
  const rankingUrl = useMemo(() => {
    const fromApi = String(result?.ranking_url || result?.rankingUrl || result?.url || "").trim();
    if (fromApi) return fromApi;
    const cleanDomain = safeDomain || domainFromInput(domain);
    if (!cleanDomain) return "";
    const slug = normalizeKeywordForStore(safeKeyword).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `https://${cleanDomain}/${slug || ""}`.replace(/\/$/, "");
  }, [result?.ranking_url, result?.rankingUrl, result?.url, safeDomain, domain, safeKeyword]);
  const trendMarkers = useMemo(() => TrendMarkers({ checks: last7Checks }), [last7Checks]);
  const gap = useMemo(() => contentGapPreview(safeKeyword, safeDomain), [safeKeyword, safeDomain]);

  const trendMovement = useMemo(() => {
    if (last7Checks.length < 2) return null;
    const start = Number(last7Checks[0]?.rank);
    const end = Number(last7Checks[last7Checks.length - 1]?.rank);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    const delta = start - end;
    return {
      delta,
      direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
      text:
        delta > 0
          ? `Improved by ${delta} positions over last 7 checks`
          : delta < 0
            ? `Dropped by ${Math.abs(delta)} positions over last 7 checks`
          : "No movement across the last 7 checks"
    };
  }, [last7Checks]);
  const trendSparkValues = useMemo(() => {
    return last7Checks
      .map((item) => Number(item?.rank))
      .filter((value) => Number.isFinite(value));
  }, [last7Checks]);
  const trendStory = useMemo(() => {
    if (!last7Checks.length) return [];
    const ranks = last7Checks.map((x) => Number(x.rank)).filter((x) => Number.isFinite(x));
    if (!ranks.length) return [];
    const start = ranks[0];
    const end = ranks[ranks.length - 1];
    const delta = start - end;
    const mean = ranks.reduce((sum, val) => sum + val, 0) / ranks.length;
    const variance = ranks.reduce((sum, val) => sum + ((val - mean) ** 2), 0) / ranks.length;
    const std = Math.sqrt(variance);
    const mid = Math.floor(ranks.length / 2);
    const earlyDrop = mid > 0 ? (ranks[0] - ranks[mid]) : 0;
    const lateDrop = ranks.length - 1 > mid ? (ranks[mid] - ranks[ranks.length - 1]) : 0;
    return [
      {
        source: "Pattern-based estimate",
        metric: `Delta ${delta > 0 ? "+" : ""}${delta} over ${ranks.length} checks`,
        interpretation: delta > 0
          ? "Recent checks trend upward."
          : delta < 0
            ? "Recent checks trend downward."
            : "Recent checks are flat.",
        action: "Keep shipping one fix at a time and rerun rank checks after each update."
      },
      {
        source: "Pattern-based estimate",
        metric: `Recent segment ${lateDrop > 0 ? "+" : ""}${lateDrop}, earlier segment ${earlyDrop > 0 ? "+" : ""}${earlyDrop}`,
        interpretation: lateDrop >= earlyDrop
          ? "Most movement happened in the latest checks."
          : "Most movement happened earlier and has slowed.",
        action: "Repeat the last successful on-page changes on similar pages."
      },
      {
        source: "Pattern-based estimate",
        metric: `Volatility score ${std.toFixed(1)}`,
        interpretation: std >= 6
          ? "Rank volatility is elevated."
          : "Rank volatility is relatively stable.",
        action: "If volatility stays high, prioritize intent match and internal linking consistency."
      }
    ].filter((item) => /\d/.test(String(item.metric || "")));
  }, [last7Checks]);

  const competitorBench = useMemo(() => {
    const domains = (topCompetitors.length ? topCompetitors : serpPreview.slice(0, 3)).map((entry) => entry.domain);
    const buildSignals = (domainName, rankBoost = 0) => {
      const seed = String(domainName || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      return {
        domain: domainName || "unknown-domain",
        words: 1700 + (seed % 900) + rankBoost,
        backlinks: 220 + (seed % 1800),
        dr: 42 + (seed % 40),
        schema: seed % 2 === 0
      };
    };
    const competitors = domains.map((d, idx) => buildSignals(d, (3 - idx) * 90));
    const avgWords = competitors.length ? Math.round(competitors.reduce((s, x) => s + x.words, 0) / competitors.length) : null;
    const avgBacklinks = competitors.length ? Math.round(competitors.reduce((s, x) => s + x.backlinks, 0) / competitors.length) : null;
    const avgDr = competitors.length ? Math.round(competitors.reduce((s, x) => s + x.dr, 0) / competitors.length) : null;
    const own = {
      domain: safeDomain || "your-domain.com",
      words: Math.max(500, Math.round((avgWords || 1900) * 0.55)),
      backlinks: Math.max(30, Math.round((avgBacklinks || 700) * 0.22)),
      dr: Math.max(12, Math.round((avgDr || 65) * 0.55)),
      schema: false
    };
    return { competitors, avgWords, avgBacklinks, avgDr, own };
  }, [topCompetitors, serpPreview, safeDomain]);

  const estimatedClicksGain = useMemo(() => {
    return estimateMonthlyClicksGain(shownRank, 10, 1200);
  }, [shownRank]);

  const bestRank = useMemo(() => {
    const ranks = history.map((x) => Number(x.rank)).filter((x) => Number.isFinite(x));
    if (!ranks.length) return null;
    return Math.min(...ranks);
  }, [history]);

  const latestRankValue = hasValidRank(shownRank)
    ? Number(shownRank)
    : Number(history[0]?.rank);

  const firstRank30d = useMemo(() => {
    const ranked = checks30d
      .map((item) => Number(item?.rank))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (!ranked.length) return null;
    return ranked[0];
  }, [checks30d]);

  const rankImprovement30d = useMemo(() => {
    if (!Number.isFinite(firstRank30d) || !Number.isFinite(latestRankValue)) return null;
    return firstRank30d - latestRankValue;
  }, [firstRank30d, latestRankValue]);

  const activeSnapshotScore = useMemo(() => {
    const clean = normalizeDomainForStore(scopeDomain);
    if (!clean) return null;
    const snapshots = listSnapshots();
    const hit = snapshots.find((item) => String(item?.url || "").includes(clean));
    const score = Number(hit?.score ?? hit?.seo_score);
    return Number.isFinite(score) ? score : null;
  }, [scopeDomain]);

  const monthlySeoScoreSeries = useMemo(() => {
    return computeMonthlyScoreSeries({
      rankHistory: checksThisMonth,
      auditSnapshots: listSnapshots(),
      domain: scopeDomain
    });
  }, [checksThisMonth, scopeDomain]);
  const monthlySeoSparkValues = useMemo(() => {
    return (Array.isArray(monthlySeoScoreSeries) ? monthlySeoScoreSeries : [])
      .map((point) => Number(point?.value))
      .filter((value) => Number.isFinite(value));
  }, [monthlySeoScoreSeries]);

  const seoScoreHybrid = useMemo(() => {
    return computeHybridSeoScore({
      latestRank: latestRankValue,
      rankHistory: history.slice(0, 7),
      auditScore: activeSnapshotScore
    });
  }, [latestRankValue, history, activeSnapshotScore]);

  const scoreSourceLabel = useMemo(() => {
    return buildRankProvenance({
      activeSnapshotScore,
      latestRankValue
    }).seoProgressDashboard;
  }, [activeSnapshotScore, latestRankValue]);

  const provenanceByCard = useMemo(() => {
    return buildRankProvenance({
      activeSnapshotScore,
      latestRankValue,
      rankDelta,
      previousRank,
      topCompetitors,
      serpPreviewRaw: serpProvenanceRows,
      difficultyScore: result?.difficulty_score,
      trafficPotential: result?.traffic_potential,
      opportunityScore: result?.opportunity_score,
      liveRankReasonsCount: liveRankReasons.length,
      trendChecksCount: last7Checks.length
    });
  }, [
    activeSnapshotScore,
    latestRankValue,
    rankDelta,
    previousRank,
    topCompetitors,
    serpProvenanceRows,
    result?.difficulty_score,
    result?.traffic_potential,
    result?.opportunity_score,
    liveRankReasons.length,
    last7Checks.length
  ]);

  const winsStats = useMemo(() => {
    return computeWinsStats({ stepState: progressState?.stepState, checks30d });
  }, [progressState?.stepState, checks30d]);

  const completedVisitsGain = useMemo(() => {
    return SUCCESS_STEPS.reduce((sum, step) => (
      progressState?.stepState?.[step.key] ? sum + step.visits : sum
    ), 0);
  }, [progressState]);

  const completedCtrGain = useMemo(() => {
    return SUCCESS_STEPS.reduce((sum, step) => (
      progressState?.stepState?.[step.key] ? sum + step.ctrLift : sum
    ), 0);
  }, [progressState]);

  const nextIncompleteStep = useMemo(() => {
    return SUCCESS_STEPS.find((step) => !progressState?.stepState?.[step.key]) || null;
  }, [progressState]);

  const winsThisMonth = useMemo(() => {
    const fromSteps = winsStats.completed;
    const fromChecks = Math.min(2, checksThisMonth.length);
    return Math.max(0, fromSteps + fromChecks - 1);
  }, [winsStats.completed, checksThisMonth.length]);

  const contentGapDiffRows = useMemo(() => {
    const headings = gap.competitors.flatMap((c) => c.headings).slice(0, 6);
    return headings.map((heading) => {
      const coverageCount = gap.competitors.filter((c) => c.headings.includes(heading)).length;
      return { heading, coverageCount };
    });
  }, [gap]);

  const missingTopicRows = useMemo(() => {
    return gap.missingTopics.slice(0, 6).map((topic, index) => {
      let confidence = "Low";
      let score = 1;
      if (index === 0 || index === 1) {
        confidence = "High";
        score = 3;
      } else if (index === 2 || index === 3) {
        confidence = "Medium";
        score = 2;
      }
      return { topic, confidence, score };
    }).sort((a, b) => b.score - a.score);
  }, [gap.missingTopics]);

  const primaryNextAction = useMemo(() => {
    return resolvePrimaryNextAction({
      shownRank,
      missingTopicRows,
      nextIncompleteStep,
      auditTargetDomain,
      navigate,
      setKeyword,
      actionRef
    });
  }, [shownRank, missingTopicRows, nextIncompleteStep, auditTargetDomain, navigate, setKeyword, actionRef]);

  const rankMovementExplanation = useMemo(() => {
    if (!hasValidRank(shownRank)) return [];
    const lines = [];
    if (rankDelta !== null) {
      lines.push({
        source: "Live signal",
        metric: `Position change ${rankDelta > 0 ? "+" : ""}${rankDelta}`,
        interpretation:
          rankDelta > 0
            ? "Your page moved up since last check."
            : rankDelta < 0
              ? "Your page moved down since last check."
              : "Position stayed flat since last check.",
        action: "Re-run after each meaningful content update to confirm movement."
      });
    }
    if (competitorBench.avgWords && competitorBench.own.words) {
      const wordGap = competitorBench.avgWords - competitorBench.own.words;
      if (wordGap > 200) {
        lines.push({
          source: "Pattern-based estimate",
          metric: `Words gap ${wordGap}`,
          interpretation: `Top pages average ~${competitorBench.avgWords} words while your page appears near ~${competitorBench.own.words}.`,
          action: "Expand depth in missing sections before next rank check."
        });
      }
    }
    if (competitorBench.avgBacklinks && competitorBench.own.backlinks) {
      const linkGap = competitorBench.avgBacklinks - competitorBench.own.backlinks;
      if (linkGap > 80) {
        lines.push({
          source: "Pattern-based estimate",
          metric: `Backlink gap ${linkGap}+`,
          interpretation: "Competitors likely hold stronger referring-link signals for this query.",
          action: "Plan contextual backlinks from high-relevance pages."
        });
      }
    }
    if (trendMovement?.direction === "up") {
      lines.push({
        source: "Pattern-based estimate",
        metric: `Trend ${trendMovement.delta > 0 ? "+" : ""}${trendMovement.delta}`,
        interpretation: "Recent page updates likely aligned better with intent.",
        action: "Repeat recent update pattern across similar pages."
      });
    }
    if (trendMovement?.direction === "down") {
      lines.push({
        source: "Pattern-based estimate",
        metric: `Trend ${trendMovement.delta}`,
        interpretation: "Volatility suggests competitor refreshes or topical coverage gap.",
        action: "Refresh title, headings, and FAQ coverage, then re-check."
      });
    }
    return lines.filter((x) => /\d/.test(String(x.metric || ""))).slice(0, 4);
  }, [shownRank, rankDelta, competitorBench, trendMovement]);

  const rankMovementFacts = useMemo(() => (
    rankMovementExplanation.filter((line) => String(line.source || "").toLowerCase().includes("live"))
  ), [rankMovementExplanation]);

  const rankMovementRecommendations = useMemo(() => (
    rankMovementExplanation.filter((line) => !String(line.source || "").toLowerCase().includes("live"))
  ), [rankMovementExplanation]);

  const keywordLiveEvidence = useMemo(() => (
    detailedRankReasons.filter((line) => String(line.source || "").toLowerCase().includes("live"))
  ), [detailedRankReasons]);

  const keywordModeledRecommendations = useMemo(() => (
    detailedRankReasons.filter((line) => !String(line.source || "").toLowerCase().includes("live"))
  ), [detailedRankReasons]);

  const trendObservedFacts = useMemo(() => {
    if (!last7Checks.length) return [];
    return [
      {
        label: "Checks analyzed",
        value: String(last7Checks.length)
      },
      {
        label: "Observed movement",
        value: trendMovement?.text || "No clear movement observed yet."
      }
    ];
  }, [last7Checks.length, trendMovement]);

  const keywordObservedFacts = useMemo(() => {
    const facts = [];
    if (hasValidRank(shownRank)) facts.push({ label: "Current position", value: String(shownRank) });
    if (Number.isFinite(Number(result?.difficulty_score)) && Number(result?.difficulty_score) > 0) {
      facts.push({ label: "Live difficulty", value: `${Math.round(Number(result?.difficulty_score))}/100` });
    }
    if (Number.isFinite(Number(result?.opportunity_score)) && Number(result?.opportunity_score) > 0) {
      facts.push({ label: "Live opportunity", value: `${Math.round(Number(result?.opportunity_score))}/100` });
    }
    if (Number.isFinite(Number(result?.traffic_potential)) && Number(result?.traffic_potential) > 0) {
      facts.push({ label: "Live traffic potential", value: `~${Math.round(Number(result?.traffic_potential))}/mo` });
    }
    return facts;
  }, [shownRank, result?.difficulty_score, result?.opportunity_score, result?.traffic_potential]);

  useEffect(() => {
    if (status !== "success" || !scopeDomain || !scopeKeyword) return;
    const existing = getProgressState(scopeDomain, scopeKeyword);
    const hasManual = Object.values(existing.stepState || {}).some(Boolean);
    if (hasManual) return;

    const next = {
      stepState: {
        title: Boolean(rankDelta && rankDelta > 0 && ["Commercial", "Transactional", "Informational"].includes(keywordIntent)),
        faq: false,
        headings: contentGapDiffRows.filter((row) => Number(row.coverageCount) < 2).length <= 1,
        backlinks: false
      }
    };
    const saved = setProgressState(scopeDomain, scopeKeyword, next);
    setProgressStateUI(saved);
  }, [status, scopeDomain, scopeKeyword, rankDelta, keywordIntent, contentGapDiffRows]);

  function handleProgressToggle(stepKey, value) {
    const saved = setProgressStep(scopeDomain, scopeKeyword, stepKey, value);
    setProgressStateUI(saved);
  }

  function handleAlertToggle(key, value) {
    const saved = setAlertPrefs({ ...alertPrefs, [key]: Boolean(value) });
    setAlertPrefsUI(saved);
    setAlertMessage("Alert preferences saved.");
    setTimeout(() => setAlertMessage(""), 1800);
  }

  function saveAlertEmail() {
    const clean = String(alertPrefs.email || "").trim();
    if (!clean || !isEmailLike(clean)) {
      setAlertErrors({ email: "Enter a valid email address." });
      return;
    }
    const saved = setAlertPrefs({ ...alertPrefs, email: clean });
    setAlertPrefsUI(saved);
    setAlertErrors({ email: "" });
    setAlertMessage("Weekly alert email saved.");
    setTimeout(() => setAlertMessage(""), 2200);
  }

  function queueKeywordFromActionPlan(nextKeyword) {
    const normalized = normalizeKeywordForStore(nextKeyword);
    if (!normalized) return;
    setKeyword(normalized);
    // Queueing creates the next run scope; reset current result view to avoid stale mixed-state UI.
    setResult(null);
    setError("");
    setLastCheckedAt("");
    setStatus("idle");
    actionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const actionableRecipe = useMemo(() => {
    if (!hasValidRank(shownRank)) return [];
    const ownWords = competitorBench.own.words || 900;
    const targetWords = Math.max(1200, (competitorBench.avgWords || ownWords + 900) - ownWords);
    const backlinksGap = Math.max(2, Math.ceil(((competitorBench.avgBacklinks || 600) - (competitorBench.own.backlinks || 80)) / 200));
    const internalPath = `/${normalizeKeywordForStore(safeKeyword).replace(/\s+/g, "-") || "seo-audit"}`;
    return [
      {
        title: "Add depth and intent coverage",
        steps: [
          `Add ${targetWords} more words focused on workflow + examples.`,
          "Add one FAQ section with 4-6 direct question/answer pairs.",
          "Add comparison table blocks for tools and outcomes.",
          `Add one internal link from ${internalPath} to this ranking page.`
        ],
        ctrLift: 12,
        visits: estimateFixImpactClicks(estimatedClicksGain, 0.42),
        actionLabel: "Create optimized outline"
      },
      {
        title: "Close authority gap",
        steps: [
          `Get ${backlinksGap} contextual backlinks from relevant pages.`,
          "Refresh title/H1 to exactly match search intent.",
          "Add FAQ schema and internal anchor links."
        ],
        ctrLift: 8,
        visits: estimateFixImpactClicks(estimatedClicksGain, 0.3),
        actionLabel: "Generate improved title"
      },
      {
        title: "Ship quick technical wins",
        steps: [
          "Add missing subheadings competitors already use.",
          "Improve snippet clarity in meta title/description.",
          "Re-check rank after publish and iterate."
        ],
        ctrLift: 5,
        visits: estimateFixImpactClicks(estimatedClicksGain, 0.2),
        actionLabel: "Add missing headings now"
      }
    ];
  }, [shownRank, competitorBench, safeKeyword, estimatedClicksGain]);

  const kpis = useMemo(() => ([
    {
      label: "Tracked keywords",
      value: String(
        new Set(listRankChecks().map((x) => String(x.keyword || "").trim()).filter(Boolean)).size || 0
      ),
      tone: "text-[#0f172a]",
      hint: "Open history",
      why: "Why this matters: more tracked keywords = more SEO opportunities discovered.",
      onClick: () => historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    {
      label: "Avg. position",
      value: history.length
        ? (history.reduce((sum, row) => sum + Number(row.rank || 0), 0) / history.length).toFixed(1)
        : "—",
      tone: "text-[#f97316]",
      hint: "View trend",
      why: "Why this matters: lower average position means stronger organic visibility.",
      onClick: () => trendRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    {
      label: "Visibility lift",
      value: rankDelta === null ? "—" : `${rankDelta > 0 ? "+" : ""}${rankDelta}`,
      tone: rankDelta !== null && rankDelta > 0 ? "text-emerald-600" : "text-[#0f172a]",
      hint: "See next action",
      why: "Why this matters: positive lift shows recent changes are working.",
      onClick: () => actionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  ]), [history, rankDelta]);

  return (
    <AppShell
      title="Rank Checker"
      subtitle="Track where your keyword ranks, compare trend, and take the next SEO action in one click."
      seoTitle="Rank Checker | RankyPulse"
      seoDescription="Check where your domain ranks for a keyword."
      seoCanonical={`${base}/rank`}
      seoRobots="index,follow"
    >
      {pricingOpen ? (
        <Suspense fallback={null}>
          <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
        </Suspense>
      ) : null}

      <section className="mb-4 overflow-hidden rounded-2xl border border-[#1e293b] bg-[linear-gradient(120deg,#0b1220_0%,#16233a_60%,#1f3355_100%)] p-4 text-slate-100 md:p-5">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <div className="inline-flex items-center rounded-full border border-[#334155] bg-[#0f172a]/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#fbbf24]">
              Rank Tracker Command Center
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
              Check rankings, inspect SERP leaders, and ship the next action fast.
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Ahrefs-style workflow: run one keyword check, review competitors, then execute the highest-impact optimization.
            </p>
          </div>
          <div className="grid gap-2 rounded-xl border border-[#334155] bg-[#0f172a]/70 p-3 text-xs text-slate-300">
            <div className="flex items-center justify-between rounded-lg border border-[#334155] bg-[#111b2e] px-3 py-2">
              <span>Tracking scope</span>
              <span className="font-semibold text-slate-100">{formatScopeLabel(scopeDomain, scopeKeyword)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#334155] bg-[#111b2e] px-3 py-2">
              <span>Data freshness</span>
              <span className="font-semibold text-slate-100">{lastCheckedAt ? "Just updated" : "Awaiting first run"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#334155] bg-[#111b2e] px-3 py-2">
              <span>Source</span>
              <span className="font-semibold text-slate-100">Live rank check API</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-4 grid gap-3 md:gap-4 md:grid-cols-3">
        {kpis.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className={[
              "rp-kpi-card rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#93c5fd]",
              item.label === "Avg. position"
                ? "border-[#fdba74] bg-[linear-gradient(180deg,#fff7ed_0%,#ffedd5_100%)] shadow-[0_10px_26px_rgba(249,115,22,0.12)] hover:border-[#fb923c]"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-[13px] font-medium text-slate-600">{item.label}</div>
              <span className="text-xs font-semibold text-[#1d4ed8]">{item.hint}</span>
            </div>
            <div className={`mt-2 text-2xl font-semibold tracking-tight ${item.tone}`}>{item.value}</div>
            <div className="mt-1 text-[11px] text-slate-500">{item.why}</div>
          </button>
        ))}
      </div>

      {authUser?.role === "member" && (
        <div className="mb-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-sm text-[var(--rp-text-600)]">
          You’re in a member role. Ask your admin to unlock full tracking history and exports.
          <div className="mt-3 flex gap-2">
            <button
              className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
              onClick={async () => {
                try {
                  const token = getAuthToken();
                  await fetch(apiUrl("/api/request-upgrade"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
                  });
                  setRequestStatus("Request sent.");
                  setTimeout(() => setRequestStatus(""), 2000);
                } catch {}
              }}
            >
              Request upgrade
            </button>
            {requestStatus && <span className="text-xs text-emerald-600">{requestStatus}</span>}
          </div>
        </div>
      )}

      {!allowRank && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          The Rank Tracker is disabled for your team. Ask an admin to enable it.
        </div>
      )}
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-wrap justify-stretch gap-2 md:justify-end">
          <div className="min-w-[140px] flex-1 md:min-w-0 md:flex-none">
            <ShareRankButton result={result} />
          </div>
          <button
            onClick={async () => {
              if (!result) return;
              const mod = await import("../utils/exportRankSummary.js");
              mod.exportRankSummary(result);
            }}
            disabled={!result}
            className={"rp-btn-secondary rp-btn-sm h-9 w-full px-3 text-xs md:w-auto " + (result ? "" : "cursor-not-allowed opacity-50")}
            title={result ? "Download a .txt summary" : "Run a check first"}
          >
            Export result
          </button>
        </div>

        <div ref={historyRef}>
          <DeferredRender>
            <Suspense fallback={null}>
              <RankHistoryPanel onPick={({ keyword, domain }) => { setKeyword(keyword); setDomain(normalizeDomainInput(domain)); }} />
            </Suspense>
          </DeferredRender>
        </div>

        <div className="rp-card border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--rp-text-500)]">
            Try a keyword
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLE_KEYWORDS.map((sample) => (
              <button
                key={sample}
                onClick={() => setKeyword(sample)}
                className="rp-chip rp-chip-neutral"
                title="Use this example keyword"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={actionRef}
          className="rp-card overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_8px_28px_rgba(15,23,42,0.08)] md:p-5"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[15px] font-semibold text-slate-900">Keyword Rank Checker</div>
              <div className="mt-1 text-xs text-slate-500">Run a live SERP check and compare against top domains in one view.</div>
            </div>
            <div className="inline-flex items-center rounded-full border border-[#fed7aa] bg-[#fff7ed] px-3 py-1 text-[11px] font-semibold text-[#9a3412]">
              Live mode enabled
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (status !== "loading" && allowRank) checkRank();
            }}
            className="grid gap-4 md:grid-cols-3 md:items-end"
          >
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--rp-text-600)]" htmlFor="rank-keyword">
              Keyword
            </label>
            <input
              id="rank-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder=""
              autoComplete="off"
              className={"rp-input " + (inlineErrors.keyword ? "border-rose-300 focus:border-rose-400" : "")}
            />
            <div className="mt-1 text-xs text-[var(--rp-text-600)]">One query at a time for the cleanest signal.</div>
            {inlineErrors.keyword ? <div className="mt-1 text-xs text-rose-600">{inlineErrors.keyword}</div> : null}
            {!!ideas.length && (
              <div className="mt-2 flex flex-wrap gap-2">
                {ideas.map((x) => (
                  <button
                    key={x}
                    onClick={() => setKeyword(x)}
                    className="rp-chip rp-chip-neutral"
                    title="Suggested from your last audit"
                  >
                    {x}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--rp-text-600)]" htmlFor="rank-domain">
              Domain
            </label>
            <input
              id="rank-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onBlur={() => setDomain((prev) => normalizeDomainInput(prev))}
              placeholder=""
              autoComplete="off"
              className={"rp-input " + (inlineErrors.domain ? "border-rose-300 focus:border-rose-400" : "")}
            />
            <div className="mt-1 text-xs text-[var(--rp-text-600)]">Use root domain only (example.com), no https or path.</div>
            {inlineErrors.domain ? <div className="mt-1 text-xs text-rose-600">{inlineErrors.domain}</div> : null}
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className={[
              "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f97316] px-4 text-sm font-semibold text-white transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:w-auto",
              status === "loading" ? "opacity-50 cursor-not-allowed" : ""
            ].join(" ")}
          >
            <IconCompass size={14} />
            {status === "loading" ? "Checking..." : "Check Rank"}
          </button>
          <label className="md:col-span-3 inline-flex items-center gap-2 rounded-lg border border-[var(--rp-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--rp-text-700)]">
            <input
              type="checkbox"
              checked={forceFresh}
              onChange={(e) => setForceFresh(e.target.checked)}
            />
            Force fresh check (skip 24h smoothing cache)
          </label>
          <div className="md:col-span-3 grid gap-3 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--rp-text-500)]">Country</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="rp-input h-11">
                {COUNTRIES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--rp-text-500)]">City (optional)</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Atlanta"
                className="rp-input h-11"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--rp-text-500)]">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="rp-input h-11">
                {LANGUAGES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--rp-text-500)]">Device</label>
              <div className="flex h-11 items-center rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-1">
                {["desktop", "mobile"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    className={[
                      "h-8 flex-1 rounded-lg text-xs font-semibold capitalize transition",
                      device === d
                        ? "bg-[var(--rp-indigo-700)] text-white"
                        : "text-[var(--rp-text-700)] hover:bg-white"
                    ].join(" ")}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="md:col-span-3 flex flex-wrap items-center gap-2 text-xs text-[var(--rp-text-600)]">
            <span className="inline-flex items-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-2 py-1">SERP checked live</span>
            <span className="inline-flex items-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-2 py-1">
              {COUNTRIES.find((x) => x.value === country)?.label || country}{city ? ` • ${city}` : ""}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-2 py-1">
              {device === "mobile" ? "Mobile SERP" : "Desktop SERP"} • {language.toUpperCase()}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-2 py-1">
              {lastCheckedAt ? `Updated ${new Date(lastCheckedAt).toLocaleTimeString()}` : "Ready to run"}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-2 py-1">Data source: live rank check</span>
          </div>
          {status === "error" ? (
            <div className="md:col-span-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {String(error || "Request failed.")}
            </div>
          ) : null}
          {status === "loading" ? (
            <div className="md:col-span-3 rounded-lg border border-[var(--rp-indigo-200)] bg-[var(--rp-indigo-50)] px-3 py-2 text-sm text-[var(--rp-indigo-800)]">
              Running live rank check...
            </div>
          ) : null}
          </form>
        </div>

        {status === "idle" && (
          <div className="grid gap-3 md:gap-4">
            <div className="rp-card p-4 md:p-5 text-[var(--rp-text-700)]">
              <div className="text-sm font-semibold text-[var(--rp-text-900)]">How this helps your business</div>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                <li>Enter one keyword and your domain.</li>
                <li>Click <span className="font-semibold">Check Rank</span> for a live position check.</li>
                <li>See change vs last check and click opportunity.</li>
                <li>Run SEO Audit on that domain to fix what is holding rank back.</li>
              </ol>
            </div>

            <div data-testid="rank-analysis-section" className="rp-card p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-[var(--rp-text-900)]">Weekly Growth Alerts</div>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  Automation preview
                </span>
              </div>
              <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                Enable recurring alerts so you do not miss ranking drops or new opportunities.
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {[
                  ["weeklyEmail", "Weekly progress email"],
                  ["rankDrop", "Ranking drop alerts"],
                  ["competitorMove", "Competitor movement alerts"],
                  ["opportunity", "Opportunity alerts"]
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2 text-sm text-[var(--rp-text-700)]">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(alertPrefs?.[key])}
                      onChange={(e) => handleAlertToggle(key, e.target.checked)}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  type="email"
                  value={alertPrefs.email}
                  onChange={(e) => {
                    setAlertPrefsUI((prev) => ({ ...prev, email: e.target.value }));
                    if (alertErrors.email) setAlertErrors({ email: "" });
                  }}
                  placeholder="you@company.com"
                  className="rp-input h-10 w-full sm:w-72"
                />
                <button type="button" onClick={saveAlertEmail} className="rp-btn-primary rp-btn-sm h-10 px-4 text-xs">
                  Save alerts
                </button>
                {(alertPrefs.weeklyEmail || alertPrefs.rankDrop || alertPrefs.competitorMove || alertPrefs.opportunity) ? (
                  <button type="button" onClick={() => setPricingOpen(true)} className="rp-btn-secondary rp-btn-sm h-10 px-4 text-xs">
                    Unlock weekly automation
                  </button>
                ) : null}
              </div>
              {alertErrors.email ? <div className="mt-2 text-xs text-rose-600">{alertErrors.email}</div> : null}
              {alertMessage ? <div className="mt-2 text-xs text-emerald-600">{alertMessage}</div> : null}
            </div>
          </div>
        )}

        {status === "idle" && (
          <div className="rp-card p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[15px] font-semibold text-[var(--rp-text-800)]">Position trend (last 7 checks)</div>
              <div className="text-xs text-[var(--rp-text-500)]">Run Check Rank to load live movement and competitor analysis.</div>
            </div>
            <div className="mt-3 h-48 rounded-xl border border-[var(--rp-border)] bg-white p-2">
              {last7Checks.length ? (
                <SafeApexChart
                  type="line"
                  height={176}
                  options={{
                    chart: { toolbar: { show: false }, animations: { enabled: true } },
                    stroke: { curve: "smooth", width: 3 },
                    colors: ["#7c3aed"],
                    grid: { borderColor: "#ede9fe" },
                    markers: { size: 4, strokeWidth: 2, colors: ["#7c3aed"] },
                    yaxis: { reversed: true, min: 1, forceNiceScale: true, labels: { style: { colors: "#6b5b95" } } },
                    xaxis: { categories: last7Checks.map((point) => point.label), labels: { style: { colors: "#6b5b95" } } }
                  }}
                  series={[{ name: "Position", data: last7Checks.map((point) => point.rank) }]}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[var(--rp-text-500)]">
                  No history yet. Your first rank check creates the baseline trend.
                </div>
              )}
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="rp-card p-4 md:p-5 text-[var(--rp-text-700)]">
            <div className="text-sm font-semibold text-[var(--rp-text-800)]">Checking rank…</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Fetching SERP", "Comparing domains", "Calculating visibility"].map((step, index) => (
                <span
                  key={step}
                  className={[
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                    loadingStep >= index
                      ? "border-[var(--rp-indigo-300)] bg-[var(--rp-indigo-100)] text-[var(--rp-indigo-800)]"
                      : "border-[var(--rp-border)] bg-white text-[var(--rp-text-500)]"
                  ].join(" ")}
                >
                  {index + 1}. {step}
                </span>
              ))}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-rose-300/60 bg-rose-100/70 p-4 md:p-5 text-rose-700">
            {String(error || "")}
          </div>
        )}

        {status === "success" && (
          <div className="grid gap-3 md:gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  ["overview", "Overview"],
                  ["dashboard", "Dashboard"],
                  ["trend", "Trend"],
                  ["recipe", "Action plan"],
                  ["serp", "SERP"]
                ].map(([id, label]) => (
                  <button
                    key={`jump-${id}`}
                    type="button"
                    onClick={() => document.getElementById(`rank-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div id="rank-overview" className="rp-card border border-slate-200 bg-white p-4 md:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="rp-section-title">Rank result</div>
                {badge && (
                  <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold " + badge.cls}>
                    {badge.label}
                  </span>
                )}
              </div>

              <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                Last checked: {lastCheckedAt ? new Date(lastCheckedAt).toLocaleString() : "Just now"}
              </div>
              <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                {freshnessCopy}
                {result?.cache_expires_at ? ` Cache expires: ${new Date(result.cache_expires_at).toLocaleString()}` : ""}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="text-xs text-slate-500">Trend</div>
                  <div className={"mt-1 text-2xl font-semibold " + (trend24h?.direction === "up" ? "text-emerald-600" : trend24h?.direction === "down" ? "text-rose-600" : "text-slate-900")}>
                    {trendLabel(trend24h?.direction, Number(trend24h?.delta || 0))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="text-xs text-slate-500">Position</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">{shownRank ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="text-xs text-slate-500">Observed range (24h)</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {Number.isFinite(Number(range24h?.min)) && Number.isFinite(Number(range24h?.max))
                      ? `${range24h.min}-${range24h.max}`
                      : "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {Number.isFinite(Number(range24h?.sample_count)) ? `${range24h.sample_count} checks` : "Sample count pending"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="text-xs text-slate-500">Confidence</div>
                  <div className="mt-1 text-2xl font-semibold capitalize text-slate-900">{confidenceLabel || "low"}</div>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-[var(--rp-text-800)]">
                <div><span className="text-[var(--rp-text-500)]">Keyword:</span> {displayKeyword || "-"}</div>
                <div><span className="text-[var(--rp-text-500)]">Domain:</span> {safeDomain || "-"}</div>
                <div><span className="text-[var(--rp-text-500)]">Top competitor:</span> {inferredCompetitor}</div>
                <div><span className="text-[var(--rp-text-500)]">Keyword intent:</span> {keywordIntent}</div>
                <div className="break-all">
                  <span className="text-[var(--rp-text-500)]">Ranking URL:</span>{" "}
                  <span className="font-medium text-[var(--rp-text-900)]">{rankingUrl || "Pending live ranking URL"}</span>
                </div>

                <div className="text-2xl font-semibold text-[var(--rp-text-900)]">
                  <span className="text-[var(--rp-text-500)] text-base font-medium">Rank:</span> {shownRank ?? "-"}
                </div>

                <div className="rounded-xl border border-[#fdba74] bg-[#fff7ed] p-3 shadow-sm">
                  <div className="text-xs text-[#9a3412]">{getScenarioEstimateLabel("clicks_opportunity")}</div>
                  <div className="mt-1 text-2xl font-semibold text-[#ea580c]">+{estimatedClicksGain}/mo</div>
                </div>

                <div className="text-sm text-[var(--rp-text-700)]">
                  {rankExplain(shownRank)}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (!auditTargetDomain) return;
                      navigate(`/audit?url=${encodeURIComponent(`https://${auditTargetDomain}`)}`);
                    }}
                    className="rp-btn-primary h-10 w-full text-sm sm:w-auto"
                  >
                    Run SEO Audit for this domain
                  </button>

                  <button
                    onClick={async () => {
                      if (!result) return;
                      const mod = await import("../utils/exportRankSummary.js");
                      mod.exportRankSummary(result);
                    }}
                    className="rp-btn-secondary rp-btn-sm h-9 w-full px-3 text-xs sm:w-auto"
                  >
                    Export result
                  </button>

                  <button
                    onClick={() => setPricingOpen(true)}
                    className="rp-btn-secondary rp-btn-sm h-9 w-full px-3 text-xs sm:w-auto"
                  >
                    Track weekly
                  </button>
                </div>
              </div>
            </div>

            <div id="rank-dashboard" className="rp-card border border-slate-200 p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">SEO Progress Dashboard</div>
                  <div className="text-xs text-[var(--rp-text-500)]">{formatScopeLabel(scopeDomain, scopeKeyword)}</div>
                </div>
                <span
                  className={[
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    scoreSourceLabel === "Hybrid"
                      ? "border-[var(--rp-indigo-200)] bg-[var(--rp-indigo-50)] text-[var(--rp-indigo-800)]"
                      : scoreSourceLabel === "Live data"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                  ].join(" ")}
                >
                  {scoreSourceLabel}
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs text-[var(--rp-text-500)]">SEO score (this month)</div>
                  <div className="mt-1 text-2xl font-semibold text-[var(--rp-indigo-700)]">{seoScoreHybrid ?? "—"}</div>
                  <div className="mt-1 text-[11px] text-[var(--rp-text-500)]">Why this matters: this blends ranking strength and consistency.</div>
                </div>
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs text-[var(--rp-text-500)]">Rank improvement (30d)</div>
                  <div className={"mt-1 text-2xl font-semibold " + ((rankImprovement30d || 0) > 0 ? "text-emerald-600" : "text-[var(--rp-text-900)]")}>
                    {Number.isFinite(rankImprovement30d) ? `${rankImprovement30d > 0 ? "+" : ""}${rankImprovement30d}` : "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--rp-text-500)]">Why this matters: positive movement means fixes are working.</div>
                </div>
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs text-[var(--rp-text-500)]">Actions completed</div>
                  <div className="mt-1 text-2xl font-semibold text-[var(--rp-text-900)]">{winsStats.completed}/{winsStats.total}</div>
                  <div className="mt-1 text-[11px] text-[var(--rp-text-500)]">Why this matters: completed actions drive predictable SEO gains.</div>
                </div>
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs text-[var(--rp-text-500)]">{getScenarioEstimateLabel("traffic_gained")}</div>
                  <div className="mt-1 text-2xl font-semibold text-[var(--rp-indigo-700)]">+{completedVisitsGain}/mo</div>
                  <div className="mt-1 text-[11px] text-[var(--rp-text-500)]">Why this matters: shows monthly upside from shipped fixes.</div>
                </div>
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs text-[var(--rp-text-500)]">Next best action</div>
                  <div className="mt-1 text-sm font-semibold text-[var(--rp-text-900)]">{primaryNextAction.label || "All core steps complete"}</div>
                  <div className="mt-1 text-[11px] text-[var(--rp-text-500)]">{primaryNextAction.reason}</div>
                  <button
                    type="button"
                    onClick={primaryNextAction.onClick}
                    className="rp-btn-primary rp-btn-sm mt-2 h-8 px-3 text-xs"
                  >
                    {primaryNextAction.label || "Run next optimization"}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
                <div className="rounded-xl border border-[var(--rp-border)] bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Monthly SEO score trend</div>
                    <div className="text-[11px] text-[var(--rp-text-500)]">{checksThisMonth.length} checks this month</div>
                  </div>
                  <div className="mt-2 h-16">
                    {monthlySeoSparkValues.length >= 2 ? (
                      <ApexSparkline values={monthlySeoSparkValues} />
                    ) : (
                      <div className="flex h-full items-center text-xs text-[var(--rp-text-500)]">Run checks to build monthly score trend.</div>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--rp-border)] bg-white p-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--rp-text-500)]">
                    <span>Wins progress</span>
                    <span>{Math.round((winsStats.completed / winsStats.total) * 100)}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--rp-gray-100)]">
                    <div
                      className="h-2 rounded-full bg-[var(--rp-indigo-700)] transition-all"
                      style={{ width: `${Math.round((winsStats.completed / winsStats.total) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      {winsThisMonth} wins this month
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-2 py-0.5 text-[11px] text-[var(--rp-text-600)]">
                      {winsStats.pending} pending
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-2 py-0.5 text-[11px] text-[var(--rp-text-600)]">
                      Fastest win: {nextIncompleteStep?.label || "Done"}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-2 py-0.5 text-[11px] text-[var(--rp-text-600)]">
                      Streak: {winsStats.streak} days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rp-card p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">SEO Success Path</div>
                <span className="inline-flex items-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-2 py-0.5 text-[11px] text-[var(--rp-text-600)]">
                  {winsStats.completed}/{winsStats.total} complete
                </span>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {SUCCESS_STEPS.map((step) => {
                  const complete = Boolean(progressState?.stepState?.[step.key]);
                  return (
                    <div key={step.key} className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-2 text-sm font-semibold text-[var(--rp-text-900)]">
                          <input
                            type="checkbox"
                            checked={complete}
                            onChange={(e) => handleProgressToggle(step.key, e.target.checked)}
                            className="mt-0.5"
                          />
                          <span>{step.label}</span>
                        </label>
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            complete
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          ].join(" ")}
                        >
                          {complete ? "Completed" : "Pending"}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-[var(--rp-text-600)]">{step.why}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full border border-[var(--rp-indigo-200)] bg-[var(--rp-indigo-50)] px-2 py-0.5 text-[11px] font-semibold text-[var(--rp-indigo-800)]">
                          {getScenarioEstimateLabel("ctr_lift")}: +{step.ctrLift}% CTR
                        </span>
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          {getScenarioEstimateLabel("monthly_visits")}: +{step.visits}/mo
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => actionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className="rp-btn-secondary rp-btn-sm mt-3 h-8 px-3 text-xs"
                      >
                        {step.actionLabel}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 rounded-xl border border-[var(--rp-border)] bg-white px-3 py-2 text-xs text-[var(--rp-text-600)]">
                {getScenarioEstimateLabel("cumulative_lift")}: <span className="font-semibold text-[var(--rp-indigo-700)]">+{completedCtrGain}% CTR</span> and <span className="font-semibold text-[var(--rp-indigo-700)]">+{completedVisitsGain}/mo</span>.
              </div>
            </div>

            <div className="rp-card p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Weekly Growth Alerts</div>
                <span className="inline-flex items-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-2 py-0.5 text-[11px] text-[var(--rp-text-600)]">
                  Local preference sync
                </span>
              </div>
              <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                Get these alerts every week without manual checks.
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {[
                  ["weeklyEmail", "Weekly progress email"],
                  ["rankDrop", "Ranking drop alerts"],
                  ["competitorMove", "Competitor movement alerts"],
                  ["opportunity", "Opportunity alerts"]
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2 text-sm text-[var(--rp-text-700)]">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(alertPrefs?.[key])}
                      onChange={(e) => handleAlertToggle(key, e.target.checked)}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  type="email"
                  value={alertPrefs.email}
                  onChange={(e) => {
                    setAlertPrefsUI((prev) => ({ ...prev, email: e.target.value }));
                    if (alertErrors.email) setAlertErrors({ email: "" });
                  }}
                  placeholder="you@company.com"
                  className="rp-input h-10 w-full sm:w-72"
                />
                <button type="button" onClick={saveAlertEmail} className="rp-btn-primary rp-btn-sm h-10 px-4 text-xs">
                  Save alerts
                </button>
                {(alertPrefs.weeklyEmail || alertPrefs.rankDrop || alertPrefs.competitorMove || alertPrefs.opportunity) ? (
                  <>
                    <button type="button" onClick={() => setPricingOpen(true)} className="rp-btn-secondary rp-btn-sm h-10 px-4 text-xs">
                      Unlock weekly automation
                    </button>
                    <button type="button" onClick={() => setPricingOpen(true)} className="rp-btn-secondary rp-btn-sm h-10 px-4 text-xs">
                      Track weekly
                    </button>
                  </>
                ) : null}
              </div>
              {alertErrors.email ? <div className="mt-2 text-xs text-rose-600">{alertErrors.email}</div> : null}
              {alertMessage ? <div className="mt-2 text-xs text-emerald-600">{alertMessage}</div> : null}
            </div>

            <div id="rank-trend" ref={trendRef} className="grid gap-4 md:grid-cols-3">
              <div className="rp-card rp-kpi-card p-4">
                <div className="flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                  <IconChart size={14} />
                  Current rank
                </div>
                <div className="mt-2 text-3xl font-semibold text-[var(--rp-text-900)]">{shownRank ?? "—"}</div>
                <div className="mt-2 rp-body-xsmall text-[var(--rp-text-500)]">
                  {rankExplain(shownRank) || "Run a check to see your visibility."}
                </div>
              </div>
              <div className="rp-card rp-kpi-card p-4">
                <div className="flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                  <IconReport size={14} />
                  Best in history
                </div>
                <div className="mt-2 text-3xl font-semibold text-[var(--rp-text-900)]">
                  {bestRank ?? "—"}
                </div>
                <div className="mt-2 rp-body-xsmall text-[var(--rp-text-500)]">
                  Based on the last {history.length || 0} checks.
                </div>
              </div>
              <div className="rp-card rp-kpi-card p-4">
                <div className="flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                  <IconChart size={14} />
                  Last 7 checks trend
                </div>
                <div className="rp-chart-card mt-3 h-14 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-2">
                  {trendSparkValues.length >= 2 ? (
                    <ApexSparkline values={trendSparkValues} inverted />
                  ) : (
                    <div className="text-xs text-[var(--rp-text-500)]">Need at least 2 checks to show trend movement.</div>
                  )}
                </div>
                {trendMovement ? (
                  <div
                    className={
                      "mt-2 rp-body-xsmall " +
                      (trendMovement.direction === "up"
                        ? "text-emerald-600"
                        : trendMovement.direction === "down"
                          ? "text-rose-600"
                          : "text-[var(--rp-text-500)]")
                    }
                  >
                    {trendMovement.text}
                  </div>
                ) : (
                  <div className="mt-2 rp-body-xsmall text-[var(--rp-text-500)]">
                    Need at least 2 checks to show trend direction.
                  </div>
                )}
              </div>
            </div>

            {last7Checks.length >= 2 ? (
              <div className="rp-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-[var(--rp-text-800)]">Position trend (last 7 checks)</div>
                  <div className="text-xs text-[var(--rp-text-500)]">Rank 1 is best</div>
                </div>
                <div className="mt-3 h-48 rounded-xl border border-[var(--rp-border)] bg-white p-2">
                  <SafeApexChart
                    type="line"
                    height={176}
                    options={{
                      chart: { toolbar: { show: false }, animations: { enabled: true } },
                      stroke: { curve: "smooth", width: 3 },
                      colors: ["#7c3aed"],
                      grid: { borderColor: "#ede9fe" },
                      markers: { size: 4, strokeWidth: 2, colors: ["#7c3aed"] },
                      annotations: {
                        points: [
                          ...(trendMarkers.best ? [{
                            x: trendMarkers.best.label,
                            y: trendMarkers.best.rank,
                            marker: { size: 5, fillColor: "#10b981", strokeColor: "#ffffff", strokeWidth: 2 },
                            label: { borderColor: "#10b981", style: { color: "#fff", background: "#10b981" }, text: "Best" }
                          }] : []),
                          ...(trendMarkers.worst ? [{
                            x: trendMarkers.worst.label,
                            y: trendMarkers.worst.rank,
                            marker: { size: 5, fillColor: "#ef4444", strokeColor: "#ffffff", strokeWidth: 2 },
                            label: { borderColor: "#ef4444", style: { color: "#fff", background: "#ef4444" }, text: "Worst" }
                          }] : [])
                        ]
                      },
                      yaxis: {
                        reversed: true,
                        min: 1,
                        forceNiceScale: true,
                        labels: { style: { colors: "#6b5b95" } }
                      },
                      xaxis: {
                        categories: last7Checks.map((point) => point.label),
                        labels: { style: { colors: "#6b5b95" } }
                      },
                      tooltip: {
                        x: { formatter: (v) => `Date: ${v}` },
                        y: { formatter: (v) => `Position ${Math.round(v)}` }
                      }
                    }}
                    series={[{ name: "Position", data: last7Checks.map((point) => point.rank) }]}
                  />
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div id="rank-recipe" className="rp-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Actionable SEO recipe (to reach page 1)</div>
                  <ProvenanceBadge tag={provenanceByCard.actionableRecipe} />
                </div>
                <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                  <span className="mr-1 font-semibold uppercase tracking-[0.08em] text-[11px]">Observed facts:</span>
                  {getObservedFactsIntro(provenanceByCard.actionableRecipe, "actionableRecipe")}
                </div>
                <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                  <span className="mr-1 font-semibold uppercase tracking-[0.08em] text-[11px]">Modeled recommendations:</span>
                  {getModeledRecommendationIntro(provenanceByCard.actionableRecipe, "actionableRecipe")}
                </div>
                <div className="mt-3 space-y-3">
                  {actionableRecipe.map((fix) => (
                    <div key={fix.title} className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                      <div className="text-sm font-semibold text-[var(--rp-text-900)]">{fix.title}</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--rp-text-700)]">
                        {fix.steps.map((step) => <li key={`${fix.title}-${step}`}>{step}</li>)}
                      </ul>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          {getScenarioEstimateLabel("ctr_lift")}: +{fix.ctrLift}% CTR
                        </span>
                        <span className="inline-flex items-center rounded-full border border-[var(--rp-indigo-200)] bg-[var(--rp-indigo-50)] px-2 py-0.5 text-xs font-semibold text-[var(--rp-indigo-800)]">
                          {getScenarioEstimateLabel("monthly_visits")}: +{fix.visits}/mo
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const firstTopic = gap.missingTopics[0];
                            if (firstTopic) queueKeywordFromActionPlan(firstTopic);
                          }}
                          className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs"
                        >
                          Queue in action plan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rp-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Rank movement explanation</div>
                  <ProvenanceBadge tag={provenanceByCard.rankMovementExplanation} />
                </div>
                <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                  {getObservedFactsIntro(provenanceByCard.rankMovementExplanation, "rankMovementExplanation")}
                </div>
                <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                  {getModeledRecommendationIntro(provenanceByCard.rankMovementExplanation, "rankMovementExplanation")}
                </div>
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Observed facts</div>
                <div className="mt-3 space-y-2">
                  {rankMovementFacts.length ? rankMovementFacts.map((line) => (
                    <div key={`${line.source}-${line.metric}`} className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2 text-sm text-[var(--rp-text-700)]">
                      <div><span className="font-semibold">{line.source}</span> • <span className="font-semibold">Metric:</span> {line.metric}</div>
                      <div className="mt-1"><span className="font-semibold">Interpretation:</span> {line.interpretation}</div>
                      <div className="mt-1"><span className="font-semibold">Action:</span> {line.action}</div>
                    </div>
                  )) : (
                    <div className="rounded-lg border border-dashed border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-4 text-sm text-[var(--rp-text-600)]">
                      No direct live movement facts are available for this run.
                    </div>
                  )}
                </div>
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Modeled recommendations</div>
                <div className="mt-3 space-y-2">
                  {rankMovementRecommendations.length ? rankMovementRecommendations.map((line) => (
                    <div key={`${line.source}-${line.metric}`} className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2 text-sm text-[var(--rp-text-700)]">
                      <div><span className="font-semibold">{line.source}</span> • <span className="font-semibold">Metric:</span> {line.metric}</div>
                      <div className="mt-1"><span className="font-semibold">Interpretation:</span> {line.interpretation}</div>
                      <div className="mt-1"><span className="font-semibold">Action:</span> {line.action}</div>
                    </div>
                  )) : (
                    <div className="rounded-lg border border-dashed border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-4 text-sm text-[var(--rp-text-600)]">
                      Insufficient live signals for this card. Run another rank check with the same keyword and domain.
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-[var(--rp-text-500)]">
                  Next action is centralized above: <span className="font-semibold text-[var(--rp-text-700)]">{primaryNextAction.label}</span>.
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rp-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Keyword opportunity insight</div>
                  <ProvenanceBadge tag={provenanceByCard.keywordOpportunity} />
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--rp-text-700)]">{opportunityInsight(shownRank)}</p>
                <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                  {getObservedFactsIntro(provenanceByCard.keywordOpportunity, "keywordOpportunity")}
                </div>
                <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                  {getModeledRecommendationIntro(provenanceByCard.keywordOpportunity, "keywordOpportunity")}
                </div>
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Observed facts</div>
                {keywordObservedFacts.length ? (
                  <div className="mt-2 grid gap-1 text-xs text-[var(--rp-text-600)]">
                    {keywordObservedFacts.map((fact) => (
                      <div key={`fact-${fact.label}`}>
                        <span className="font-semibold text-[var(--rp-text-700)]">{fact.label}:</span> {fact.value}
                      </div>
                    ))}
                  </div>
                ) : null}
                {!!keywordLiveEvidence.length && (
                  <div className="mt-3 space-y-2">
                    {keywordLiveEvidence.slice(0, 2).map((reason) => (
                      <div key={`opp-live-${reason.source}-${reason.metric}`} className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2 text-sm text-[var(--rp-text-700)]">
                        <div><span className="font-semibold">{reason.source}</span> • <span className="font-semibold">Metric:</span> {reason.metric}</div>
                        <div className="mt-1"><span className="font-semibold">Interpretation:</span> {reason.interpretation}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Modeled recommendations</div>
                {!!keywordModeledRecommendations.length && (
                  <div className="mt-2 space-y-2">
                    {keywordModeledRecommendations.slice(0, 2).map((reason) => (
                      <div key={`opp-${reason.source}-${reason.metric}`} className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2 text-sm text-[var(--rp-text-700)]">
                        <div><span className="font-semibold">{reason.source}</span> • <span className="font-semibold">Metric:</span> {reason.metric}</div>
                        <div className="mt-1"><span className="font-semibold">Interpretation:</span> {reason.interpretation}</div>
                        <div className="mt-1"><span className="font-semibold">Action:</span> {reason.action}</div>
                      </div>
                    ))}
                  </div>
                )}
                {hasValidRank(shownRank) ? (
                  <div className="mt-3 inline-flex items-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-1 text-xs font-semibold text-[var(--rp-text-600)]">
                    Current position: {shownRank}
                  </div>
                ) : null}
                <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                  {getKeywordOpportunitySourceCopy(provenanceByCard.keywordOpportunity)}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Difficulty</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--rp-text-900)]">{difficultyScore ?? "—"}/100</div>
                    <div className="mt-1 text-[11px] text-[var(--rp-text-500)]">Higher means stronger competitors.</div>
                  </div>
                  <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Opportunity</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--rp-indigo-700)]">{opportunityScore ?? "—"}/100</div>
                    <div className="mt-1 text-[11px] text-[var(--rp-text-500)]">Higher means faster growth potential.</div>
                  </div>
                  <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Traffic potential</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--rp-text-900)]">{trafficPotential ? `~${trafficPotential}/mo` : "—"}</div>
                    <div className="mt-1 text-[11px] text-[var(--rp-text-500)]">{getScenarioEstimateLabel("monthly_visits")}: modeled monthly visits from this keyword.</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!auditTargetDomain) return;
                    navigate(`/audit?url=${encodeURIComponent(`https://${auditTargetDomain}`)}`);
                  }}
                  className="rp-btn-secondary rp-btn-sm mt-3 h-8 px-3 text-xs"
                >
                  Review in action plan
                </button>
              </div>

              <div className="rp-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Competitor snapshot (top 3)</div>
                  <ProvenanceBadge tag={provenanceByCard.competitorSnapshot} />
                </div>
                <div className="mt-3 grid gap-2">
                  {topCompetitors.length ? (
                    topCompetitors.map((entry) => (
                      <div
                        key={`${entry.position}-${entry.domain}`}
                        className="flex items-center justify-between rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2 text-[15px]"
                      >
                        <span className="font-medium text-[var(--rp-text-900)]">{entry.domain}</span>
                        <span className="rounded-full bg-[var(--rp-indigo-100)] px-2 py-1 text-xs font-semibold text-[var(--rp-indigo-800)]">
                          #{entry.position}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-4 text-sm text-[var(--rp-text-600)]">
                      Sample competitor pattern until live SERP competitor data is available.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div id="rank-serp" className="rp-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">SERP snapshot preview</div>
                <ProvenanceBadge tag={provenanceByCard.serpSnapshot} />
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="text-xs text-[var(--rp-text-500)]">
                  {getSerpSnapshotSourceCopy(provenanceByCard.serpSnapshot)}
                </div>
                <div className="text-xs text-[var(--rp-text-500)]">
                  {COUNTRIES.find((x) => x.value === (result?.country || country))?.label || (result?.country || country)} • {(result?.device || device)} • {(result?.language || language).toUpperCase()}
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                {serpPreview.length ? (
                  serpPreview.slice(0, 5).map((row) => (
                    <div key={`serp-${row.position}-${row.domain}`} className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate text-sm font-semibold text-[var(--rp-text-900)]">#{row.position} {row.title}</div>
                        <span className="rounded-full border border-[var(--rp-border)] bg-white px-2 py-0.5 text-[11px] text-[var(--rp-text-600)]">{row.type}</span>
                      </div>
                      <div className="mt-1 text-xs text-[var(--rp-text-700)]">{row.description}</div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[var(--rp-text-500)]">
                        <span>{row.domain}</span>
                        <span className="rounded-full border border-[var(--rp-border)] bg-white px-2 py-0.5 text-[11px]">
                          {row.snippetSource}
                        </span>
                      </div>
                      {Array.isArray(row.sitelinks) && row.sitelinks.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {row.sitelinks.slice(0, 4).map((link) => (
                            <span
                              key={`${row.position}-${row.domain}-${link}`}
                              className="inline-flex items-center rounded-full border border-[var(--rp-border)] bg-white px-2 py-0.5 text-[11px] text-[var(--rp-text-600)]"
                            >
                              {link}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-4 text-sm text-[var(--rp-text-600)]">
                    SERP preview appears after a successful check.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rp-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Backlink and authority comparison</div>
                  <ProvenanceBadge tag={provenanceByCard.backlinkComparison} />
                </div>
                <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                  Benchmark estimate from competitor SERP patterns.
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full border border-[var(--rp-border)] bg-white px-2 py-0.5 text-[var(--rp-text-600)]">Words: modeled</span>
                  <span className="rounded-full border border-[var(--rp-border)] bg-white px-2 py-0.5 text-[var(--rp-text-600)]">Backlinks: modeled</span>
                  <span className="rounded-full border border-[var(--rp-border)] bg-white px-2 py-0.5 text-[var(--rp-text-600)]">Schema: modeled</span>
                </div>
                <div className="mt-3 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-[var(--rp-text-500)]">
                        <th className="pb-2">Domain</th>
                        <th className="pb-2">Words</th>
                        <th className="pb-2">Backlinks</th>
                        <th className="pb-2">DR</th>
                        <th className="pb-2">Schema</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[var(--rp-border)]">
                        <td className="py-2 font-semibold text-[var(--rp-text-900)]">{competitorBench.own.domain} (you)</td>
                        <td className="py-2">{competitorBench.own.words}</td>
                        <td className="py-2">{competitorBench.own.backlinks}</td>
                        <td className="py-2">{competitorBench.own.dr}</td>
                        <td className="py-2">{competitorBench.own.schema ? "Yes" : "No"}</td>
                      </tr>
                      {competitorBench.competitors.slice(0, 3).map((row) => (
                        <tr key={`bench-${row.domain}`} className="border-t border-[var(--rp-border)]">
                          <td className="py-2 font-medium text-[var(--rp-text-900)]">{row.domain}</td>
                          <td className="py-2">{row.words}</td>
                          <td className="py-2">{row.backlinks}</td>
                          <td className="py-2">{row.dr}</td>
                          <td className="py-2">{row.schema ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                  Benchmarks are modeled unless live competitor metrics are available.
                </div>
              </div>

              <div className="rp-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Trend story</div>
                  <ProvenanceBadge tag={provenanceByCard.trendStory} />
                </div>
                <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                  {getObservedFactsIntro(provenanceByCard.trendStory, "trendStory")}
                </div>
                <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                  {getModeledRecommendationIntro(provenanceByCard.trendStory, "trendStory")}
                </div>
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Observed facts</div>
                <div className="mt-2 grid gap-1 text-xs text-[var(--rp-text-600)]">
                  {trendObservedFacts.map((fact) => (
                    <div key={`trend-fact-${fact.label}`}>
                      <span className="font-semibold text-[var(--rp-text-700)]">{fact.label}:</span> {fact.value}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Modeled recommendations</div>
                <div className="mt-3 space-y-2">
                  {trendStory.length ? trendStory.map((line) => (
                    <div key={`${line.source}-${line.metric}`} className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2 text-sm text-[var(--rp-text-700)]">
                      <div><span className="font-semibold">{line.source}</span> • <span className="font-semibold">Metric:</span> {line.metric}</div>
                      <div className="mt-1"><span className="font-semibold">Interpretation:</span> {line.interpretation}</div>
                      <div className="mt-1"><span className="font-semibold">Action:</span> {line.action}</div>
                    </div>
                  )) : (
                    <div className="rounded-lg border border-dashed border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-4 text-sm text-[var(--rp-text-600)]">
                      Run more checks to unlock trend storytelling.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rp-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Content gap preview</div>
                <ProvenanceBadge tag={provenanceByCard.contentGap} />
              </div>
              <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                Missing topics/headings inferred from competing SERP pages.
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Missing topics</div>
                  <div className="mt-2 space-y-2 text-sm">
                    {missingTopicRows.slice(0, 4).map((row) => (
                      <div key={`topic-${row.topic}`} className="flex items-center justify-between rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">
                        <span>{row.topic}</span>
                        <span className="text-[11px] font-semibold">Missing • {row.confidence}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Competitor heading coverage</div>
                  <div className="mt-2 space-y-1 text-sm text-[var(--rp-text-700)]">
                    {contentGapDiffRows.slice(0, 4).map((row) => (
                      <div key={`head-${row.heading}`} className="rounded-md border border-[var(--rp-border)] bg-white px-2 py-1">
                        <div className="font-medium">{row.heading}</div>
                        <div className="text-[11px] text-[var(--rp-text-500)]">{row.coverageCount}/3 competitors include this heading</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Missing keywords</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {gap.missingKeywords.slice(0, 6).map((kw) => (
                      <button
                        key={`gap-kw-${kw}`}
                        type="button"
                        onClick={() => setKeyword(kw)}
                        className="rp-chip rp-chip-neutral"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-[var(--rp-text-500)]">
                    Suggested from competitor topic overlap + related intent terms.
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    const first = gap.missingKeywords[0] || gap.missingTopics[0];
                    if (first) queueKeywordFromActionPlan(first);
                  }}
                  className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs"
                >
                  Queue in action plan
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
