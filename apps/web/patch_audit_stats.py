from pathlib import Path

p = Path("src/views/Audit.jsx")
s = p.read_text(errors="ignore")

needle = "setResult(j.data);"
if needle not in s:
    raise SystemExit("❌ Could not find: setResult(j.data); in src/views/Audit.jsx")

if "rankypulse_stats" in s:
    print("ℹ️ Audit.jsx already contains rankypulse_stats (skipping).")
    raise SystemExit(0)

insert = """setResult(j.data);

          // Save stats for dashboard cards
          try {
            const htmlBytes = Number(j.data?.htmlBytes || 0);
            const seoScore =
              htmlBytes === 0 ? 0 :
              htmlBytes < 500000 ? 85 :
              htmlBytes < 1000000 ? 65 : 45;

            localStorage.setItem(
              "rankypulse_stats",
              JSON.stringify({
                pagesCrawled: 1,
                issuesFound: 0,
                seoScore,
                lastScan: new Date().toISOString(),
              })
            );
          } catch (_) {}
"""

s = s.replace(needle, insert, 1)
p.write_text(s)
print("✅ Patched Audit.jsx to store rankypulse_stats")
