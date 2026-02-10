import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "..", "dist");
const baseUrl = "https://rankypulse.com";

const publicRoutes = [
  "/",
  "/start",
  "/pricing",
  "/about",
  "/changelog",
  "/shared",
  "/use-cases/saas-landing-audit",
  "/use-cases/blog-audit-checklist",
  "/use-cases/agency-audit-workflow"
];

const appRoutes = [
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

const noindexPrefixes = [
  "/auth",
  "/account",
  "/admin",
  "/embed",
  "/leads",
  "/rank",
  "/improve",
  "/audit",
  "/r/",
  "/upgrade",
  "/plan-change"
];

const routeToFile = (route) => {
  if (route === "/") return path.join(distDir, "index.html");
  return path.join(distDir, `${route.replace(/^\//, "")}.html`);
};

const appRouteToFile = (route) => {
  return path.join(distDir, route.replace(/^\//, ""), "index.html");
};

const extractAll = (html, regex) => Array.from(html.matchAll(regex)).map((m) => m[1]);
const extractOne = (html, regex) => html.match(regex)?.[1]?.trim() || "";

const normalizeUrl = (url) => (url.endsWith("/") ? url : `${url}`);
const absoluteUrl = (route) => (route === "/" ? `${baseUrl}/` : `${baseUrl}${route}`);

const failures = [];

const htmlCache = {};
for (const route of publicRoutes) {
  const file = routeToFile(route);
  try {
    const html = await fs.readFile(file, "utf8");
    htmlCache[route] = html;
  } catch (err) {
    failures.push(`Missing HTML for ${route} (${file})`);
  }
}

const appHtmlCache = {};
for (const route of appRoutes) {
  const file = appRouteToFile(route);
  try {
    const html = await fs.readFile(file, "utf8");
    appHtmlCache[route] = html;
  } catch (err) {
    failures.push(`Missing app HTML for ${route} (${file})`);
  }
}

// H1 checks
for (const [route, html] of Object.entries(htmlCache)) {
  const h1s = extractAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi)
    .map((h) => h.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
  if (h1s.length === 0) failures.push(`${route} missing H1`);
  if (h1s.length > 1) failures.push(`${route} has multiple H1s (${h1s.length})`);
}

// Meta title + description uniqueness
const titles = new Map();
const descriptions = new Map();
for (const [route, html] of Object.entries(htmlCache)) {
  const title = extractOne(html, /<title>([^<]+)<\/title>/i);
  const description = extractOne(html, /<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (!title) failures.push(`${route} missing <title>`);
  if (!description) failures.push(`${route} missing meta description`);
  if (title) titles.set(route, title);
  if (description) descriptions.set(route, description);
}

const dupTitles = new Map();
for (const [route, title] of titles.entries()) {
  const key = title.toLowerCase();
  const list = dupTitles.get(key) || [];
  list.push(route);
  dupTitles.set(key, list);
}
for (const [title, routes] of dupTitles.entries()) {
  if (routes.length > 1) failures.push(`Duplicate title "${title}" on ${routes.join(", ")}`);
}

const dupDescriptions = new Map();
for (const [route, desc] of descriptions.entries()) {
  const key = desc.toLowerCase();
  const list = dupDescriptions.get(key) || [];
  list.push(route);
  dupDescriptions.set(key, list);
}
for (const [desc, routes] of dupDescriptions.entries()) {
  if (routes.length > 1) failures.push(`Duplicate meta description on ${routes.join(", ")}`);
}

// Robots tag policy
for (const [route, html] of Object.entries(htmlCache)) {
  const robots = extractOne(html, /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (!robots) failures.push(`${route} missing meta robots`);
  if (route === "/shared" && robots && robots.toLowerCase().includes("noindex")) {
    failures.push(`/shared should be indexable but has robots="${robots}"`);
  }
  if (noindexPrefixes.some((p) => route.startsWith(p)) && robots && !robots.toLowerCase().includes("noindex")) {
    failures.push(`${route} should be noindex but robots="${robots}"`);
  }
}

for (const [route, html] of Object.entries(appHtmlCache)) {
  const robots = extractOne(html, /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (!robots) failures.push(`${route} missing meta robots`);
  if (robots && !robots.toLowerCase().includes("noindex")) {
    failures.push(`${route} should be noindex but robots="${robots}"`);
  }
}

// Canonical + og:url
for (const [route, html] of Object.entries(htmlCache)) {
  const canonical = extractOne(html, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  const ogUrl = extractOne(html, /<meta[^>]+property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const expected = normalizeUrl(absoluteUrl(route));
  if (!canonical) failures.push(`${route} missing canonical`);
  if (!ogUrl) failures.push(`${route} missing og:url`);
  if (canonical && normalizeUrl(canonical) !== expected) failures.push(`${route} canonical mismatch -> ${canonical}`);
  if (ogUrl && normalizeUrl(ogUrl) !== expected) failures.push(`${route} og:url mismatch -> ${ogUrl}`);
}

for (const [route, html] of Object.entries(appHtmlCache)) {
  const canonical = extractOne(html, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  const ogUrl = extractOne(html, /<meta[^>]+property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const expected = normalizeUrl(absoluteUrl(route));
  if (!canonical) failures.push(`${route} missing canonical`);
  if (!ogUrl) failures.push(`${route} missing og:url`);
  if (canonical && normalizeUrl(canonical) !== expected) failures.push(`${route} canonical mismatch -> ${canonical}`);
  if (ogUrl && normalizeUrl(ogUrl) !== expected) failures.push(`${route} og:url mismatch -> ${ogUrl}`);
}

// Internal linking check: homepage -> start -> audit -> results
const home = htmlCache["/"] || "";
const hasStartLink = /href=["']\/start["']/i.test(home);
const hasAuditLink = /href=["']\/audit["']/i.test(home) || /action=["']\/audit["']/i.test(home);
const hasSharedLink = /href=["']\/shared["']/i.test(home);
if (!hasStartLink) failures.push("Homepage missing link to /start");
if (!hasAuditLink) failures.push("Homepage missing link or form action to /audit");
if (!hasSharedLink) failures.push("Homepage missing link to /shared");

// Performance / CSS / Fonts checks
for (const [route, html] of Object.entries(htmlCache)) {
  const fontLink = extractOne(html, /<link[^>]+href=["']https:\/\/fonts\.googleapis\.com[^"']+["'][^>]*>/i);
  if (fontLink && !/display=swap/i.test(fontLink)) {
    failures.push(`${route} google fonts link missing display=swap`);
  }
}

const marketingHasModuleScript = /<script[^>]+type=["']module["']/i.test(home);
if (marketingHasModuleScript) failures.push("Marketing HTML contains module script (expected none)");

if (failures.length) {
  console.error("P1 local checks failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}

console.log("P1 local checks passed for marketing + app HTML metadata/robots.");
