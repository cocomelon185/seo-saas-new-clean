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
  if (debug) { debug.html_len = html.length; }


  const title = pickFirst(/<title[^>]*>([\s\S]*?)<\/title>/i, html).trim();
  const metaDesc = pickFirst(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i, html).trim();
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

  if (status >= 400) {
    issues.push(mkIssue("http_status_error", { status, final_url }, { title: `HTTP status ${status}`, priority: "fix_now" }));
  }

  const score = Math.max(0, 100 - (issues.length * 10));

  return {
    ok: true,
    url,
    final_url,
    status,
    score,
    quick_wins,
    issues,
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
      external_links_count: externalLinks
    }
  };
}
