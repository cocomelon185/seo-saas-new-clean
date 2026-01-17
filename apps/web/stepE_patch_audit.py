from pathlib import Path
import re

p = Path("src/views/Audit.jsx")
s = p.read_text(errors="ignore")

# 1) Ensure buildInsights() returns issues + recs + htmlBytes + titleLen + hasH1 (you already have it)
# We'll patch it to also return seoScore + issuesFound so we can store stats easily.

# Find buildInsights and inject seoScore logic before return.
if "function buildInsights" not in s:
    raise SystemExit("❌ buildInsights() not found in Audit.jsx (Step C2 must exist)")

# Add seoScore calculation if missing
if "seoScore" not in s or "return { issues" in s and "seoScore" not in s.split("return {",1)[1].split("}",1)[0]:
    # Insert score calc right before uniqRecs / return
    s = re.sub(
        r'(const uniqRecs = Array\.from\(new Set\(recs\)\);\s*return \{ )',
        r'''// Score: start at 100, subtract based on issue severity
  let seoScore = 100;
  for (const it of issues) {
    if (it.severity === "high") seoScore -= 25;
    else if (it.severity === "med") seoScore -= 15;
    else seoScore -= 5;
  }
  if (seoScore < 0) seoScore = 0;
  if (seoScore > 100) seoScore = 100;

  const uniqRecs = Array.from(new Set(recs));
  return { ''',
        s,
        count=1
    )

    # Make sure return includes seoScore and issues count
    s = s.replace(
        "return { issues, recs: uniqRecs, titleLen, hasH1, htmlBytes };",
        "return { issues, recs: uniqRecs, titleLen, hasH1, htmlBytes, issuesFound: issues.length, seoScore };"
    )

# 2) Update the localStorage saving block to use buildInsights(result)
# We replace the existing simple save block (rankypulse_stats) with one derived from insights.
if "rankypulse_stats" not in s:
    raise SystemExit("❌ rankypulse_stats block not found in Audit.jsx (Step numbers patch must exist)")

# Replace any existing localStorage.setItem("rankypulse_stats", ...) block with a computed one
s = re.sub(
    r'localStorage\.setItem\(\s*"rankypulse_stats"[\s\S]*?\);\s*\}\s*catch\s*\([^)]+\)\s*\{\s*\}',
    '''const info = buildInsights(j.data);

            localStorage.setItem(
              "rankypulse_stats",
              JSON.stringify({
                pagesCrawled: 1,
                issuesFound: info.issuesFound,
                seoScore: info.seoScore,
                lastScan: new Date().toISOString(),
              })
            );
          } catch (_) {}''',
    s,
    count=1
)

p.write_text(s)
print("✅ Step E patched Audit.jsx: real issuesFound + seoScore saved to localStorage")
