import { test, expect } from "@playwright/test";
import { gotoAudit } from "./_helpers/nav.js";

test("Empty history renders free-plan empty state", async ({ page }) => {
  // Clear localStorage key
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.removeItem("rankypulse.audit_history.v1");
  });

  // Mock entitlements API to return free plan
  await page.route("**/api/entitlements*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, plan: "free", fixNowLimit: 3 }),
    });
  });

  // Test with ?agency=true
  await page.goto("/audit?agency=true", { waitUntil: "domcontentloaded" });
  
  // Assert the empty state shows "Enter a URL above to run an audit."
  await expect(page.getByText(/Enter a URL above to run an audit/i)).toBeVisible({ timeout: 10000 });
  
  // Assert CTA button "Run SEO Audit" exists (or "Run Audit" as fallback)
  const runAuditButton = page.getByRole("button", { name: /^Run SEO Audit$/i }).or(
    page.getByRole("button", { name: /^Run audit$/i })
  );
  await expect(runAuditButton.first()).toBeVisible({ timeout: 5000 });

  // Test without ?agency=true
  await page.goto("/audit", { waitUntil: "domcontentloaded" });
  
  // Assert the empty state shows "Enter a URL above to run an audit."
  await expect(page.getByText(/Enter a URL above to run an audit/i)).toBeVisible({ timeout: 10000 });
  
  // Assert CTA button "Run SEO Audit" exists (or "Run Audit" as fallback)
  await expect(runAuditButton.first()).toBeVisible({ timeout: 5000 });
});
