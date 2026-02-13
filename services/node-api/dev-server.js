import express from "express";
import pageReport from "../../api/page-report.js";

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

app.post("/api/rank-check", (req, res) => {
  const { keyword, domain } = req.body || {};

  if (!keyword || !domain) {
    return res.status(400).json({ error: "Missing keyword or domain" });
  }

  const cleanDomain = String(domain).trim().toLowerCase();
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

  return res.json({
    keyword,
    domain: cleanDomain,
    position,
    top_competitors,
    checked_at: new Date().toISOString()
  });
});


const PORT = 3001;
app.listen(PORT, () => console.log("DEV API running on port", PORT));
