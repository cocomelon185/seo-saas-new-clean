from pathlib import Path
import re

p = Path("apps/web/src/views/Audit.jsx")
s = p.read_text(encoding="utf-8", errors="ignore")

m = re.search(r'const\s+q\s*=.*', s)
if not m:
    raise SystemExit("No q declaration found")

decl = m.group(0)

s = s[:m.start()] + s[m.end():]

comp = re.search(r'export\s+default\s+function[^{]+\{', s)
if not comp:
    raise SystemExit("Component start not found")

insert_pos = comp.end()

s = s[:insert_pos] + "\n  " + decl + "\n" + s[insert_pos:]

p.write_text(s, encoding="utf-8")
print("OK: moved q declaration to top of component")
