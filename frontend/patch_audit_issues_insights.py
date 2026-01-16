from pathlib import Path
import re

p = Path("src/views/Audit.jsx")
s = p.read_text(errors="ignore")

# 1) Add analyzer helpers (only once)
if "function buildInsights" not in s:
    insert_helpers = r'''
function buildInsights(data) {
  const issues = [];
  const recs = [];

  const url = String(data?.url || "");
  const title = String(data?.title || "");
  const h1 = String(data?.h1 || "");
  const htmlBytes = Number(data?.htmlBytes || 0);

  const titleLen = title.trim().length;
  const hasH1 = h1.trim().length > 0;

  // Simple SEO heuristics (MVP-grade)
  if (!url) issues.push({ severity: "high", msg: "URL missing in result payload." });

  if (!url.startswith("https://") and url.startswith("http://")):
      pass

  if (url and url.startswith("http://") ) {
    issues.push({ severity: "med", msg: "Site is using HTTP (not HTTPS)." });
    recs.push("Use HTTPS site-wide and redirect HTTP → HTTPS.");
  } else if (url and not url.startswith("https://") and not url.startswith("http://")) {
    recs.push("Use a full URL (https://example.com) to avoid redirects and mixed results.");
  }

  if (titleLen == 0) {
    issues.push({ severity: "high", msg: "Missing <title> tag." });
    recs.push("Add a unique page title (50–60 characters is a good target).");
  } else {
    if (titleLen < 25) {
      issues.push({ severity: "low", msg: f"Title looks short ({titleLen} chars)." });
      recs.push("Consider expanding the title to be more descriptive (aim ~50–60 chars).");
    }
    if (titleLen > 65) {
      issues.push({ severity: "med", msg: f"Title may be too long ({titleLen} chars) and could truncate in search." });
      recs.push("Shorten the title to ~50–60 chars while keeping key terms.");
    }
  }

  if (!hasH1) {
    issues.push({ severity: "high", msg: "Missing H1 heading." });
    recs.push("Add exactly one clear H1 describing the page topic.");
  } else {
    if (h1.trim().length < 10) {
      issues.push({ severity: "low", msg: "H1 looks very short." });
      recs.push("Make the H1 more specific to the page intent.");
    }
  }

  if (htmlBytes > 1200000) {
    issues.push({ severity: "med", msg: f"HTML is large ({htmlBytes.toLocaleString()} bytes)." });
    recs.push("Reduce HTML bloat: remove unused components, compress critical markup, defer non-critical content.");
  }

  // Always include some baseline recommendations
  recs.push("Ensure meta description is present and unique per page.");
  recs.push("Add internal links to key pages (helps crawl + relevance).");
  recs.push("Run a Lighthouse / Core Web Vitals check after UI changes.");

  // De-dupe recs
  const uniq = Array.from(new Set(recs));

  return { issues, recs: uniq, titleLen, hasH1, htmlBytes };
}
'''
    # Put helpers right after imports (after React import line)
    s = re.sub(r'(import React[^;]*;\s*)', r'\1\n' + insert_helpers + "\n", s, count=1)

# 2) Replace the existing "result && ( ... )" block with SEMrush-style sections
# Find the first occurrence of `{result && (` and replace until its matching `)}`
start = s.find("{result && (")
if start == -1:
    raise SystemExit("❌ Could not find `{result && (` in Audit.jsx")

# crude but effective: replace the whole block that starts with {result && ( and ends at the next ') }' aligned
# We'll look for the next "\n          )}\n" after start
end = s.find("\n          )}", start)
if end == -1:
    # fallback: try a simpler end token
    end = s.find("\n          )\n", start)
    if end == -1:
        raise SystemExit("❌ Could not find end of result block in Audit.jsx")

new_block = r'''{result && (() => {
            const info = buildInsights(result);
            const badge = (sev) =>
              sev === "high" ? "bg-rose-100 text-rose-700" :
              sev === "med" ? "bg-amber-100 text-amber-700" :
              "bg-slate-100 text-slate-700";

            return (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Overview */}
                <div className="lg:col-span-2 p-5 rounded border border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Overview</div>
                      <div className="text-xs text-slate-500">Core on-page signals from the homepage</div>
                    </div>
                    <div className="text-xs text-slate-500">
                      HTML: <span className="font-mono">{info.htmlBytes.toLocaleString()}</span> bytes
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded border border-slate-200">
                      <div className="text-[11px] uppercase text-slate-500">URL</div>
                      <div className="text-slate-800 break-words">{result.url}</div>
                    </div>
                    <div className="p-3 rounded border border-slate-200">
                      <div className="text-[11px] uppercase text-slate-500">Title ({info.titleLen} chars)</div>
                      <div className="text-slate-800 break-words">{result.title || "—"}</div>
                    </div>
                    <div className="p-3 rounded border border-slate-200 md:col-span-2">
                      <div className="text-[11px] uppercase text-slate-500">H1</div>
                      <div className="text-slate-800 break-words">{result.h1 || "—"}</div>
                    </div>
                  </div>
                </div>

                {/* Issues */}
                <div className="p-5 rounded border border-slate-200 bg-white">
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-slate-800">Issues Found</div>
                    <div className="text-xs text-slate-500">MVP checks based on title/H1/HTML/HTTPS</div>
                  </div>

                  {info.issues.length === 0 ? (
                    <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-3 py-2">
                      No issues detected by the MVP ruleset.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {info.issues.map((it, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <span className={"text-[11px] px-2 py-1 rounded font-semibold " + badge(it.severity)}>
                            {it.severity.toUpperCase()}
                          </span>
                          <div className="text-sm text-slate-700">{it.msg}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="lg:col-span-3 p-5 rounded border border-slate-200 bg-white">
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-slate-800">Recommendations</div>
                    <div className="text-xs text-slate-500">Next actions to improve crawl + relevance</div>
                  </div>

                  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                    {info.recs.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

              </div>
            );
          })()}'''

s = s[:start] + new_block + s[end+len("\n          )}"):]  # replace

p.write_text(s)
print("✅ Audit.jsx upgraded: Overview + Issues + Recommendations")
