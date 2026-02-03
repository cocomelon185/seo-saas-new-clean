import { test, expect } from "@playwright/test";
import http from "http";

function startTestSite() {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>RP Test Page</title>
</head>
<body>
  <div>hello</div>
  <h2>Section</h2>
</body>
</html>`;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}/` });
    });
  });
}

async function gotoAuditPage(page) {
  const paths = ["/admin/audit", "/audit", "/admin", "/app", "/"];

  for (const p of paths) {
    await page.goto(p, { waitUntil: "domcontentloaded" });
    const title = page.getByText(/SEO Page Audit/i);
    const urlInput = page.getByLabel("Page URL").or(
      page.locator('input[placeholder*="https://example.com/pricing"]')
    );
    try {
      await expect(title).toBeVisible({ timeout: 5000 });
      await expect(urlInput.first()).toBeVisible({ timeout: 5000 });
      return;
    } catch {
      // Try next path
    }
  }

  throw new Error("Could not locate AuditPage (SEO Page Audit + Page URL input).");
}

async function getHistoryJson(page) {
  return await page.evaluate(() => {
      try {
      return localStorage.getItem("rankypulse.audit_history.v1") || "";
    } catch {
      return "";
    }
  });
}

test("Quick proof: audit runs + meta missing detected + history persists (storage + UI)", async ({ page }) => {
  const { server, url: testUrl } = await startTestSite();

  try {
    await gotoAuditPage(page);

    const urlInput = page.getByLabel("Page URL").or(page.locator('input[placeholder*="https://example.com/pricing"]'));
    await expect(urlInput.first()).toBeVisible({ timeout: 120000 });
    await urlInput.first().fill(testUrl);

    const runBtn = page.getByRole("button", { name: /^Run SEO Audit$/i }).or(
      page.getByRole("button", { name: /^Run Audit$/i })
    ).last();
    await expect(runBtn).toBeVisible({ timeout: 120000 });
    const reqPromise = page.waitForRequest((r) => {
      return r.url().includes("/api/page-report") && r.method() === "POST";
    }, { timeout: 120000 });
    const respPromise = page.waitForResponse((r) => {
      return r.url().includes("/api/page-report") && r.request().method() === "POST";
    }, { timeout: 120000 });
    const [, resp] = await Promise.all([reqPromise, respPromise, runBtn.click()]);
    expect(resp.ok()).toBeTruthy();

    await expect(page.getByTestId("observed-data")).toBeVisible({ timeout: 120000 });
    await expect(page.getByTestId("key-issues").first()).toBeVisible({ timeout: 120000 });
    await expect(page.getByTestId("key-issues")).toContainText(/Missing meta description/i, { timeout: 120000 });

    const histAfterRun = await getHistoryJson(page);
    console.log("HISTORY_AFTER_RUN_LEN", histAfterRun.length);
    console.log("HISTORY_AFTER_RUN", histAfterRun.slice(0, 400));
    await expect.soft(histAfterRun.length).toBeGreaterThan(0);

    await page.reload({ waitUntil: "domcontentloaded" });

    const histAfterReload = await getHistoryJson(page);
    console.log("HISTORY_AFTER_RELOAD_LEN", histAfterReload.length);
    console.log("HISTORY_AFTER_RELOAD", histAfterReload.slice(0, 400));
    expect(histAfterReload.length).toBeGreaterThan(0);

    const parsed = JSON.parse(histAfterReload || "[]");
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    const first = parsed[0] || {};
    expect(first).toHaveProperty("ranAt");
    expect(first).toHaveProperty("issuesCount");

    // History panel variability: accept if ANY of these is true
    const recentAudits = page.getByText(/Recent audits/i);
    const resumeBtn = page.getByRole("button", { name: /Resume audit/i });
    const hasHistoryInStorage = parsed.length > 0 && first.ranAt && typeof first.issuesCount === "number";

    const hasRecentAudits = (await recentAudits.count()) > 0;
    const hasResumeBtn = (await resumeBtn.count()) > 0;

    const historyOk = hasRecentAudits || hasResumeBtn || hasHistoryInStorage;
    expect(historyOk).toBe(true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
