import fs from "fs/promises";
import path from "path";
import Beasties from "beasties";

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
    test: (pathName) => pathName === "/audit",
    title: "SEO Audit | RankyPulse",
    description: "Run a full-site SEO audit, get prioritized fixes, and export a client-ready report in minutes."
  },
  {
    test: (pathName) => pathName === "/seo-tool-audit",
    title: "Free SEO Audit Tool | RankyPulse",
    description: "Run a free SEO audit tool to get a score, prioritized issues, and clear next steps."
  },
  {
    test: (pathName) => pathName === "/website-seo-checker",
    title: "Website SEO Checker | RankyPulse",
    description: "Use a website SEO checker to find technical and on-page issues fast and prioritize fixes."
  },
  {
    test: (pathName) => pathName === "/technical-seo-audit",
    title: "Technical SEO Audit | RankyPulse",
    description: "Audit crawlability, indexability, and Core Web Vitals with this technical SEO audit guide."
  },
  {
    test: (pathName) => pathName === "/seo-audit-for-saas",
    title: "SEO Audit for SaaS | RankyPulse",
    description: "Run an SEO audit for SaaS pages and fix issues that impact organic pipeline and signups."
  },
  {
    test: (pathName) => pathName === "/faq",
    title: "FAQ | RankyPulse",
    description: "Frequently asked questions about RankyPulse audits, reports, pricing, and workflows."
  },
  {
    test: (pathName) => pathName === "/privacy",
    title: "Privacy Policy | RankyPulse",
    description: "How RankyPulse collects, uses, and protects data."
  },
  {
    test: (pathName) => pathName === "/terms",
    title: "Terms of Service | RankyPulse",
    description: "Terms and conditions for using RankyPulse."
  },
  {
    test: (pathName) => pathName === "/contact",
    title: "Contact | RankyPulse",
    description: "Contact RankyPulse for support, onboarding, and partnership inquiries."
  },
  {
    test: (pathName) => pathName === "/compare/rankypulse-vs-ahrefs",
    title: "RankyPulse vs Ahrefs | SEO Audit Comparison",
    description: "Compare RankyPulse and Ahrefs for audit workflows and team execution."
  },
  {
    test: (pathName) => pathName === "/compare/rankypulse-vs-semrush",
    title: "RankyPulse vs Semrush | SEO Audit Comparison",
    description: "Compare RankyPulse and Semrush for audit speed, clarity, and execution workflow."
  },
  {
    test: (pathName) => pathName === "/upgrade",
    title: "Upgrade to RankyPulse Pro | RankyPulse",
    description: "Unlock automated audits, shareable reports, and premium SEO insights for every client."
  },
  {
    test: (pathName) => pathName.startsWith("/r/"),
    title: "SEO Audit Report | RankyPulse",
    description: "Shared SEO audit report with prioritized issues and actionable recommendations."
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
  },
  {
    test: (pathName) => pathName.startsWith("/use-cases/ecommerce-seo-audit"),
    title: "Ecommerce SEO Audit | RankyPulse",
    description: "Audit ecommerce product and category pages for high-impact SEO fixes."
  },
  {
    test: (pathName) => pathName.startsWith("/use-cases/local-business-seo-audit"),
    title: "Local Business SEO Audit | RankyPulse",
    description: "Improve local rankings with a targeted local business SEO audit workflow."
  }
];

const noindexPrefixes = [
  "/auth",
  "/account",
  "/admin",
  "/embed",
  "/leads",
  "/improve",
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

const appPublicStaticRoutes = new Set([
  "/audit",
  "/upgrade",
  "/upgrade/success",
  "/upgrade/failure"
]);

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

async function inlineCriticalCss(html) {
  const stylesheetMatches = Array.from(html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi));
  if (!stylesheetMatches.length) {
    return html;
  }
  const critters = new Beasties({
    path: distDir,
    publicPath: "/",
    compress: true,
    pruneSource: false,
    preload: "swap",
    inlineFonts: true
  });

  const inlined = await critters.process(html);
  return inlined || html;
}

function deferStylesheets(html) {
  let output = html.replace(/<link\b[^>]*rel=["']preload["'][^>]*as=["']style["'][^>]*>/gi, "");
  output = output.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, (match) => {
    const hrefMatch = match.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) return match;
    const href = hrefMatch[1];
    return [
      `<link rel="stylesheet" href="${href}">`
    ].join("\n    ");
  });
  return output;
}

function ensureStylesheetInHead(html) {
  const headMatch = html.match(/<\/head>/i);
  if (!headMatch) return html;

  const links = Array.from(html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)).map((m) => m[0]);
  if (!links.length) return html;

  let output = html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, "");
  output = output.replace(/<noscript>\s*<link\b[^>]*rel=["']stylesheet["'][^>]*>\s*<\/noscript>/gi, "");

  const uniqueLinks = Array.from(new Set(links));
  const insertion = `\n    ${uniqueLinks.join("\n    ")}\n`;
  output = output.replace(/<\/head>/i, `${insertion}</head>`);
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
    const needsCritical = rel === "index.html" || rel === path.join("start", "index.html");
    if (needsCritical) {
      updated = await inlineCriticalCss(updated);
      updated = deferStylesheets(updated);
      updated = ensureStylesheetInHead(updated);
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
      try {
        await fs.access(targetPath);
        return;
      } catch {}
      const updated = injectMeta(appHtml, routePath);
      await fs.writeFile(targetPath, updated, "utf8");
    }));
  }

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
