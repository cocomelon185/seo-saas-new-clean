import { getIssueDef } from "./issuesCatalog.js";
function mkIssue(issue_id, evidence = {}, extra = {}) {
  const def = getIssueDef(issue_id) || {};
  return {
    issue_id,
    title: def.title || extra.title || issue_id,
    priority: def.priority || extra.priority || "fix_later",
    why: def.why || extra.why || "",
    what: def.what || extra.what || "",
    example_fix: def.example_fix || extra.example_fix || "",
    evidence: evidence || {}
  };
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pickFirst(re, html) {
  const m = re.exec(html);
  return m ? m[1] : "";
}

function cleanDomain(rawUrl) {
  try {
    const host = new URL(rawUrl).hostname || "";
    return host.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function detectPageType({ url = "", title = "", h1 = "", meta = "" }) {
  const text = `${url} ${title} ${h1} ${meta}`.toLowerCase();
  if (text.includes("pricing") || text.includes("plans") || text.includes("cost")) return "pricing";
  if (text.includes("case study") || text.includes("customer story")) return "case-study";
  if (text.includes("blog") || text.includes("article") || text.includes("guide")) return "blog";
  if (text.includes("docs") || text.includes("documentation") || text.includes("api reference")) return "docs";
  if (text.includes("feature") || text.includes("features") || text.includes("how it works")) return "feature";
  if (text.includes("comparison") || text.includes("vs")) return "comparison";
  if (text.includes("about")) return "about";
  if (text.includes("contact")) return "contact";
  if (text.includes("home") || text.includes("homepage") || text.trim() === "/") return "homepage";
  return "landing";
}

function pageTypeAdvice(pageType) {
  const map = {
    pricing: [
      "Lead with value and who the plan is for before the price.",
      "Call out what is included vs. not included.",
      "Reinforce proof (logos, results, or short testimonials)."
    ],
    "case-study": [
      "Open with the measurable outcome (traffic, leads, revenue).",
      "Show the starting problem, the fix, and the results timeline.",
      "Include a quote or proof point near the conclusion."
    ],
    blog: [
      "Use a clear problem/solution structure with H2 sections.",
      "Add 2–3 concrete examples or screenshots.",
      "Summarize the next step with a CTA at the end."
    ],
    docs: [
      "Start with the user intent and a quick answer.",
      "Use short sections with code or UI examples.",
      "Link to related docs or tutorials."
    ],
    feature: [
      "Explain the benefit before the feature list.",
      "Show a workflow or 3‑step usage example.",
      "Close with a CTA focused on the feature value."
    ],
    comparison: [
      "State the primary differentiation in the first paragraph.",
      "Use a short comparison table or bullets.",
      "Offer a clear recommendation for who the product is for."
    ],
    about: [
      "Clarify mission + audience in the first two lines.",
      "Add proof: milestones, customers, or traction.",
      "End with a trust CTA (book demo, contact)."
    ],
    contact: [
      "Make the primary contact method the focal CTA.",
      "Add expected response time and support hours.",
      "Offer a secondary option (email or demo)."
    ],
    homepage: [
      "Lead with the single strongest value proposition.",
      "Show proof and outcomes above the fold.",
      "Repeat the main CTA after feature highlights."
    ],
    landing: [
      "Match the headline to the exact search intent.",
      "Use 3–5 benefit bullets and a proof block.",
      "End with a crisp CTA and low‑friction promise."
    ]
  };
  return map[pageType] || map.landing;
}

function buildContentBrief({ pageType, title, h1, domain }) {
  const intentMap = {
    pricing: "Transactional",
    "case-study": "Commercial",
    blog: "Informational",
    docs: "Informational",
    feature: "Commercial",
    comparison: "Commercial",
    about: "Informational",
    contact: "Navigational",
    homepage: "Commercial",
    landing: "Commercial"
  };
  const intent = intentMap[pageType] || "Informational";
  const brand = domain ? domain.split(".")[0] : "Your Brand";
  const headline = h1 || title || "SEO audit landing page";
  const outline = [
    `H1: ${headline}`,
    "H2: Problem the visitor is trying to solve",
    "H2: Your solution + 3 key benefits",
    "H2: Proof (logos, numbers, testimonials)",
    "H2: How it works (3 steps)",
    "H2: FAQs",
    "H2: Clear CTA and low-friction promise"
  ];
  return [
    `Starter brief (auto-generated)`,
    `User intent: ${intent}`,
    `Angle: Lead with the core outcome in the first two lines.`,
    `Suggested sections:`,
    ...outline.map((line) => `- ${line}`),
    `Competitor outline: Emphasize outcomes, proof, and a single CTA.`,
    `CTA example: "Start a free audit" or "Book a demo".`
  ].join("\n");
}

function rewriteExamples({ pageType, title, h1, meta, domain }) {
  const brand = domain ? domain.split(".")[0] : "Your Brand";
  const base = {
    title: title || "Missing title",
    h1: h1 || "Missing H1",
    meta: meta || "Missing meta description"
  };

  const templates = {
    pricing: {
      title: `${brand} Pricing — Clear plans for growing teams`,
      h1: `Choose a plan that fits your growth`,
      meta: `Compare ${brand} plans, see what’s included, and pick the right level for your team.`
    },
    blog: {
      title: `${brand} Blog — Actionable SEO strategies and examples`,
      h1: `SEO strategies you can ship this week`,
      meta: `Tactical SEO guides, examples, and fixes you can apply immediately.`
    },
    docs: {
      title: `${brand} Docs — Get set up in minutes`,
      h1: `Documentation and quick start`,
      meta: `Learn how to set up ${brand} quickly with practical examples and common fixes.`
    },
    feature: {
      title: `${brand} Features — Prioritized SEO fixes in minutes`,
      h1: `Everything you need to fix SEO fast`,
      meta: `See the core features that turn audits into clear, prioritized fixes.`
    },
    comparison: {
      title: `${brand} vs alternatives — Which SEO tool fits you`,
      h1: `How ${brand} compares`,
      meta: `Compare ${brand} with common alternatives and see which is best for your goals.`
    },
    "case-study": {
      title: `${brand} Case Study — Measurable SEO wins`,
      h1: `How a team grew organic traffic`,
      meta: `A real example of the fixes that improved rankings and conversions.`
    },
    about: {
      title: `About ${brand} — Built to make SEO simpler`,
      h1: `We make SEO clear and actionable`,
      meta: `Learn why ${brand} exists and how we help teams ship SEO fixes faster.`
    },
    contact: {
      title: `Contact ${brand} — Get help fast`,
      h1: `Talk to the ${brand} team`,
      meta: `Reach the ${brand} team for support, demos, or partnerships.`
    },
    homepage: {
      title: `${brand} — Instant SEO audits with clear fixes`,
      h1: `SEO clarity in one scan`,
      meta: `Run an instant SEO audit and get prioritized fixes you can ship today.`
    },
    landing: {
      title: `${brand} — Instant SEO audit with prioritized fixes`,
      h1: `Turn one URL into a fix plan`,
      meta: `Get a fast SEO audit, clear priorities, and plain‑language fixes.`
    }
  };

  const pick = templates[pageType] || templates.landing;

  return [
    { label: "Title", before: base.title, after: pick.title, note: "Keep 30–60 characters and lead with the core benefit." },
    { label: "Meta description", before: base.meta, after: pick.meta, note: "Aim for 140–160 characters with a clear outcome." },
    { label: "H1", before: base.h1, after: pick.h1, note: "Use a single, descriptive H1 aligned to the intent." },
    {
      label: "Opening line",
      before: "Missing or unclear opening.",
      after: `Get a clear SEO audit in minutes with ${brand} — see the top fixes and next steps.`,
      note: "Lead with outcome + timeframe + trust cue."
    },
    {
      label: "CTA",
      before: "Generic CTA",
      after: "Start a free SEO audit",
      note: "Use a single action CTA tied to value."
    }
  ];
}

export async function buildPageReport(url, debug = null) {
  const r = await fetch(url, { redirect: "follow" });
  if (debug) {
    debug.fetch_status = r.status;
      debug.final_status = r.status;
    debug.final_url = r.url;
    debug.content_type = r.headers.get("content-type");
  }

  const status = r.status;
  const final_url = r.url || url;
  const html = await r.text();

  let cwv = null;
  try {
    const apiKey = process.env.PAGESPEED_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY;
    if (apiKey) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(final_url)}&strategy=mobile&key=${apiKey}`;
        const psiRes = await fetch(psiUrl, { signal: controller.signal });
        if (psiRes.ok) {
          const psi = await psiRes.json();
          const field = psi?.loadingExperience?.metrics || psi?.originLoadingExperience?.metrics || null;
          const labAudits = psi?.lighthouseResult?.audits || null;

          const fieldLcp = field?.LARGEST_CONTENTFUL_PAINT_MS?.percentile;
          const fieldInp = field?.INTERACTION_TO_NEXT_PAINT_MS?.percentile;
          const fieldCls = field?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile;

          const labLcp = labAudits?.["largest-contentful-paint"]?.numericValue;
          const labInp = labAudits?.["interaction-to-next-paint"]?.numericValue;
          const labCls = labAudits?.["cumulative-layout-shift"]?.numericValue;

          cwv = {
            source: "psi",
            field: {
              lcp: typeof fieldLcp === "number" ? Math.round(fieldLcp) / 1000 : null,
              inp: typeof fieldInp === "number" ? Math.round(fieldInp) : null,
              cls: typeof fieldCls === "number" ? Math.round(fieldCls) / 100 : null
            },
            lab: {
              lcp: typeof labLcp === "number" ? Math.round(labLcp) / 1000 : null,
              inp: typeof labInp === "number" ? Math.round(labInp) : null,
              cls: typeof labCls === "number" ? Math.round(labCls * 1000) / 1000 : null
            }
          };
        }
      } finally {
        clearTimeout(timer);
      }
    }
  } catch {}

  const title = pickFirst(/<title[^>]*>([\s\S]*?)<\/title>/i, html).trim();

  const h1 = pickFirst(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html).replace(/<[^>]+>/g, "").trim();

    // Extract canonical (handles unquoted/quoted attributes and multiple rel tokens)
    let canonical = "";
    const linkTags = html.match(/<link[^>]*>/gi) || [];
    for (const tag of linkTags) {
      const relMatch = tag.match(/\brel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      if (!relMatch) continue;

      const relValue = (relMatch[1] || relMatch[2] || relMatch[3] || "").trim();
      if (!/\bcanonical\b/i.test(relValue)) continue;

      const hrefMatch = tag.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      if (!hrefMatch) continue;

      const hrefValue = (hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || "").trim();
      if (!hrefValue) continue;

      canonical = hrefValue;
      break;
    }

  // Count H1s
  const h1Matches = html.match(/<h1[^>]*>/gi) || [];
  const h1Count = h1Matches.length;
  
  // Extract body text for word count
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
  const wordCount = bodyText ? bodyText.split(/\s+/).filter(w => w.length > 0).length : 0;
  
  // Count links
  const allLinks = html.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
  let internalLinks = 0;
  let externalLinks = 0;
  const internalLinkPaths = [];
  var internalLinkDepthAvg = null;
  var internalLinkDepthMax = null;
  try {
    const baseUrlObj = new URL(final_url);
    for (const linkTag of allLinks) {
      const hrefMatch = linkTag.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) continue;
      const href = hrefMatch[1].trim();
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) continue;
      try {
        const linkUrl = new URL(href, final_url);
        if (linkUrl.hostname === baseUrlObj.hostname || linkUrl.hostname === "") {
          internalLinks++;
          if (internalLinkPaths.length < 100) {
            internalLinkPaths.push(linkUrl.pathname || "/");
          }
        } else {
          externalLinks++;
        }
      } catch {
        // Invalid URL, skip
      }
    }
  } catch {
    // If URL parsing fails, just count all as external
    externalLinks = allLinks.length;
  }

  // Meta description (robust): meta tags in <head>, fallback to first <p>
  let metaDesc = "";

  const headMatch2 = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headHtml2 = headMatch2 ? headMatch2[1] : "";
  const metaTags2 = headHtml2.match(/<meta\b[^>]*>/gi) || [];

  const getKey2 = (tag) =>
    (tag.match(/\bname=["']?([^"'\s>]+)/i)?.[1]?.toLowerCase() ||
      tag.match(/\bproperty=["']?([^"'\s>]+)/i)?.[1]?.toLowerCase() ||
      tag.match(/\bitemprop=["']?([^"'\s>]+)/i)?.[1]?.toLowerCase() ||
      "");

  const getContent2 = (tag) =>
    (
      tag.match(/\bcontent\s*=\s*"([^"]*)"/i)?.[1] ??
      tag.match(/\bcontent\s*=\s*'([^']*)'/i)?.[1] ??
      tag.match(/\bcontent\s*=\s*([^\s>]+)/i)?.[1] ??
      ""
    ).trim();

  for (const tag of metaTags2) {
    const key = getKey2(tag);
    if (key === "description" || key === "og:description" || key === "twitter:description") {
      const c = getContent2(tag);
      if (c) { metaDesc = c; break; }
    }
  }

  if (!metaDesc) {
    const pMatch2 = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    const pText2 = pMatch2 ? pMatch2[1].replace(/<[^>]+>/g, " ") : "";
    const cleaned2 = pText2.replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
    metaDesc = cleaned2.slice(0, 160);
  }

  const pageType = detectPageType({ url: final_url, title, h1, meta: metaDesc });
  const domain = cleanDomain(final_url);
  const rewrite_examples = rewriteExamples({ pageType, title, h1, meta: metaDesc, domain });
  const page_type_advice = pageTypeAdvice(pageType);
  const content_brief = buildContentBrief({ pageType, title, h1, domain });

  const quick_wins = [];
  const issues = [];

  if (!title) {
    quick_wins.push("Missing <title> tag");
    issues.push(mkIssue("missing_title", { status, final_url }));
  } else if (title.length > 60) {
    quick_wins.push("Title tag is too long");
    issues.push(mkIssue("title_too_long", { title, title_len: title.length, status, final_url }));
  }

  if (!metaDesc) {
    quick_wins.push("Missing meta description");
    issues.push(mkIssue("missing_meta_description", { status, final_url }));
  }

  if (!h1) {
    quick_wins.push("Missing H1 heading");
    issues.push(mkIssue("missing_h1", { status, final_url }));
  }

  if (!canonical) {
    quick_wins.push("Missing canonical tag");
    issues.push(mkIssue("no_canonical", { status, final_url, canonical: canonical || "" }));
  }

  if (status >= 400) {
    issues.push(mkIssue("http_status_error", { status, final_url }, { title: `HTTP status ${status}`, priority: "fix_now" }));
  }

  const depthValues = internalLinkPaths.map((p) => {
    const parts = String(p || "").split("/").filter(Boolean);
    return parts.length;
  });
  internalLinkDepthAvg = depthValues.length
    ? Math.round((depthValues.reduce((a, b) => a + b, 0) / depthValues.length) * 10) / 10
    : null;
  internalLinkDepthMax = depthValues.length ? Math.max(...depthValues) : null;

  const weightMap = {
    missing_title: 25,
    missing_meta_description: 20,
    missing_h1: 20,
    no_canonical: 15,
    title_too_long: 8,
    multiple_h1: 6,
    http_status_error: 30
  };
  const defaultPenalty = 6;
  const penalty = issues.reduce((acc, issue) => {
    const key = String(issue?.issue_id || "");
    const weight = Object.prototype.hasOwnProperty.call(weightMap, key) ? weightMap[key] : defaultPenalty;
    return acc + weight;
  }, 0);
  let score = Math.max(0, Math.min(100, 100 - penalty));

  // Stricter, industry-style realism penalties (content + structure + performance)
  if (wordCount < 200) score -= 15;
  else if (wordCount < 450) score -= 8;

  if (internalLinks < 5) score -= 10;
  else if (internalLinks < 12) score -= 6;

  if (typeof internalLinkDepthAvg === "number" && internalLinkDepthAvg > 2.5) score -= 8;

  if (cwv && (cwv.field || cwv.lab)) {
    const lcp = cwv.field?.lcp ?? cwv.lab?.lcp ?? null;
    const inp = cwv.field?.inp ?? cwv.lab?.inp ?? null;
    const cls = cwv.field?.cls ?? cwv.lab?.cls ?? null;
    if (typeof lcp === "number" && lcp > 4) score -= 14;
    else if (typeof lcp === "number" && lcp > 2.5) score -= 8;
    if (typeof inp === "number" && inp > 500) score -= 14;
    else if (typeof inp === "number" && inp > 200) score -= 8;
    if (typeof cls === "number" && cls > 0.25) score -= 10;
    else if (typeof cls === "number" && cls > 0.1) score -= 6;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Force metaDesc to be computed right before evidence is built (meta tags in <head>, fallback to first <p>)
  {
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const headHtml = headMatch ? headMatch[1] : "";
    const metaTags = headHtml.match(/<meta\b[^>]*>/gi) || [];

    const getKey = (tag) =>
      (tag.match(/\bname=["']?([^"'\s>]+)/i)?.[1]?.toLowerCase() ||
        tag.match(/\bproperty=["']?([^"'\s>]+)/i)?.[1]?.toLowerCase() ||
        tag.match(/\bitemprop=["']?([^"'\s>]+)/i)?.[1]?.toLowerCase() ||
        "");

    const getContent = (tag) =>
      (
        tag.match(/\bcontent\s*=\s*"([^"]*)"/i)?.[1] ??
        tag.match(/\bcontent\s*=\s*'([^']*)'/i)?.[1] ??
        tag.match(/\bcontent\s*=\s*([^\s>]+)/i)?.[1] ??
        ""
      ).trim();

    metaDesc = "";
    for (const tag of metaTags) {
      const key = getKey(tag);
      if (key === "description" || key === "og:description" || key === "twitter:description") {
        const c = getContent(tag);
        if (c) { metaDesc = c; break; }
      }
    }

  if (!metaDesc) {
      const pBlocks = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || [];
      for (const pb of pBlocks) {
        const inner = pb.replace(/^<p\b[^>]*>/i, "").replace(/<\/p>$/i, "");
        const text = inner
          .replace(/<[^>]+>/g, " ")
          .replace(/\[[^\]]*\]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (text && text.length >= 40) {
          metaDesc = text.slice(0, 160);
          break;
        }
      }
    }
  }

  return {
    ok: true,
    url,
    final_url,
    status,
    score,
    quick_wins,
    issues,
    cwv,
    evidence: {
      title: escapeHtml(title),
      title_char_count: title.length,
      meta_description: escapeHtml(metaDesc),
      meta_description_char_count: metaDesc.length,
      h1: escapeHtml(h1),
      h1_count: h1Count,
      canonical: canonical,
      word_count: wordCount,
      internal_links_count: internalLinks,
      external_links_count: externalLinks,
      internal_link_depth_avg: internalLinkDepthAvg,
      internal_link_depth_max: internalLinkDepthMax,
      __probe_metaDesc_post: metaDesc,
      __probe_metaDesc_post_len: metaDesc.length
    },
    page_type: pageType,
    page_type_advice,
    rewrite_examples,
    content_brief
  };
}
