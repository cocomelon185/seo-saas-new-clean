import express from "express";
import pageReport from "../../api/page-report.js";
import { consumeFreeScanCreditForRequest } from "./lib/freeUsageStore.js";
import embedLead, {
  listEmbedLeads,
  getEmbedLead,
  updateEmbedLead
} from "./api/embed-lead.js";

const app = express();
app.use(express.json());

app.get("/__ping__", (req, res) => res.json({ ok: true }));

const ISSUE_COPY = {
  http_status_error: {
    severity: "High",
    impact: ["Indexing", "Availability"],
    why: "Non-200 responses prevent indexing and waste crawl budget.",
    example_fix: "Ensure the URL returns 200 OK (fix routing, server errors, or missing pages).",
  },
  http_redirects_present: {
    severity: "Medium",
    impact: ["Indexing", "Crawl Efficiency"],
    why: "Redirect chains slow crawlers and can dilute signals; long chains may break.",
    example_fix: "Reduce to a single 301 hop where possible and avoid redirect loops.",
  },
  missing_title: {
    severity: "High",
    impact: ["CTR", "Relevance"],
    why: "Title tags are a primary relevance signal and are often used as the SERP headline.",
    example_fix: "Add a unique, descriptive <title> (~50–60 chars) targeting the main intent.",
  },
  title_too_long: {
    severity: "Medium",
    impact: ["CTR"],
    why: "Overlong titles are truncated in search results and may reduce click-through.",
    example_fix: "Rewrite to ~50–60 chars; keep the core keyword near the front.",
  },
  missing_meta_description: {
    severity: "Low",
    impact: ["CTR"],
    why: "Descriptions influence CTR and help search engines understand page intent.",
    example_fix: "Add a compelling 140–160 char description with benefits + keyword.",
  },
  missing_h1: {
    severity: "Medium",
    impact: ["Relevance", "UX"],
    why: "H1 helps clarify the page topic and improves content structure for users.",
    example_fix: "Add a single, descriptive <h1> matching the page’s primary topic.",
  },
  robots_noindex: {
    severity: "High",
    impact: ["Indexing"],
    why: "noindex prevents the page from appearing in search results.",
    example_fix: "Remove noindex (meta robots / X-Robots-Tag) if the page should rank.",
  },
  missing_canonical: {
    severity: "Medium",
    impact: ["Duplicates", "Indexing"],
    why: "Canonicals help consolidate duplicates and prevent index bloat.",
    example_fix: "Add <link rel='canonical' href='https://preferred-url' /> for the primary version.",
  },
  canonical_present: {
    severity: "Low",
    impact: ["Duplicates"],
    why: "Canonical is set; verify it points to the preferred, indexable URL.",
    example_fix: "Ensure canonical is absolute, 200 OK, and not noindexed/redirected.",
  },
  non_html_content: {
    severity: "Medium",
    impact: ["Rendering", "Indexing"],
    why: "Non-HTML responses can’t be evaluated for on-page tags and may be misconfigured.",
    example_fix: "Serve HTML for content pages; verify content-type and rendering path.",
  },
};


app.get("/__test__/all-bad", (req, res) => {
  res.type("html").send(`<!doctype html>
<html>
  <head>
    <title>This is a deliberately very long SEO title that exceeds sixty characters to trigger the title too long detector</title>
  </head>
  <body>
    <p>No meta description and no H1.</p>
  </body>
</html>`);
});

app.get("/__test__/redirect", (req, res) => {
  res.redirect(301, "/__test__/all-bad");
});


app.get("/__test__/canonical", (req, res) => {
  res.type("html").send(`<!doctype html>
<html>
  <head>
    <title>Canonical Page</title>
    <meta name="description" content="Has canonical and metadata.">
    <link rel="canonical" href="/__test__/canonical-target">
  </head>
  <body>
    <h1>Canonical</h1>
    <p>Has a canonical link.</p>
  </body>
</html>`);
});
app.get("/__test__/canonical-target", (req, res) => {
  res.type("html").send(`<!doctype html>
<html>
  <head>
    <title>Canonical Target</title>
  </head>
  <body>
    <h1>Target</h1>
  </body>
</html>`);
});


