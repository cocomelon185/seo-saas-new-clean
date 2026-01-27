import express from "express";

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

app.post("/api/page-report", async (req, res) => {
  try {
    const url = String(req.body?.url || "").trim();
    if (!url) return res.status(400).json({ ok: false, error: "Missing url" });

    const fx = await fetchWithRedirects(url, 10);

    const chain = fx.chain || [];
    const final_url = fx.finalUrl || url;
    const status = fx.finalStatus || 0;
    const html = fx.html || "";
    const content_type = (chain[chain.length - 1]?.content_type || "").toLowerCase();

    const issues = [];
    const quick_wins = [];

    const hasRedirects = chain.some((x) => x.status >= 300 && x.status < 400);
    if (hasRedirects) {
      issues.push(
        mkIssue("http_redirects_present", "fix_next", "Redirects detected", {
          redirect_chain: chain.map((x) => ({ url: x.url, status: x.status, location: x.location })),
        })
      );
    }

    if (status >= 400 || status === 0) {
      issues.push(
        mkIssue("http_status_error", "fix_now", `HTTP status ${status || "unknown"}`, {
          final_url,
          status,
          redirect_chain: chain.map((x) => ({ url: x.url, status: x.status, location: x.location })),
        })
      );
      quick_wins.push(`HTTP status is ${status || "unknown"}`);
    }

    if (!content_type.includes("text/html") && html && html.trim().startsWith("{")) {
      issues.push(
        mkIssue("non_html_content", "fix_next", "Response does not look like HTML", {
          final_url,
          status,
          content_type: chain[chain.length - 1]?.content_type || null,
        })
      );
    }

    const titleRaw = pickFirst(/<title[^>]*>([\s\S]*?)<\/title>/i, html);
    const title = normSpaces(stripTags(titleRaw));
    const titleLen = title.length;

    if (!title) {
      issues.push(mkIssue("missing_title", "fix_now", "Missing <title> tag", { final_url, status }));
      quick_wins.push("Missing <title> tag");
    } else if (titleLen > 60) {
      issues.push(
        mkIssue("title_too_long", "fix_next", "Title tag is too long", {
          title,
          title_len: titleLen,
          final_url,
          status,
        })
      );
      quick_wins.push("Title tag is too long");
    }

    const metaDesc = normSpaces(
      pickFirst(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i, html)
    );

    if (!metaDesc) {
      issues.push(
        mkIssue("missing_meta_description", "fix_next", "Missing meta description", { final_url, status })
      );
      quick_wins.push("Missing meta description");
    }

    const h1Raw = pickFirst(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html);
    const h1 = normSpaces(stripTags(h1Raw));

    if (!h1) {
      issues.push(mkIssue("missing_h1", "fix_next", "Missing H1 heading", { final_url, status }));
      quick_wins.push("Missing H1 heading");
    }

    const robotsMeta = normSpaces(
      pickFirst(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/i, html)
    ).toLowerCase();

    const xRobots = String(chain[chain.length - 1]?.x_robots_tag || "").toLowerCase();
    const isNoindex = robotsMeta.includes("noindex") || xRobots.includes("noindex");

    if (isNoindex) {
      issues.push(
        mkIssue("robots_noindex", "fix_now", "Page is marked noindex", {
          robots_meta: robotsMeta || null,
          x_robots_tag: chain[chain.length - 1]?.x_robots_tag || null,
          final_url,
          status,
        })
      );
      quick_wins.push("Page is marked as noindex");
    }

    const canonicalHref = normSpaces(
      pickFirst(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i, html)
    );

    if (!canonicalHref) {
      issues.push(mkIssue("missing_canonical", "fix_later", "Missing canonical link", { final_url, status }));
    } else {
      issues.push(
        mkIssue("canonical_present", "fix_later", "Canonical present", {
          canonical: safeUrlJoin(final_url, canonicalHref),
          final_url,
          status,
        })
      );
    }

    const score = scoreFromIssues(issues);

    const counts = issues.reduce(
      (acc, it) => {
        const k = String(it.priority || "");
        if (k === "fix_now") acc.fix_now += 1;
        else if (k === "fix_next") acc.fix_next += 1;
        else acc.fix_later += 1;
        acc.total += 1;
        return acc;
      },
      { fix_now: 0, fix_next: 0, fix_later: 0, total: 0 }
    );

    return res.json({
      ok: true,
      url,
      final_url,
      status,
      score,
      counts,
      quick_wins,
      issues,
      evidence: {
        title,
        title_len: titleLen,
        meta_description: metaDesc,
        h1,
        robots_meta: robotsMeta || null,
        x_robots_tag: chain[chain.length - 1]?.x_robots_tag || null,
        canonical: canonicalHref ? safeUrlJoin(final_url, canonicalHref) : null,
        redirect_chain: chain.map((x) => ({ url: x.url, status: x.status, location: x.location })),
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/api/rank-check", (req, res) => {
  const { keyword, domain } = req.body || {};

  if (!keyword || !domain) {
    return res.status(400).json({ error: "Missing keyword or domain" });
  }

  return res.json({
    keyword,
    domain,
    position: Math.floor(Math.random() * 50) + 1,
    checked_at: new Date().toISOString()
  });
});


const PORT = 3001;
app.listen(PORT, () => console.log("DEV API running on port", PORT));
