import { test, expect } from "@playwright/test";

const getOrigin = (baseURL) => baseURL || process.env.BASE_URL || "";

function trackPageIssues(page) {
  const issues = [];
  page.on("pageerror", (error) => {
    issues.push(`pageerror: ${error.message}`);
  });
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === "error") {
      issues.push(`console.error: ${text}`);
    }
    if (/mixed content/i.test(text)) {
      issues.push(`mixed-content: ${text}`);
    }
  });
  return issues;
}

test.describe("P0 critical flows", () => {
  test("Homepage -> Start -> Audit flow completes without errors", async ({ page, baseURL }) => {
    test.setTimeout(120000);
    const origin = getOrigin(baseURL);
    expect(origin, "Missing base URL. Set baseURL in Playwright config or BASE_URL env var.").toBeTruthy();

    const issues = trackPageIssues(page);

    await page.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /run free audit/i }).first().click();
    await expect(page).toHaveURL(/\/start/);

    await page.fill("input[name='url']", "https://example.com");
    await page.getByRole("button", { name: /run free audit/i }).click();

    await expect(page).toHaveURL(/\/audit/);

    // Wait for either results summary or at least the audit UI to settle.
    await page.waitForLoadState("networkidle", { timeout: 60000 });

    const resultsVisible = await page.locator("text=Issues found").first().isVisible().catch(() => false);
    const issuesPanelVisible = await page.locator("text=Issues").first().isVisible().catch(() => false);
    expect(resultsVisible || issuesPanelVisible, "Audit results did not appear").toBeTruthy();

    expect(issues, `Console/page errors detected:\n${issues.join("\n")}`).toEqual([]);
  });

  test("Pricing -> Upgrade -> Checkout iframe loads", async ({ page, baseURL }) => {
    test.setTimeout(120000);
    const origin = getOrigin(baseURL);
    expect(origin, "Missing base URL. Set baseURL in Playwright config or BASE_URL env var.").toBeTruthy();

    const issues = trackPageIssues(page);

    await page.goto(`${origin}/pricing`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /see pricing/i }).first().click().catch(() => null);

    await page.goto(`${origin}/upgrade`, { waitUntil: "domcontentloaded" });
    const startButton = page.getByRole("button", { name: /start 7-day trial/i });
    await startButton.click();

    const frame = await page.frameLocator("iframe[src*='razorpay'], iframe[src*='checkout']").first();
    await expect(frame.locator("body")).toBeVisible({ timeout: 30000 });

    expect(issues, `Console/page errors detected:\n${issues.join("\n")}`).toEqual([]);
  });

  test("Success and failure routes render without console errors", async ({ page, baseURL }) => {
    const origin = getOrigin(baseURL);
    expect(origin, "Missing base URL. Set baseURL in Playwright config or BASE_URL env var.").toBeTruthy();

    const routes = ["/upgrade/success", "/upgrade/failure", "/plan-change/success"]; 
    for (const route of routes) {
      const issues = trackPageIssues(page);
      await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      expect(issues, `Console/page errors detected on ${route}:\n${issues.join("\n")}`).toEqual([]);
    }
  });

  test("Shared report loads without auth and without errors", async ({ page, baseURL }) => {
    const origin = getOrigin(baseURL);
    expect(origin, "Missing base URL. Set baseURL in Playwright config or BASE_URL env var.").toBeTruthy();

    const issues = trackPageIssues(page);
    await page.goto(`${origin}/shared`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    expect(issues, `Console/page errors detected:\n${issues.join("\n")}`).toEqual([]);
  });
});
