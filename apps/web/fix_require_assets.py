from pathlib import Path
import re, os

root = Path("src")
assets_dir = root / "assets"

pat = re.compile(r"""require\(\s*["']assets/([^"']+)["']\s*\)\.default""")

changed_files = 0
changed_hits = 0

for f in root.rglob("*"):
    if f.suffix not in [".jsx", ".tsx", ".js", ".ts"]:
        continue
    text = f.read_text(errors="ignore")
    if "require(" not in text:
        continue

    def repl(m):
        global changed_hits
        rest = m.group(1)
        rel_assets = os.path.relpath(assets_dir, f.parent).replace("\\", "/")
        if not rel_assets.startswith("."):
            rel_assets = "./" + rel_assets
        changed_hits += 1
        return f'new URL("{rel_assets}/{rest}", import.meta.url).href'

    new = pat.sub(repl, text)
    if new != text:
        f.write_text(new)
        changed_files += 1

print(f"✅ assets require() fixed in {changed_files} file(s), {changed_hits} replacement(s).")
