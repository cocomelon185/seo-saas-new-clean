import { chromium } from "@playwright/test";
import path from "node:path";
import fs from "node:fs/promises";

const baseUrl = "http://localhost:5173";
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

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });

  await context.addInitScript(() => {
    localStorage.setItem("rp_auth_token", "demo-token");
    localStorage.setItem(
      "rp_auth_user",
      JSON.stringify({ name: "Demo User", role: "admin", verified: true })
    );
  });

  const page = await context.newPage();
  page.on("pageerror", (err) => {
    results.push({ type: "pageerror", message: err?.message || String(err) });
  });

  for (const route of routes) {
    const url = `${baseUrl}${route}`;
    const routeResult = { route, url, buttons: 0, links: 0, issues: [] };
    try {
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);

      const buttons = await page.locator("button").all();
      routeResult.buttons = buttons.length;
      for (const btn of buttons) {
        const disabled = await btn.isDisabled().catch(() => false);
        const visible = await btn.isVisible().catch(() => false);
        if (visible && disabled) {
          routeResult.issues.push({ type: "button-disabled", text: await btn.innerText().catch(() => "") });
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
  }

  await fs.writeFile(reportPath, JSON.stringify(results, null, 2), "utf-8");
  await browser.close();
  console.log(`Validation complete: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
