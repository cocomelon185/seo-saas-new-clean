import { test, expect } from "@playwright/test";

const routes = [
  "/",
  "/start",
  "/shared",
  "/audit",
  "/rank",
  "/improve",
  "/pricing",
  "/upgrade",
  "/upgrade/success",
  "/upgrade/failure",
  "/plan-change",
  "/plan-change/success",
  "/account/settings",
  "/account/deleted",
  "/changelog",
  "/about",
  "/use-cases/saas-landing-audit",
  "/use-cases/blog-audit-checklist",
  "/use-cases/agency-audit-workflow",
  "/embed",
  "/embed/form",
  "/leads",
  "/admin/team",
  "/admin/analytics",
  "/auth/signin",
  "/auth/signup",
  "/auth/reset",
  "/auth/verify",
  "/auth/invite",
  "/auth/invite-accepted"
];

test.describe("route crawl", () => {
  for (const route of routes) {
    test(`GET ${route} returns non-4xx/5xx`, async ({ page, baseURL }) => {
      const origin = baseURL || process.env.BASE_URL;
      expect(origin, "Missing base URL. Set baseURL in Playwright config or BASE_URL env var.").toBeTruthy();
      const response = await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
      expect(response, "Navigation returned no response.").toBeTruthy();
      const status = response.status();
      expect(status, `Unexpected status ${status} for ${route}`).toBeLessThan(400);
    });
  }

  test("static seo files return 200", async ({ request, baseURL }) => {
    const origin = baseURL || process.env.BASE_URL;
    expect(origin, "Missing base URL. Set baseURL in Playwright config or BASE_URL env var.").toBeTruthy();
    for (const path of ["/robots.txt", "/sitemap.xml"]) {
      const response = await request.get(`${origin}${path}`);
      expect(response.status(), `Unexpected status for ${path}`).toBeLessThan(400);
    }
  });
});
