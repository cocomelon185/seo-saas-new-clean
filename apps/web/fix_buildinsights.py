from pathlib import Path
import re

p = Path("src/views/Audit.jsx")
s = p.read_text(errors="ignore")

start = s.find("function buildInsights")
if start == -1:
    raise SystemExit("❌ buildInsights() not found in src/views/Audit.jsx")

# find the end of the function by locating the next "}" after "return {"
# safer: replace from "function buildInsights" up to the next "\n}\n" after it
m = re.search(r'function buildInsights[\s\S]*?\n}\n', s[start:])
if not m:
    raise SystemExit("❌ Could not locate end of buildInsights() function")

old_block = m.group(0)

new_block = r'''function buildInsights(data) {
  const issues = [];
  const recs = [];

  const url = String(data?.url || "");
  const title = String(data?.title || "");
  const h1 = String(data?.h1 || "");
  const htmlBytes = Number(data?.htmlBytes || 0);

  const titleLen = title.trim().length;
  const hasH1 = h1.trim().length > 0;

  // URL / HTTPS checks
  if (!url) {
    issues.push({ severity: "high", msg: "URL missing in result payload." });
  } else {
    if (url.startsWith("http://")) {
      issues.push({ severity: "med", msg: "Site is using HTTP (not HTTPS)." });
      recs.push("Use HTTPS site-wide and redirect HTTP → HTTPS.");
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      recs.push("Use a full URL (https://example.com) to avoid redirects and mixed results.");
    }
  }

  // Title checks
  if (titleLen === 0) {
    issues.push({ severity: "high", msg: "Missing <title> tag." });
    recs.push("Add a unique page title (50–60 characters is a good target).");
  } else {
    if (titleLen < 25) {
      issues.push({ severity: "low", msg: `Title looks short (${titleLen} chars).` });
      recs.push("Consider expanding the title to be more descriptive (aim ~50–60 chars).");
    }
    if (titleLen > 65) {
      issues.push({ severity: "med", msg: `Title may be too long (${titleLen} chars) and could truncate in search.` });
      recs.push("Shorten the title to ~50–60 chars while keeping key terms.");
    }
  }

  // H1 checks
  if (!hasH1) {
    issues.push({ severity: "high", msg: "Missing H1 heading." });
    recs.push("Add exactly one clear H1 describing the page topic.");
  } else if (h1.trim().length < 10) {
    issues.push({ severity: "low", msg: "H1 looks very short." });
    recs.push("Make the H1 more specific to the page intent.");
  }

  // HTML size check (very rough)
  if (htmlBytes > 1200000) {
    issues.push({ severity: "med", msg: `HTML is large (${htmlBytes.toLocaleString()} bytes).` });
    recs.push("Reduce HTML bloat: remove unused components, defer non-critical content, and avoid rendering huge menus/server data inline.");
  }

  // Baseline recs
  recs.push("Ensure meta description is present and unique per page.");
  recs.push("Add internal links to key pages (helps crawl + relevance).");
  recs.push("Run a Lighthouse / Core Web Vitals check after UI changes.");

  const uniqRecs = Array.from(new Set(recs));
  return { issues, recs: uniqRecs, titleLen, hasH1, htmlBytes };
}
'''

s2 = s[:start] + s[start:].replace(old_block, new_block + "\n", 1)
p.write_text(s2)
print("✅ Replaced buildInsights() with valid JavaScript")
