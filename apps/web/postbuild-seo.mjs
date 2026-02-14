import fs from "fs";
import path from "path";

const DIST = path.join(process.cwd(), "dist");

function read(p) {
  return fs.readFileSync(p, "utf8");
}
function write(p, s) {
  fs.writeFileSync(p, s, "utf8");
}
function upsert(html, regex, tag) {
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace(/<head[^>]*>/i, `$&\n    ${tag}`);
}

function patchRank() {
  const p = path.join(DIST, "rank", "index.html");
  if (!fs.existsSync(p)) {
    console.log("[postbuild-seo] skip (missing):", p);
    return;
  }
  let html = read(p);

  html = upsert(html, /<meta[^>]+name=["']robots["'][^>]*>/i, `<meta name="robots" content="index,follow">`);
  html = upsert(html, /<link[^>]+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="https://rankypulse.com/rank">`);
  html = upsert(html, /<meta[^>]+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="https://rankypulse.com/rank">`);
  html = upsert(html, /<meta[^>]+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="https://rankypulse.com/rankypulse-logo.svg">`);
  html = upsert(html, /<meta[^>]+name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="https://rankypulse.com/rankypulse-logo.svg">`);

  write(p, html);
  console.log("[postbuild-seo] patched:", p);
}

if (!fs.existsSync(DIST)) {
  console.log("[postbuild-seo] skip (dist not found):", DIST);
} else {
  patchRank();
}
