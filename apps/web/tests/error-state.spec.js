import { test, expect } from "@playwright/test";
import { gotoAudit } from "./_helpers/nav.js";

const isAuthUrl = (url) => /\/auth\/(signin|signup)(?:[/?#]|$)/.test(url);

test("Error state renders with retry button", async ({ page }) => {
  // Use a URL that will fail (invalid port)
  const failingUrl = "http://127.0.0.1:1";

  try {
    await page.goto("/audit", { waitUntil: "domcontentloaded" });
    const currentUrl = page.url();
    if (isAuthUrl(currentUrl)) {
      expect(/[?&]next=/.test(currentUrl), `Auth redirect missing next param: ${currentUrl}`).toBeTruthy();
      expect(/audit/i.test(decodeURIComponent(currentUrl)), `Expected audit in redirect target: ${currentUrl}`).toBeTruthy();
      return;
    }

    const urlInput = page.getByLabel("Page URL").or(
      page.locator('input[placeholder*="https://example.com/pricing"]')
    ).first();
    const runButton = page.getByRole("button", { name: /^Run SEO Audit$/i }).or(
      page.getByRole("button", { name: /^Run Audit$/i })
    ).last();

    // Run audit with failing URL
    await expect(urlInput).toBeVisible({ timeout: 120000 });
    await urlInput.fill(failingUrl);
    await expect(runButton).toBeVisible({ timeout: 120000 });
    await runButton.click();

    // Assert error UI appears - look for error message text
    // Error message could be "Network error", "Request failed", or other error messages
    const errorMessage = page.getByText(/Network error|Request failed|error|failed/i);
    await expect(errorMessage.first()).toBeVisible({ timeout: 120000 });

    // The retry button is the main "Run SEO Audit" button (not a separate retry button)
    const retryButton = page.getByRole("button", { name: /^Run SEO Audit$/i }).or(
      page.getByRole("button", { name: /^Run Audit$/i })
    );
    
    await expect(retryButton).toBeVisible({ timeout: 10000 });
    
    // Set up waiters BEFORE clicking to ensure we catch the request
    const rerunReqPromise = page.waitForRequest((r) => {
      return r.url().includes("/api/page-report") && r.method() === "POST";
    }, { timeout: 120000 });
    const rerunRespPromise = page.waitForResponse((r) => {
      return r.url().includes("/api/page-report") && r.request().method() === "POST";
    }, { timeout: 120000 });

    // Click and wait for request/response
    const [, resp] = await Promise.all([rerunReqPromise, rerunRespPromise, retryButton.click()]);
    
    // Assert response was received
    expect(resp).toBeTruthy();
    
    let payload = null;
    try {
      payload = await resp.json();
    } catch {}

    // Only assert results UI when BOTH HTTP is ok AND payload.ok is true
    if (resp.ok() && payload && payload.ok === true) {
      await expect(page.getByTestId("observed-data")).toBeVisible({ timeout: 120000 });
      await expect(page.getByTestId("key-issues")).toBeVisible({ timeout: 120000 });
    } else {
      await page.waitForTimeout(250);
      // Check for any error state, loading state, or results
      const hasError = (await page.getByText(/error|failed/i).count()) > 0 || 
                       (await page.locator('div.rounded-2xl.border-rose-400').count()) > 0;
      const hasLoading = (await page.getByText(/Running|Loading|Analyzing/i).count()) > 0;
      const hasResults = (await page.getByTestId("observed-data").count()) > 0;
      expect(hasError || hasLoading || hasResults).toBe(true);
    }
// Body should not be blank
    const bodyText = await page.textContent("body");
    expect(bodyText?.length).toBeGreaterThan(0);
  } catch (error) {
    // If the error state doesn't appear, that's also a failure
    throw error;
  }
});
