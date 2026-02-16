import { chromium } from "@playwright/test";
import path from "node:path";
import fs from "node:fs/promises";

const baseUrl = process.env.BASE_URL || "http://localhost:5173";
const guestSigninUrl = `${baseUrl}/api/guest-signin`;
const routes = [
  "/",
  "/pricing",
  "/start",
  "/about",
  "/changelog",
  "/use-cases/saas-landing-audit",
  "/use-cases/blog-audit-checklist",
  "/use-cases/agency-audit-workflow",
  "/auth/signin",
  "/auth/signup",
  "/auth/reset",
  "/auth/verify",
  "/audit",
  "/rank",
  "/improve",
  "/embed",
  "/embed/form",
  "/leads",
  "/account/settings",
  "/admin/team"
];

async function ensureReportDir() {
  const dir = path.join(process.cwd(), "test-results");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function main() {
  const reportDir = await ensureReportDir();
  const reportPath = path.join(reportDir, "click-validate.json");
  const results = [];

  let guestSession = null;
  try {
    const res = await fetch(guestSigninUrl, { method: "POST" });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.token && data?.user) {
      guestSession = data;
    }
  } catch {}

  if (!guestSession) {
    console.error("[click-validate] guest signin failed. Set GUEST_LOGIN_ENABLED and guest env vars.");
    process.exit(1);
  }

  try {
    await fetch(`${baseUrl}/api/embed/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "RankyPulse QA",
        email: "qa+lead@rankypulse.com",
        url: "https://example.com",
        source: "click-validate"
      })
    });
  } catch {}

  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });

  await context.addInitScript(
    ({ token, user }) => {
      try {
        localStorage.setItem("rp_auth_token", token);
      } catch {}
      try {
        localStorage.setItem("rp_auth_user", JSON.stringify(user));
      } catch {}
    },
    { token: guestSession.token, user: guestSession.user }
  );

  const page = await context.newPage();
  let currentRoute = "init";
  page.on("pageerror", (err) => {
    results.push({
      type: "pageerror",
      route: currentRoute,
      url: page.url(),
      message: err?.message || String(err),
      stack: err?.stack || ""
    });
  });

  for (const route of routes) {
    currentRoute = route;
    const url = `${baseUrl}${route}`;
    const routeResult = { route, url, buttons: 0, links: 0, issues: [] };
    try {
      console.log(`[click-validate] visiting ${url}`);
      await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(800);

      if (route === "/audit") {
        await page.fill("#audit-page-url", "https://example.com").catch(() => {});
      }
      if (route === "/embed/form") {
        await page.fill("#embed-url", "https://example.com").catch(() => {});
        await page.fill("#embed-email", "qa+lead@rankypulse.com").catch(() => {});
      }
      if (route === "/rank") {
        await page.fill("#rank-keyword", "seo audit tool").catch(() => {});
        await page.fill("#rank-domain", "rankypulse.com").catch(() => {});
        const check = page.getByRole("button", { name: /check rank/i });
        if (await check.isVisible().catch(() => false)) {
          await check.click().catch(() => {});
          await page.waitForTimeout(1500);
        }
      }
      if (route === "/admin/team") {
        await page.fill("#invite-email", "qa+invite@rankypulse.com").catch(() => {});
      }

      const buttons = await page.locator("button").all();
      routeResult.buttons = buttons.length;
      for (const btn of buttons) {
        const disabled = await btn.isDisabled().catch(() => false);
        const visible = await btn.isVisible().catch(() => false);
        if (visible && disabled) {
          const title = await btn.getAttribute("title").catch(() => "");
          const text = await btn.innerText().catch(() => "");
          const expected =
            title?.includes("No active subscription") ||
            title?.includes("No leads yet") ||
            title?.includes("Run a check first") ||
            title?.includes("Admins only");
          if (!expected) {
            routeResult.issues.push({ type: "button-disabled", text, title });
          }
        }
      }

      const links = await page.locator("a").all();
      routeResult.links = links.length;
      for (const link of links) {
        const href = await link.getAttribute("href");
        const visible = await link.isVisible().catch(() => false);
        if (visible && (!href || href === "#")) {
          routeResult.issues.push({ type: "link-missing-href", text: await link.innerText().catch(() => "") });
        }
      }
    } catch (err) {
      routeResult.issues.push({ type: "route-error", message: err?.message || String(err) });
    }
    results.push(routeResult);
    console.log(`[click-validate] done ${route} (buttons=${routeResult.buttons}, links=${routeResult.links}, issues=${routeResult.issues.length})`);
  }

  await fs.writeFile(reportPath, JSON.stringify(results, null, 2), "utf-8");
  await browser.close();
  console.log(`Validation complete: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
