import fs from "fs/promises";

const baseUrl = process.env.BASE_URL || "https://rankypulse.com";

const appStaticRoutes = [
  "/audit",
  "/rank",
  "/improve",
  "/upgrade",
  "/upgrade/success",
  "/upgrade/failure",
  "/plan-change",
  "/plan-change/success",
  "/account/settings",
  "/account/deleted",
  "/embed",
  "/embed/form",
  "/leads",
  "/auth/signin",
  "/auth/signup",
  "/auth/reset",
  "/auth/verify",
  "/auth/invite",
  "/auth/invite-accepted",
  "/admin/team",
  "/admin/analytics"
];

const normalizeUrl = (url) => {
  if (url === `${baseUrl}/`) return `${baseUrl}/`;
  return url.replace(/\/$/, "");
};

const getAbsolute = (route) => {
  if (route === "/") return `${baseUrl}/`;
  return `${baseUrl}${route}`;
};

const extractTag = (html, pattern) => {
  const match = html.match(pattern);
  return match?.[1]?.trim() || "";
};

const fetchText = async (url) => {
  const res = await fetch(url, { redirect: "follow" });
  const text = await res.text();
  return { res, text };
};

const main = async () => {
  const failures = [];

  const robotsUrl = `${baseUrl}/robots.txt`;
  const robots = await fetch(robotsUrl);
  const robotsText = await robots.text();
  if (!robots.ok) failures.push(`robots.txt status ${robots.status}`);
  const robotsType = robots.headers.get("content-type") || "";
  if (!robotsType.includes("text/plain")) failures.push(`robots.txt content-type ${robotsType}`);
  const sitemapLine = robotsText.split("\n").find((line) => line.toLowerCase().startsWith("sitemap:"));
  if (!sitemapLine) failures.push("robots.txt missing Sitemap directive");

  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  const sitemap = await fetch(sitemapUrl);
  const sitemapText = await sitemap.text();
  if (!sitemap.ok) failures.push(`sitemap.xml status ${sitemap.status}`);
  const sitemapType = sitemap.headers.get("content-type") || "";
  if (!sitemapType.includes("xml")) failures.push(`sitemap.xml content-type ${sitemapType}`);

  const locs = Array.from(sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
  const urls = new Set(locs.map(normalizeUrl));
  appStaticRoutes.forEach((route) => urls.add(normalizeUrl(getAbsolute(route))));

  for (const url of urls) {
    const { res, text } = await fetchText(url);
    if (!res.ok) {
      failures.push(`${url} status ${res.status}`);
      continue;
    }
    const canonical = extractTag(text, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
    const ogUrl = extractTag(text, /<meta[^>]+property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const expected = normalizeUrl(url);
    if (!canonical) failures.push(`${url} missing canonical`);
    if (!ogUrl) failures.push(`${url} missing og:url`);
    if (canonical && normalizeUrl(canonical) !== expected) failures.push(`${url} canonical mismatch -> ${canonical}`);
    if (ogUrl && normalizeUrl(ogUrl) !== expected) failures.push(`${url} og:url mismatch -> ${ogUrl}`);
  }

  if (failures.length) {
    console.error("P0 verification failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
    process.exit(1);
  }

  console.log("P0 verification passed.");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
