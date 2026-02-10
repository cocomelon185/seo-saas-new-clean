import fs from "fs/promises";
import path from "path";

const distDir = path.resolve(process.cwd(), "dist");
const baseUrl = "https://rankypulse.com";

const publicMeta = [
  {
    test: (pathName) => pathName === "/",
    title: "RankyPulse — Clear SEO decisions",
    description: "RankyPulse helps you make clear SEO decisions with fast audits, page reports, and actionable recommendations."
  },
  {
    test: (pathName) => pathName === "/start",
    title: "Run a Free SEO Audit in 30 Seconds | RankyPulse",
    description: "Launch a free SEO audit and get quick wins, priority fixes, and a clear action plan in under a minute."
  },
  {
    test: (pathName) => pathName === "/pricing",
    title: "Pricing | RankyPulse",
    description: "Compare plans and pick the RankyPulse package that fits your SEO workflow."
  },
  {
    test: (pathName) => pathName === "/about",
    title: "About RankyPulse",
    description: "Learn how RankyPulse helps teams ship SEO improvements with clarity and speed."
  },
  {
    test: (pathName) => pathName === "/changelog",
    title: "Changelog | RankyPulse",
    description: "Product updates, improvements, and new SEO features from the RankyPulse team."
  },
  {
    test: (pathName) => pathName === "/shared",
    title: "Sample SEO Audit Report | RankyPulse",
    description: "Explore a sample audit report with prioritized fixes, visuals, and next steps."
  },
  {
    test: (pathName) => pathName.startsWith("/r/"),
    title: "SEO Audit Report | RankyPulse",
    description: "Shared SEO audit report with prioritized issues and actionable recommendations.",
    robots: "noindex, nofollow"
  },
  {
    test: (pathName) => pathName.startsWith("/use-cases/saas-landing-audit"),
    title: "SaaS Landing Page Audit | RankyPulse",
    description: "Run a SaaS landing page audit and get a fix plan built for conversions."
  },
  {
    test: (pathName) => pathName.startsWith("/use-cases/blog-audit-checklist"),
    title: "Blog SEO Audit Checklist | RankyPulse",
    description: "Audit blog pages fast with a checklist of high-impact SEO fixes."
  },
  {
    test: (pathName) => pathName.startsWith("/use-cases/agency-audit-workflow"),
    title: "Agency SEO Audit Workflow | RankyPulse",
    description: "Standardize audits with a repeatable workflow built for agencies."
  }
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

function getMetaForPath(pathName) {
  const match = publicMeta.find((entry) => entry.test(pathName));
  const base = match || {
    title: "RankyPulse — Clear SEO decisions",
    description: "RankyPulse helps you make clear SEO decisions with fast audits, page reports, and actionable recommendations."
  };
  const noindex = noindexPrefixes.some((prefix) => pathName.startsWith(prefix));
  const robots = match?.robots || (noindex ? "noindex, nofollow" : "index, follow");
  return {
    title: base.title,
    description: base.description,
    ogTitle: base.title,
    ogDescription: base.description,
    robots
  };
}

function toRoute(relPath) {
  const normalized = relPath.split(path.sep).join("/");
  if (normalized === "index.html") return "/";
  if (normalized.endsWith("/index.html")) {
    return `/${normalized.replace(/\/index\.html$/, "")}`;
  }
  return `/${normalized.replace(/\.html$/, "")}`;
}

function absoluteUrl(route) {
  if (route === "/") return `${baseUrl}/`;
  return `${baseUrl}${route}`;
}

function replaceOrInsert(html, pattern, snippet) {
  if (pattern.test(html)) {
    return html.replace(pattern, snippet);
  }
  return html.replace(/<head[^>]*>/i, `$&\n    ${snippet}`);
}

function injectMeta(html, routePath) {
  const meta = getMetaForPath(routePath);
  const canonical = absoluteUrl(routePath);

  let output = html;

  output = replaceOrInsert(output, /<link[^>]+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}">`);
  output = replaceOrInsert(output, /<meta[^>]+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${canonical}">`);

  if (meta.title) {
    if (/<title>.*<\/title>/i.test(output)) {
      output = output.replace(/<title>.*<\/title>/i, `<title>${meta.title}</title>`);
    } else {
      output = output.replace(/<head[^>]*>/i, `$&\n    <title>${meta.title}</title>`);
    }
  }

  if (meta.description) {
    output = replaceOrInsert(output, /<meta[^>]+name=["']description["'][^>]*>/i, `<meta name="description" content="${meta.description}">`);
  }

  if (meta.ogTitle) {
    output = replaceOrInsert(output, /<meta[^>]+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${meta.ogTitle}">`);
  }

  if (meta.ogDescription) {
    output = replaceOrInsert(output, /<meta[^>]+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${meta.ogDescription}">`);
  }

  if (meta.robots) {
    output = replaceOrInsert(output, /<meta[^>]+name=["']robots["'][^>]*>/i, `<meta name="robots" content="${meta.robots}">`);
  }

  return output;
}

function stripHydrationScripts(html) {
  let output = html;
  output = output.replace(/<script\b[^>]*type=["']module["'][^>]*>[\s\S]*?<\/script>/gi, "");
  output = output.replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>/gi, "");
  output = output.replace(/<link\b[^>]*as=["']script["'][^>]*>/gi, "");
  output = output.replace(/<script>\s*window\.__staticRouterHydrationData[^<]*<\/script>/gi, "");
  output = output.replace(/<script>\s*window\.__VITE_REACT_SSG_HASH__[^<]*<\/script>/gi, "");
  return output;
}

async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const files = await collectHtmlFiles(distDir);
  await Promise.all(files.map(async (file) => {
    const rel = path.relative(distDir, file);
    if (rel === "app.html") {
      return;
    }
    const routePath = toRoute(rel);
    const html = await fs.readFile(file, "utf8");
    let updated = injectMeta(html, routePath);
    const isAppRoute = noindexPrefixes.some((prefix) => routePath.startsWith(prefix));
    if (!isAppRoute) {
      updated = stripHydrationScripts(updated);
    }
    if (updated !== html) {
      await fs.writeFile(file, updated, "utf8");
    }
  }));

  const appHtmlPath = path.join(distDir, "app.html");
  let appHtml = null;
  try {
    appHtml = await fs.readFile(appHtmlPath, "utf8");
  } catch {
    appHtml = null;
  }

  if (appHtml) {
    await Promise.all(appStaticRoutes.map(async (routePath) => {
      const targetPath = path.join(distDir, routePath.replace(/^\//, ""), "index.html");
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      const updated = injectMeta(appHtml, routePath);
      await fs.writeFile(targetPath, updated, "utf8");
    }));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
