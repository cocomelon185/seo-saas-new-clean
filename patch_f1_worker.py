from pathlib import Path
import re

p = Path("audit_worker.js")
s = p.read_text(errors="ignore")

# 1) Ensure cheerio import (ESM)
if 'from "cheerio"' not in s:
    # insert after existing imports
    s = re.sub(r'(^import .*?;\s*\n)+', lambda m: m.group(0) + 'import cheerio from "cheerio";\n', s, count=1, flags=re.M)

# 2) After HTML fetch/text exists, parse meta tags
# We'll inject a robust parser block near where title/h1/htmlBytes are produced.
# If your worker already sets title/h1/htmlBytes, this will augment it.

# Heuristic: find where cheerio/load might be used; if none, inject after "const html =" assignment
if "cheerio.load" not in s:
    # find `const html = await` or `let html = await`
    m = re.search(r'(const|let)\s+html\s*=\s*await[\s\S]{0,120}?\.text\(\)\s*;', s)
    if not m:
        raise SystemExit("❌ Couldn't find `html = await ... .text();` in audit_worker.js. Paste the worker file and I’ll patch manually.")

    insert_at = m.end()

    inject = """
\n
  // --- RankyPulse: parse SEO meta ---
  const $ = cheerio.load(html);

  const metaDescription = ($('meta[name="description"]').attr("content") || "").trim();
  const robotsMeta = ($('meta[name="robots"]').attr("content") || "").trim().toLowerCase();
  const canonical = ($('link[rel="canonical"]').attr("href") || "").trim();

  const noindex =
    robotsMeta.includes("noindex") ||
    robotsMeta.includes("none") || false;
\n
"""
    s = s[:insert_at] + inject + s[insert_at:]

# 3) Ensure the message payload includes these fields
# We’ll add them to msg.data right before postMessage.
# Find the first object literal that looks like data: { url, title, h1, htmlBytes ... }
# and add keys if missing.

# Try to locate `data:` object
m = re.search(r'data\s*:\s*\{([\s\S]*?)\}', s)
if not m:
    # fallback: locate `{ url:` object where postMessage happens
    m = re.search(r'postMessage\s*\(\s*\{\s*ok\s*:\s*true\s*,\s*data\s*:\s*\{([\s\S]*?)\}\s*\}\s*\)', s)

if not m:
    raise SystemExit("❌ Couldn't find where worker constructs `data: { ... }`. Paste audit_worker.js and I’ll patch precisely.")

block = m.group(0)

# Only add if not already present
if "metaDescription" not in block:
    # Insert after htmlBytes if present, else after h1, else near top
    if "htmlBytes" in block:
        block2 = block.replace("htmlBytes", "htmlBytes", 1)
        block2 = re.sub(r'(htmlBytes\s*:\s*[^,\n}]+)(\s*[,\n])', r'\\1,\\n      metaDescription,\\n      robotsMeta,\\n      canonical,\\n      noindex\\2', block2, count=1)
    else:
        block2 = re.sub(r'(\{\s*)', r'\\1\\n      metaDescription,\\n      robotsMeta,\\n      canonical,\\n      noindex,\\n', block, count=1)
    s = s.replace(block, block2, 1)

p.write_text(s)
print("✅ Patched audit_worker.js to parse metaDescription/robotsMeta/canonical/noindex")
