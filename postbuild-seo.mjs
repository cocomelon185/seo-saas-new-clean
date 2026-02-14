import fs from "fs";
import path from "path";

const DIST = path.join(process.cwd(), "apps", "web", "dist");

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function write(p, s) {
  fs.writeFileSync(p, s, "utf8");
}

function setOrReplaceMetaRobots(html, robots) {
  const meta = `<meta name="robots" content="${robots}">`;
  if (/<meta[^>]+name=["']robots["'][^>]*>/i.test(html)) {
    return html.replace(/<meta[^>]+name=["']robots["'][^>]*>/i, meta);
  }
  return html.replace(/<head[^>]*>/i, `$&\n    ${meta}`);
}

function setOrReplaceCanonical(html, canonical) {
  const tag = `<link rel="canonical" href="${canonical}">`;
  if (/<link[^>]+rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/i, tag);
  }
  return html.replace(/<head[^>]*>/i, `$&\n    ${tag}`);
}

function setOrReplaceOgUrl(html, url) {
  const tag = `<meta property="og:url" content="${url}">`;
  if (/<meta[^>]+property=["']og:url["'][^>]*>/i.test(html)) {
    return html.replace(/<meta[^>]+property=["']og:url["'][^>]*>/i, tag);
  }
  return html.replace(/<head[^>]*>/i, `$&\n    ${tag}`);
}

function setOrReplaceOgImage(html, url) {
  const tag = `<meta property="og:image" content="${url}">`;
  if (/<meta[^>]+property=["']og:image["'][^>]*>/i.test(html)) {
    return html.replace(/<meta[^>]+property=["']og:image["'][^>]*>/i, tag);
  }
  return html.replace(/<head[^>]*>/i, `$&\n    ${tag}`);
}

function setOrReplaceTwitterImage(html, url) {
  const tag = `<meta name="twitter:image" content="${url}">`;
  if (/<meta[^>]+name=["']twitter:image["'][^>]*>/i.test(html)) {
    return html.replace(/<meta[^>]+name=["']twitter:image["'][^>]*>/i, tag);
  }
  return html.replace(/<head[^>]*>/i, `$&\n    ${tag}`);
}

function patchRankIndex() {
  const p = path.join(DIST, "rank", "index.html");
  if (!fs.existsSync(p)) {
    console.log("[postbuild-seo] skip: missing", p);
    return;
  }
  let html = read(p);
  html = setOrReplaceMetaRobots(html, "index,follow");
  html = setOrReplaceCanonical(html, "https://rankypulse.com/rank");
  html = setOrReplaceOgUrl(html, "https://rankypulse.com/rank");
  html = setOrReplaceOgImage(html, "https://rankypulse.com/rankypulse-logo.svg");
  html = setOrReplaceTwitterImage(html, "https://rankypulse.com/rankypulse-logo.svg");
  write(p, html);
  console.log("[postbuild-seo] patched", p);
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.log("[postbuild-seo] skip: dist not found", DIST);
    return;
  }
  patchRankIndex();
}

main();
