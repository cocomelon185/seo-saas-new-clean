import { test, expect } from "@playwright/test";
import { gotoAudit } from "./_helpers/nav.js";

const isAuthUrl = (url) => /\/auth\/(signin|signup)(?:[/?#]|$)/.test(url);

/**
 * Phase 3.2: /audit Page Isolation Tests
 * 
 * Verifies that /audit page:
 * - Does not depend on Admin UI components
 * - Compiles and runs even if Admin UI is broken
 * - Is isolated from Admin routes
 */

test.describe("Phase 3.2: /audit Page Isolation", () => {
  test("/audit page loads and renders without Admin dependencies", async ({ page }) => {
    // Navigate directly to /audit (not /admin/audit)
    await page.goto("/audit", { waitUntil: "domcontentloaded" });
    const currentUrl = page.url();
    if (isAuthUrl(currentUrl)) {
      expect(/[?&]next=/.test(currentUrl), `Auth redirect missing next param: ${currentUrl}`).toBeTruthy();
      expect(/audit/i.test(decodeURIComponent(currentUrl)), `Expected audit in redirect target: ${currentUrl}`).toBeTruthy();
      return;
    }

    // Verify audit page loads
    await expect(page.getByText(/SEO Page Audit/i)).toBeVisible({ timeout: 10000 });
    
    // Verify URL input is present
    const urlInput = page.getByLabel("Page URL").or(
      page.locator('input[placeholder*="https://example.com/pricing"]')
    ).first();
    await expect(urlInput).toBeVisible({ timeout: 10000 });

    // Verify Run Audit button is present
    const runButton = page.getByRole("button", { name: /^Run SEO Audit$/i }).or(
      page.getByRole("button", { name: /^Run Audit$/i })
    );
    await expect(runButton).toBeVisible({ timeout: 10000 });

    // Verify page doesn't show Admin UI elements (like Admin sidebar)
    const adminSidebar = page.locator('aside:has-text("Dashboard")');
    await expect(adminSidebar).not.toBeVisible({ timeout: 1000 });
  });

  test("/audit page is accessible via direct route", async ({ page }) => {
    // Navigate to /audit
    await page.goto("/audit", { waitUntil: "domcontentloaded" });
    const currentUrl = page.url();
    if (isAuthUrl(currentUrl)) {
      expect(/[?&]next=/.test(currentUrl), `Auth redirect missing next param: ${currentUrl}`).toBeTruthy();
      expect(/audit/i.test(decodeURIComponent(currentUrl)), `Expected audit in redirect target: ${currentUrl}`).toBeTruthy();
      return;
    }

    // Verify we're on the audit page (not redirected)
    expect(page.url()).toContain("/audit");

    // Verify page content loads
    await expect(page.getByText(/SEO Page Audit/i)).toBeVisible({ timeout: 10000 });
  });

  test("/audit page does not import Admin layout components", async ({ page }) => {
    // This test verifies that /audit uses its own AppShell, not Admin's AppShell
    await page.goto("/audit", { waitUntil: "domcontentloaded" });
    const currentUrl = page.url();
    if (isAuthUrl(currentUrl)) {
      expect(/[?&]next=/.test(currentUrl), `Auth redirect missing next param: ${currentUrl}`).toBeTruthy();
      expect(/audit/i.test(decodeURIComponent(currentUrl)), `Expected audit in redirect target: ${currentUrl}`).toBeTruthy();
      return;
    }

    // Verify audit page uses the public AppShell (not Admin AppShell)
    // Public AppShell has dark background (#070A12), Admin AppShell has light background (bg-slate-50)
    const body = page.locator("body");
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Public AppShell should have dark background
    // This is a proxy check - if Admin AppShell was used, it would have light background
    expect(page.url()).toContain("/audit");
    
    // More reliable: check for public AppShell specific elements
    // Public AppShell has "SEO tools that feel instant" subtitle
    const subtitle = page.getByText(/SEO tools that feel instant/i);
    await expect(subtitle).toBeVisible({ timeout: 5000 });
  });
});
