/**
 * Navigate to the audit input page robustly
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{urlInput: import('@playwright/test').Locator, runButton: import('@playwright/test').Locator}>}
 */
export async function gotoAudit(page) {
  const paths = ["/audit", "/admin/audit", "/admin", "/app", "/"];

  for (const p of paths) {
    await page.goto(p, { waitUntil: "domcontentloaded" });
    
    // Wait a bit for React to render
    await page.waitForTimeout(500);
    
    // Check for audit page indicators - be more flexible with title matching
    const titleLocator = page.getByText(/SEO Page Audit/i);
    const hasTitle = (await titleLocator.count()) > 0;
    
    // Check for URL input
    const urlInputLabel = page.getByLabel("Page URL");
    const urlInputPlaceholder = page.locator('input[placeholder*="https://example.com/pricing"]');
    const hasUrlInput = (await urlInputLabel.count()) > 0 || (await urlInputPlaceholder.count()) > 0;
    
    if (hasTitle && hasUrlInput) {
      // Return the locators without strict mode to avoid collisions
      const urlInput = urlInputLabel.or(urlInputPlaceholder).first();
      
      const runButton = page.getByRole("button", { name: /^Run SEO Audit$/i }).or(
        page.getByRole("button", { name: /^Run Audit$/i })
      ).last();
      
      return { urlInput, runButton };
    }
  }

  throw new Error("Could not locate AuditPage (SEO Page Audit + Page URL input).");
}
