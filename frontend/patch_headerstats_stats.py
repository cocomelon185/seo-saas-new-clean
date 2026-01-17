from pathlib import Path
import re

p = Path("src/components/Headers/HeaderStats.jsx")
s = p.read_text(errors="ignore")

# Ensure hooks import
s = s.replace('import React from "react";', 'import React, { useEffect, useState } from "react";')

# Inject stats block after function start (only once)
if "const [stats, setStats]" not in s:
    s = re.sub(
        r'export default function HeaderStats\(\)\s*\{\s*',
        'export default function HeaderStats() {\n'
        '  const [stats, setStats] = useState({\n'
        '    pagesCrawled: 1,\n'
        '    issuesFound: 0,\n'
        '    seoScore: 0,\n'
        '    lastScan: "—",\n'
        '  });\n\n'
        '  useEffect(() => {\n'
        '    try {\n'
        '      const raw = localStorage.getItem("rankypulse_stats");\n'
        '      if (!raw) return;\n'
        '      const j = JSON.parse(raw);\n'
        '      setStats({\n'
        '        pagesCrawled: typeof j.pagesCrawled === "number" ? j.pagesCrawled : 1,\n'
        '        issuesFound: typeof j.issuesFound === "number" ? j.issuesFound : 0,\n'
        '        seoScore: typeof j.seoScore === "number" ? j.seoScore : 0,\n'
        '        lastScan: j.lastScan ? new Date(j.lastScan).toLocaleString() : "—",\n'
        '      });\n'
        '    } catch (_) {}\n'
        '  }, []);\n\n',
        s,
        count=1
    )

# Replace hardcoded statTitle values (these exact strings are from your template)
s = s.replace('statTitle="350,897"', 'statTitle={stats.pagesCrawled.toLocaleString()}')
s = s.replace('statTitle="2,356"', 'statTitle={stats.issuesFound.toLocaleString()}')
s = s.replace('statTitle="924"', 'statTitle={String(stats.seoScore)}')
s = s.replace('statTitle="49,65%"', 'statTitle={stats.lastScan}')

p.write_text(s)
print("✅ Patched HeaderStats.jsx to show RankyPulse stats")
