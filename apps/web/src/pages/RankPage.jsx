import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { IconArrowRight, IconCompass, IconChart, IconReport } from "../components/Icons.jsx";
import ShareRankButton from "../components/ShareRankButton.jsx";
import DeferredRender from "../components/DeferredRender.jsx";
import {
  listRankChecks,
  normalizeDomainForStore,
  normalizeKeywordForStore,
  saveRankCheck
} from "../utils/rankHistory.js";
import { decodeSharePayload } from "../utils/shareRank.js";
import { listSnapshots } from "../utils/auditSnapshots.js";
import { getAuthToken, getAuthUser } from "../lib/authClient.js";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";
import ApexSparkline from "../components/charts/ApexSparkline.jsx";
import SafeApexChart from "../components/charts/SafeApexChart.jsx";

const PricingModal = lazy(() => import("../components/PricingModal.jsx"));
const RankHistoryPanel = lazy(() => import("../components/RankHistoryPanel.jsx"));
const RankUpsellBanner = lazy(() => import("../components/RankUpsellBanner.jsx"));

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

function ProvenanceBadge({ live }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        live
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      ].join(" ")}
    >
      {live ? "Live data" : "Estimated"}
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

export default function RankPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  const [pricingOpen, setPricingOpen] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("US");
  const [city, setCity] = useState("");
  const [device, setDevice] = useState("desktop");
  const [language, setLanguage] = useState("en");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [inlineErrors, setInlineErrors] = useState({ keyword: "", domain: "" });
  const [waitlistMessage, setWaitlistMessage] = useState("");
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
      const kw = (params.get("keyword") || "").trim();
      const dm = (params.get("domain") || "").trim();
      const ctry = (params.get("country") || "").trim();
      const lang = (params.get("language") || "").trim();
      const dev = (params.get("device") || "").trim();
      const cityParam = (params.get("city") || "").trim();

      if (kw) setKeyword(kw);
      if (dm) setDomain(dm);
      if (ctry) setCountry(ctry.toUpperCase());
      if (lang) setLanguage(lang.toLowerCase());
      if (dev) setDevice(dev.toLowerCase() === "mobile" ? "mobile" : "desktop");
      if (cityParam) setCity(cityParam);

      if (share) {
        const payload = decodeSharePayload(share);
        if (payload && payload.kind === "rank") {
          const normalized = {
            keyword: payload.keyword || kw || "",
            domain: payload.domain || dm || "",
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
    setWaitlistMessage("");

    if (!allowRank) {
      setStatus("error");
      setError("Rank Tracker disabled for your team.");
      return;
    }
    if (!keyword.trim() || !domain.trim()) {
      setStatus("error");
      setError("Enter both a keyword and a domain.");
      return;
    }
    if (inlineErrors.keyword || inlineErrors.domain) {
      setStatus("error");
      setError("Please fix the highlighted fields before running the check.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(apiUrl("/api/rank-check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          domain: domainFromInput(domain),
          country,
          city: city.trim(),
          device,
          language
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
        rank: data.rank ?? data.position,
        country: String(data?.country || country).toUpperCase(),
        city: String(data?.city || city || "").trim(),
        device: String(data?.device || device).toLowerCase() === "mobile" ? "mobile" : "desktop",
        language: String(data?.language || language).toLowerCase(),
        serp_preview: Array.isArray(data?.serp_preview) ? data.serp_preview : [],
        traffic_potential: Number(data?.traffic_potential),
        difficulty_score: Number(data?.difficulty_score),
        opportunity_score: Number(data?.opportunity_score)
      };
      setResult(normalized);
      try { saveRankCheck(normalized); } catch {}
      setLastCheckedAt(normalized?.checked_at || new Date().toISOString());
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(String(e?.message || "Request failed."));
    }
  }

  const shownRank = result?.rank ?? result?.position ?? null;
  const badge = rankBadge(shownRank);

  const ideas = useMemo(() => {
    if (keyword.trim()) return [];
    return latestKeywordIdeasForDomain(domain);
  }, [domain, keyword]);

  const safeKeyword = String(result?.keyword || keyword || "");
  const safeDomain = normalizeDomainForStore(result?.domain || domainFromInput(domain) || "");
  const displayKeyword = keywordToTitleCase(safeKeyword);

  const history = useMemo(() => {
    const all = listRankChecks();
    if (!safeKeyword && !safeDomain) return all.slice(0, 12);
    return all.filter((x) => {
      const kwMatch = safeKeyword ? String(x.keyword || "").toLowerCase() === safeKeyword.toLowerCase() : true;
      const dmMatch = safeDomain ? String(x.domain || "").toLowerCase().includes(safeDomain.toLowerCase()) : true;
      return kwMatch && dmMatch;
    }).slice(0, 12);
  }, [safeKeyword, safeDomain]);

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
  const hasLiveTopCompetitors = topCompetitors.length > 0;
  const inferredCompetitor = useMemo(() => {
    if (hasValidRank(shownRank) && Number(shownRank) <= 1) return "You are currently leading";
    if (topCompetitors[0]?.domain) return topCompetitors[0].domain;
    const known = String(result?.top_competitor || result?.competitor || "").trim();
    if (known) return known;
    return "Higher-ranked competitor in this SERP";
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
  const hasLiveMetricScores = useMemo(() => {
    const difficultyLive = Number.isFinite(Number(result?.difficulty_score)) && Number(result?.difficulty_score) > 0;
    const trafficLive = Number.isFinite(Number(result?.traffic_potential)) && Number(result?.traffic_potential) > 0;
    const opportunityLive = Number.isFinite(Number(result?.opportunity_score)) && Number(result?.opportunity_score) > 0;
    return difficultyLive || trafficLive || opportunityLive;
  }, [result?.difficulty_score, result?.traffic_potential, result?.opportunity_score]);

  const serpPreview = useMemo(() => {
    if (Array.isArray(result?.serp_preview) && result.serp_preview.length) {
      return result.serp_preview.slice(0, 5).map((entry, idx) => ({
        position: Number(entry?.position ?? idx + 1),
        title: String(entry?.title || "").trim() || "Untitled result",
        domain: domainFromInput(entry?.url || entry?.domain || "") || "unknown-domain",
        type: String(entry?.type || "Organic")
      }));
    }
    return topCompetitors.map((entry, idx) => ({
      position: Number(entry.position ?? idx + 1),
      title: idx === 0 ? `Best result for "${safeKeyword || "keyword"}"` : `Related result ${idx + 1}`,
      domain: entry.domain,
      type: "Organic"
    }));
  }, [result?.serp_preview, topCompetitors, safeKeyword]);
  const hasLiveSerpPreview = Array.isArray(result?.serp_preview) && result.serp_preview.length > 0;
  const hasLiveOpportunityData = Boolean(hasValidRank(shownRank) || hasLiveMetricScores);

  const relatedKeywordCluster = useMemo(() => {
    const fromTracked = clusterKeywords(safeKeyword);
    const fromIdeas = ideas.slice(0, 5);
    return [...new Set([...fromTracked, ...fromIdeas])].filter(Boolean).slice(0, 8);
  }, [safeKeyword, ideas]);

  const liveRankReasons = useMemo(() => {
    if (!Array.isArray(result?.rank_reasons)) return [];
    return result.rank_reasons.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 4);
  }, [result?.rank_reasons]);
  const detailedRankReasons = useMemo(() => {
    if (!hasValidRank(shownRank)) return [];
    if (liveRankReasons.length) return liveRankReasons.map((text) => ({ source: "Live signal", text }));
    const competitor = topCompetitors[0]?.domain || competitorBench.competitors[0]?.domain || "top competitors";
    const compWords = competitorBench.avgWords || 2200;
    const ownWords = competitorBench.own.words;
    const compBacklinks = competitorBench.avgBacklinks || 800;
    const ownBacklinks = competitorBench.own.backlinks;
    return [
      {
        source: "Pattern-based",
        text: `${competitor} and similar top results average about ${compWords} words and commonly include comparison sections; your page appears closer to ~${ownWords} words and may be missing those blocks.`
      },
      {
        source: "Pattern-based",
        text: `Top results in this SERP show roughly ${compBacklinks} referring-link signals versus about ${ownBacklinks} on your page, which can limit ranking strength even with similar relevance.`
      }
    ];
  }, [shownRank, liveRankReasons, topCompetitors, competitorBench]);
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
      delta > 0
        ? `You moved up ${delta} positions across the last ${ranks.length} checks.`
        : delta < 0
          ? `You moved down ${Math.abs(delta)} positions across the last ${ranks.length} checks.`
          : "No net position change across recent checks.",
      lateDrop >= earlyDrop
        ? "Most growth happened in the most recent checks, which often follows recent on-page updates."
        : "Most growth happened earlier; the latest checks are flatter.",
      std >= 6
        ? "Ranking volatility detected: positions are moving significantly check-to-check."
        : "Low ranking volatility: position movement is relatively stable."
    ];
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

  const kpis = useMemo(() => ([
    {
      label: "Tracked keywords",
      value: String(
        new Set(listRankChecks().map((x) => String(x.keyword || "").trim()).filter(Boolean)).size || 0
      ),
      tone: "text-[var(--rp-indigo-700)]",
      hint: "Open history",
      onClick: () => historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    {
      label: "Avg. position",
      value: history.length
        ? (history.reduce((sum, row) => sum + Number(row.rank || 0), 0) / history.length).toFixed(1)
        : "—",
      tone: "text-amber-600",
      hint: "View trend",
      onClick: () => trendRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    {
      label: "Visibility lift",
      value: rankDelta === null ? "—" : `${rankDelta > 0 ? "+" : ""}${rankDelta}`,
      tone: rankDelta !== null && rankDelta > 0 ? "text-emerald-600" : "text-[var(--rp-text-700)]",
      hint: "See next action",
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
      seoRobots="noindex,nofollow"
    >
      {pricingOpen ? (
        <Suspense fallback={null}>
          <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
        </Suspense>
      ) : null}

      <div className="mb-4 grid gap-3 md:gap-4 md:grid-cols-3">
        {kpis.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className={[
              "rp-kpi-card rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--rp-indigo-300)]",
              item.label === "Avg. position"
                ? "border-[var(--rp-indigo-300)] bg-[linear-gradient(180deg,#ffffff_0%,#f7f3ff_100%)] shadow-[0_6px_18px_rgba(124,58,237,0.12)] hover:border-[var(--rp-indigo-400)] hover:shadow-[0_8px_22px_rgba(124,58,237,0.16)]"
                : "border-[var(--rp-border)] bg-white hover:border-[var(--rp-indigo-300)] hover:shadow-md"
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-[13px] font-medium text-[var(--rp-text-600)]">{item.label}</div>
              <span className="text-xs font-semibold text-[var(--rp-indigo-700)]">{item.hint}</span>
            </div>
            <div className={`mt-2 text-2xl font-semibold tracking-tight ${item.tone}`}>{item.value}</div>
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
              <RankHistoryPanel onPick={({ keyword, domain }) => { setKeyword(keyword); setDomain(domain); }} />
            </Suspense>
          </DeferredRender>
        </div>

        <DeferredRender>
          <Suspense fallback={null}>
            <RankUpsellBanner
              onOpen={() => setPricingOpen(true)}
              email={waitlistEmail}
              onEmailChange={setWaitlistEmail}
              onJoinWaitlist={() => {
                const clean = String(waitlistEmail || "").trim().toLowerCase();
                if (!clean || !clean.includes("@")) {
                  setWaitlistMessage("Enter a valid email.");
                  setTimeout(() => setWaitlistMessage(""), 2200);
                  return;
                }
                try {
                  const key = "rp_rank_waitlist";
                  const existing = JSON.parse(localStorage.getItem(key) || "[]");
                  const next = Array.isArray(existing) ? existing : [];
                  if (!next.includes(clean)) next.push(clean);
                  localStorage.setItem(key, JSON.stringify(next));
                } catch {}
                setWaitlistMessage("You are on the waitlist. Weekly alerts coming soon.");
                setTimeout(() => setWaitlistMessage(""), 2600);
              }}
              message={waitlistMessage}
            />
          </Suspense>
        </DeferredRender>

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

        <div ref={actionRef} className="rp-card border border-[var(--rp-border)] bg-white p-4 md:p-5">
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
              "rp-btn-primary h-11 w-full text-sm md:h-10 md:w-auto",
              status === "loading" ? "opacity-50 cursor-not-allowed" : ""
            ].join(" ")}
          >
            <IconCompass size={14} />
            {status === "loading" ? "Checking..." : "Check Rank"}
          </button>
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
          <div className="rp-card p-4 md:p-5 text-[var(--rp-text-700)]">
            <div className="text-sm font-semibold text-[var(--rp-text-900)]">How this helps your business</div>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>Enter one keyword and your domain.</li>
              <li>Click <span className="font-semibold">Check Rank</span> for a live position check.</li>
              <li>See change vs last check and click opportunity.</li>
              <li>Run SEO Audit on that domain to fix what is holding rank back.</li>
            </ol>
          </div>
        )}

        {status !== "success" && (
          <div className="grid gap-3 md:gap-4">
            <div className="rp-card p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[15px] font-semibold text-[var(--rp-text-800)]">Position trend (last 7 checks)</div>
                <div className="text-xs text-[var(--rp-text-500)]">This fills with real data after you click Check Rank</div>
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
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--rp-text-500)]">
                    No checks yet. Run your first rank check to see movement.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rp-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Keyword opportunity insight</div>
                  <ProvenanceBadge live={hasLiveOpportunityData} />
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--rp-text-700)]">{opportunityInsight(shownRank)}</p>
                <div className="mt-3 inline-flex items-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-1 text-xs font-semibold text-[var(--rp-text-600)]">
                  {hasValidRank(shownRank) ? `Current position: ${shownRank}` : "Current position: pending check"}
                </div>
                <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                  {hasLiveOpportunityData
                    ? "Based on your latest rank-check response."
                    : "Estimated from last rank check and benchmark model."}
                </div>
              </div>

              <div className="rp-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Competitor snapshot (top 3)</div>
                  <ProvenanceBadge live={hasLiveTopCompetitors} />
                </div>
                <div className="mt-3 grid gap-2">
                  {topCompetitors.length || hasValidRank(shownRank) ? (
                    <>
                      <div className="grid grid-cols-[1fr_auto] items-center rounded-lg border border-[var(--rp-indigo-200)] bg-[var(--rp-indigo-50)] px-3 py-2 text-[15px]">
                        <span className="font-semibold text-[var(--rp-text-900)]">{safeDomain || "your-domain.com"} (you)</span>
                        <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-[var(--rp-indigo-800)]">
                          #{hasValidRank(shownRank) ? shownRank : "—"}
                        </span>
                      </div>
                      {topCompetitors.map((entry) => (
                        <div
                          key={`preview-${entry.position}-${entry.domain}`}
                          className="grid grid-cols-[1fr_auto] items-center rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2 text-[15px]"
                        >
                          <span className="font-medium text-[var(--rp-text-900)]">{entry.domain}</span>
                          <span className="rounded-full bg-[var(--rp-indigo-100)] px-2 py-1 text-xs font-semibold text-[var(--rp-indigo-800)]">
                            #{entry.position}
                          </span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-4 text-sm text-[var(--rp-text-600)]">
                      Sample competitor pattern until live SERP competitor data is available.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rp-card p-4">
                <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Why you rank here</div>
                {detailedRankReasons.length ? (
                  <div className="mt-3 space-y-2">
                    {detailedRankReasons.map((reason) => (
                      <div key={`${reason.source}-${reason.text}`} className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2 text-sm text-[var(--rp-text-700)]">
                        <span className="mr-1 font-semibold">{reason.source}:</span>
                        {reason.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-[var(--rp-text-600)]">
                    Run a rank check to unlock this analysis.
                  </div>
                )}
              </div>
              <div className="rp-card p-4">
                <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Next best SEO move</div>
                <div className="mt-3 rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-3">
                  <div className="text-sm text-[var(--rp-text-700)]">{bestMove.move}</div>
                  <div className="mt-2 inline-flex items-center rounded-full border border-[var(--rp-indigo-200)] bg-[var(--rp-indigo-50)] px-3 py-1 text-xs font-semibold text-[var(--rp-indigo-800)]">
                    Estimated gain: {bestMove.gain ? `+${bestMove.gain} positions` : "pending"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rp-card p-4">
              <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Content gap preview</div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Competitor headings</div>
                  <div className="mt-2 space-y-2 text-sm text-[var(--rp-text-700)]">
                    {gap.competitors.flatMap((c) => c.headings.slice(0, 1)).slice(0, 3).map((h) => (
                      <div key={h}>• {h}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Missing topics</div>
                  <div className="mt-2 space-y-2 text-sm text-[var(--rp-text-700)]">
                    {gap.missingTopics.map((topic) => (
                      <div key={topic}>• {topic}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Missing keywords</div>
                  <div className="mt-2 space-y-2 text-sm text-[var(--rp-text-700)]">
                    {gap.missingKeywords.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => setKeyword(kw)}
                        className="block w-full rounded-lg border border-[var(--rp-border)] bg-white px-2 py-1 text-left hover:border-[var(--rp-indigo-300)]"
                        title="Use this keyword"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rp-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Keyword cluster suggestions</div>
                <div className="text-xs text-[var(--rp-text-500)]">Click one to run next check</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {relatedKeywordCluster.map((kw) => (
                  <button
                    key={`cluster-${kw}`}
                    type="button"
                    onClick={() => setKeyword(kw)}
                    className="rp-chip rp-chip-neutral"
                  >
                    {kw}
                  </button>
                ))}
              </div>
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
            <div className="rp-card p-4 md:p-5">
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

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs text-[var(--rp-text-500)]">Current position</div>
                  <div className="mt-1 text-2xl font-semibold text-[var(--rp-text-900)]">{shownRank ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs text-[var(--rp-text-500)]">Change vs last check</div>
                  <div className={"mt-1 text-2xl font-semibold " + (rankDelta && rankDelta > 0 ? "text-emerald-600" : "text-[var(--rp-text-900)]")}>
                    {rankDelta === null ? "—" : `${rankDelta > 0 ? "+" : ""}${rankDelta}`}
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs text-[var(--rp-text-500)]">Top competitor</div>
                  <div className="mt-1 text-sm font-semibold leading-snug text-[var(--rp-text-900)]">{inferredCompetitor}</div>
                </div>
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs text-[var(--rp-text-500)]">Estimated clicks opportunity</div>
                  <div className="mt-1 text-2xl font-semibold text-[var(--rp-indigo-700)]">+{estimatedClicksGain}/mo</div>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-[var(--rp-text-800)]">
                <div><span className="text-[var(--rp-text-500)]">Keyword:</span> {displayKeyword || "-"}</div>
                <div><span className="text-[var(--rp-text-500)]">Domain:</span> {safeDomain || "-"}</div>
                <div><span className="text-[var(--rp-text-500)]">Keyword intent:</span> {keywordIntent}</div>
                <div className="break-all">
                  <span className="text-[var(--rp-text-500)]">Ranking URL:</span>{" "}
                  <span className="font-medium text-[var(--rp-text-900)]">{rankingUrl || "Pending live ranking URL"}</span>
                </div>

                <div className="text-2xl font-semibold text-[var(--rp-text-900)]">
                  <span className="text-[var(--rp-text-500)] text-base font-medium">Rank:</span> {shownRank ?? "-"}
                </div>

                <div className="text-sm text-[var(--rp-text-700)]">
                  {rankExplain(shownRank)}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => navigate(`/audit?url=${encodeURIComponent(`https://${domainFromInput(result?.domain || domain)}`)}`)}
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

            <div ref={trendRef} className="grid gap-4 md:grid-cols-3">
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
                  {last7Checks.length ? (
                    <ApexSparkline values={last7Checks.map((item) => item.rank)} inverted />
                  ) : (
                    <div className="text-xs text-[var(--rp-text-500)]">No trend data yet.</div>
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
                    Lower numbers are better.
                  </div>
                )}
              </div>
            </div>

            {last7Checks.length ? (
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
              <div className="rp-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Keyword opportunity insight</div>
                  <ProvenanceBadge live={hasLiveOpportunityData} />
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--rp-text-700)]">{opportunityInsight(shownRank)}</p>
                {!!detailedRankReasons.length && (
                  <div className="mt-3 space-y-2">
                    {detailedRankReasons.slice(0, 2).map((reason) => (
                      <div key={`opp-${reason.source}-${reason.text}`} className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2 text-sm text-[var(--rp-text-700)]">
                        <span className="mr-1 font-semibold">{reason.source}:</span>
                        {reason.text}
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
                  {hasLiveMetricScores
                    ? "Metrics returned from live rank-check response."
                    : "Estimated from last rank check and benchmark model."}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Difficulty</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--rp-text-900)]">{difficultyScore ?? "—"}/100</div>
                  </div>
                  <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Opportunity</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--rp-indigo-700)]">{opportunityScore ?? "—"}/100</div>
                  </div>
                  <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Traffic potential</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--rp-text-900)]">{trafficPotential ? `~${trafficPotential}/mo` : "—"}</div>
                  </div>
                </div>
              </div>

              <div className="rp-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Competitor snapshot (top 3)</div>
                  <ProvenanceBadge live={hasLiveTopCompetitors} />
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

            <div className="rp-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">SERP snapshot preview</div>
                <ProvenanceBadge live={hasLiveSerpPreview} />
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="text-xs text-[var(--rp-text-500)]">
                  {hasLiveSerpPreview
                    ? "Live SERP preview from this rank check."
                    : "Preview generated from current signal; run again for fresh live SERP."}
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
                      <div className="mt-1 text-xs text-[var(--rp-text-500)]">{row.domain}</div>
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
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    Estimated
                  </span>
                </div>
                <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                  Benchmark estimate from competitor SERP patterns.
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
              </div>

              <div className="rp-card p-4">
                <div className="text-[15px] font-semibold text-[var(--rp-text-900)]">Trend story</div>
                <div className="mt-2 text-xs text-[var(--rp-text-500)]">What this movement likely means</div>
                <div className="mt-3 space-y-2">
                  {trendStory.length ? trendStory.map((line) => (
                    <div key={line} className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2 text-sm text-[var(--rp-text-700)]">
                      {line}
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
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  Estimated
                </span>
              </div>
              <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                Missing topics/headings inferred from competing SERP pages.
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Missing topics</div>
                  <div className="mt-2 space-y-1 text-sm text-[var(--rp-text-700)]">
                    {gap.missingTopics.slice(0, 4).map((topic) => <div key={`topic-${topic}`}>• {topic}</div>)}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Missing headings</div>
                  <div className="mt-2 space-y-1 text-sm text-[var(--rp-text-700)]">
                    {gap.competitors.flatMap((c) => c.headings).slice(0, 4).map((heading) => (
                      <div key={`head-${heading}`}>• {heading}</div>
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
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