app.get("/__test__/noindex", (req, res) => {
  res.type("html").send(`<!doctype html>
<html>
  <head>
    <title>Noindex Page</title>
    <meta name="robots" content="noindex, nofollow">
  </head>
  <body>
    <h1>Noindex</h1>
    <p>This page should be flagged as noindex.</p>
  </body>
</html>`);
});



function normSpaces(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function pickFirst(re, html) {
  const m = re.exec(html);
  return m ? m[1] : "";
}

function stripTags(s) {
  return String(s || "").replace(/<[^>]+>/g, "");
}

function safeUrlJoin(base, loc) {
  try {
    return new URL(loc, base).toString();
  } catch {
    return String(loc || "");
  }
}

async function fetchWithRedirects(startUrl, maxHops = 10) {
  const chain = [];
  let cur = startUrl;

  for (let i = 0; i < maxHops; i++) {
    const r = await fetch(cur, { redirect: "manual" });
    const status = r.status;
    const headers = r.headers;

    const loc = headers.get("location");
    chain.push({
      url: cur,
      status,
      location: loc || null,
      content_type: headers.get("content-type") || null,
      x_robots_tag: headers.get("x-robots-tag") || null,
    });

    if (status >= 300 && status < 400 && loc) {
      cur = safeUrlJoin(cur, loc);
      continue;
    }

    const body = await r.text();
    return { finalUrl: cur, finalStatus: status, finalHeaders: headers, html: body, chain };
  }

  return {
    finalUrl: cur,
    finalStatus: 0,
    finalHeaders: new Headers(),
    html: "",
    chain,
    error: "Too many redirects",
  };
}

function mkIssue(issue_id, priority, title, evidence, why = "", example_fix = "") {
  const c = ISSUE_COPY[issue_id] || {};
  const sevDefault = (priority === "fix_now") ? "High" : (priority === "fix_next") ? "Medium" : "Low";
  return {
    issue_id,
    priority,
    severity: String(c.severity || sevDefault),
    impact: Array.isArray(c.impact) ? c.impact : (c.impact ? [String(c.impact)] : []),
    title,
    why: String(why || c.why || ""),
    example_fix: String(example_fix || c.example_fix || ""),
    evidence: evidence || {},
  };
}



function scoreFromIssues(issues) {
  const w = { fix_now: 18, fix_next: 10, fix_later: 6 };
  const penalty = issues.reduce((s, it) => s + (w[it.priority] || 8), 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  return score;
}

app.post("/api/page-report", pageReport);
app.post("/api/embed/lead", embedLead);
app.get("/api/embed/leads", listEmbedLeads);
app.get("/api/embed/leads/:id", getEmbedLead);
app.post("/api/embed/leads/:id", updateEmbedLead);

const RANK_WINDOW_MS = 24 * 60 * 60 * 1000;
const RANK_MAX_CHECKS_PER_SCOPE = 30;
const rankCheckScopeCache = new Map();

function normalizeScopeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function toScopeKey({ keyword, domain, country, city, device, language }) {
  return [
    normalizeScopeValue(keyword),
    normalizeScopeValue(domain),
    normalizeScopeValue(country),
    normalizeScopeValue(city),
    normalizeScopeValue(device),
    normalizeScopeValue(language)
  ].join("|");
}

function toTimestampMs(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : null;
}

function deriveRankMetrics(checks, nowMs, fallbackPosition) {
  const sorted = (Array.isArray(checks) ? checks : [])
    .map((item) => ({
      position: Number(item?.position),
      checkedAtMs: toTimestampMs(item?.checked_at)
    }))
    .filter((item) => Number.isFinite(item.position) && Number.isFinite(item.checkedAtMs))
    .sort((a, b) => a.checkedAtMs - b.checkedAtMs);

  let positions = sorted.map((item) => item.position);
  if (!positions.length && Number.isFinite(Number(fallbackPosition))) {
    positions = [Number(fallbackPosition)];
  }

  const sampleCount = positions.length;
  const min = sampleCount ? Math.min(...positions) : null;
  const max = sampleCount ? Math.max(...positions) : null;
  const first = sampleCount ? positions[0] : null;
  const last = sampleCount ? positions[sampleCount - 1] : null;
  const delta = Number.isFinite(first) && Number.isFinite(last) ? first - last : 0;

  let direction = "stable";
  if (delta >= 2) direction = "up";
  if (delta <= -2) direction = "down";

  const latestCheckMs = sorted.length ? sorted[sorted.length - 1].checkedAtMs : nowMs;
  const recencyMs = Number.isFinite(latestCheckMs) ? nowMs - latestCheckMs : Number.POSITIVE_INFINITY;
  const rangeWidth = Number.isFinite(min) && Number.isFinite(max) ? max - min : null;

  let confidenceScore = 0;
  const confidenceReasons = [];
  if (sampleCount >= 4) {
    confidenceScore += 2;
    confidenceReasons.push("sample_count_high");
  } else if (sampleCount >= 2) {
    confidenceScore += 1;
    confidenceReasons.push("sample_count_medium");
  } else {
    confidenceReasons.push("sample_count_low");
  }
  if (Number.isFinite(rangeWidth) && rangeWidth <= 3) {
    confidenceScore += 1;
    confidenceReasons.push("range_tight");
  }
  if (recencyMs <= 6 * 60 * 60 * 1000) {
    confidenceScore += 1;
    confidenceReasons.push("fresh_signal");
  }

  let confidence = "low";
  if (confidenceScore >= 4) confidence = "high";
  else if (confidenceScore >= 2) confidence = "medium";

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
    confidence,
    confidence_reasons: confidenceReasons
  };
}

function slugifyKeyword(keyword) {
  return String(keyword || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function deriveRankingPath(keyword, position) {
  const slug = slugifyKeyword(keyword) || "seo-audit-tool";
  const alternate = slug.includes("-") ? slug.split("-").reverse().join("-") : `${slug}-guide`;
  return Number(position) % 3 === 0 ? `/${alternate}` : `/${slug}`;
}

app.post("/api/rank-check", (req, res) => {
  const {
    keyword,
    domain,
    country = "US",
    city = "",
    device = "desktop",
    language = "en",
    force_fresh = false
  } = req.body || {};

  if (!keyword || !domain) {
    return res.status(400).json({ error: "Missing keyword or domain" });
  }

  const creditGate = consumeFreeScanCreditForRequest(req, "rank");
  if (!creditGate.allowed) {
    return res.status(creditGate.status || 402).json({
      ok: false,
      error: {
        code: creditGate.code || "FREE_CREDIT_EXHAUSTED",
        message: creditGate.message || "Your free credit is used. Upgrade to continue."
      },
      upgrade_required: true,
      pricing_url: "/pricing",
      redirect_to: "/pricing",
      free_checks_limit: creditGate.limit ?? 1,
      free_checks_used: creditGate.used ?? 1,
      free_checks_remaining: creditGate.remaining ?? 0
    });
  }

  const cleanKeyword = String(keyword || "").trim();
  const cleanDomain = String(domain || "").trim().toLowerCase();
  const normalizedCountry = String(country || "US").toUpperCase();
  const normalizedCity = String(city || "").trim();
  const normalizedDevice = String(device || "desktop").toLowerCase() === "mobile" ? "mobile" : "desktop";
  const normalizedLanguage = String(language || "en").toLowerCase();
  const scopeKey = toScopeKey({
    keyword: cleanKeyword,
    domain: cleanDomain,
    country: normalizedCountry,
    city: normalizedCity,
    device: normalizedDevice,
    language: normalizedLanguage
  });

  const nowMs = Date.now();
  const cutoffMs = nowMs - RANK_WINDOW_MS;
  const cachedScope = rankCheckScopeCache.get(scopeKey) || { scopeKey, checks: [], last_live_result: null };
  cachedScope.checks = (Array.isArray(cachedScope.checks) ? cachedScope.checks : [])
    .filter((item) => {
      const checkedAtMs = toTimestampMs(item?.checked_at);
      const position = Number(item?.position);
      return Number.isFinite(checkedAtMs) && checkedAtMs >= cutoffMs && Number.isFinite(position);
    })
    .slice(-RANK_MAX_CHECKS_PER_SCOPE);

  const lastLiveCheckedMs = toTimestampMs(cachedScope?.last_live_result?.checked_at);
  const canReuseRecent =
    force_fresh !== true &&
    cachedScope?.last_live_result &&
    Number.isFinite(lastLiveCheckedMs) &&
    nowMs - lastLiveCheckedMs <= RANK_WINDOW_MS;

  let baseResult = cachedScope?.last_live_result || null;
  let servedFromCache = false;

  if (!canReuseRecent) {
    const position = Math.floor(Math.random() * 50) + 1;
    const competitorPool = [
      "ahrefs.com",
      "semrush.com",
      "moz.com",
      "backlinko.com",
      "searchenginejournal.com",
      "seo.com"
    ].filter((d) => d !== cleanDomain);
    const top_competitors = competitorPool.slice(0, 3).map((d, idx) => ({
      domain: d,
      position: idx + 1
    }));

    const difficulty_score = Math.max(1, Math.min(100, Math.round(35 + (100 - position) * 0.45)));
    const opportunity_score = Math.max(1, Math.min(100, Math.round((70 - Math.min(60, position)) + (100 - difficulty_score) * 0.4)));
    const traffic_potential = Math.max(120, Math.round((position <= 10 ? 1400 : 700) + (50 - Math.min(50, position)) * 16));
    const serp_preview = [
      { position: 1, title: `Top result for "${cleanKeyword}"`, domain: top_competitors[0]?.domain || "ahrefs.com", type: "Organic" },
      { position: 2, title: `${cleanKeyword} guide`, domain: top_competitors[1]?.domain || "semrush.com", type: "Organic" },
      { position: 3, title: `${cleanKeyword} checklist`, domain: top_competitors[2]?.domain || "moz.com", type: "Organic" },
      { position: 4, title: `${cleanKeyword} examples`, domain: cleanDomain, type: "Organic" }
    ];
    const ranking_path = deriveRankingPath(cleanKeyword, position);
    const ranking_url = `https://${cleanDomain}${ranking_path}`;

    baseResult = {
      keyword: cleanKeyword,
      domain: cleanDomain,
      country: normalizedCountry,
      city: normalizedCity,
      device: normalizedDevice,
      language: normalizedLanguage,
      position_current: position,
      rank: position,
      position,
      difficulty_score,
      opportunity_score,
      traffic_potential,
      ranking_path,
      ranking_url,
      serp_preview,
      top_competitors,
      checked_at: new Date(nowMs).toISOString()
    };
    cachedScope.last_live_result = baseResult;
  } else {
    servedFromCache = true;
  }

  const canonicalPosition = Number(baseResult?.position_current ?? baseResult?.rank ?? baseResult?.position);
  const observation = {
    position: canonicalPosition,
    checked_at: new Date(nowMs).toISOString(),
    source: servedFromCache ? "cache" : "live"
  };
  if (Number.isFinite(observation.position)) {
    cachedScope.checks.push(observation);
  }
  cachedScope.checks = cachedScope.checks
    .filter((item) => {
      const checkedAtMs = toTimestampMs(item?.checked_at);
      return Number.isFinite(checkedAtMs) && checkedAtMs >= cutoffMs;
    })
    .slice(-RANK_MAX_CHECKS_PER_SCOPE);

  rankCheckScopeCache.set(scopeKey, cachedScope);

  const metrics = deriveRankMetrics(cachedScope.checks, nowMs, canonicalPosition);
  const sourceCheckedAtMs = toTimestampMs(baseResult?.checked_at) || nowMs;
  const response = {
    ...baseResult,
    rank: canonicalPosition,
    position: canonicalPosition,
    position_current: canonicalPosition,
    served_from_cache: servedFromCache,
    cache_expires_at: new Date(sourceCheckedAtMs + RANK_WINDOW_MS).toISOString(),
    ...metrics
  };

  return res.json(response);
});


const PORT = 3001;
app.listen(PORT, () => console.log("DEV API running on port", PORT));
