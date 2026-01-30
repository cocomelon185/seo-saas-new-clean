import { expect, test } from "@playwright/test";
import auditFixture from "../fixtures/audit.json" assert { type: "json" };
import { promises as fs } from "fs";

const runAudit = async (page) => {
  await page.getByPlaceholder("https://example.com/pricing").fill(auditFixture.url);
  await page.getByRole("button", { name: "Run SEO Audit" }).click();
  await expect(page.getByText("SEO Score")).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/page-report", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(auditFixture)
    });
  });
  await page.goto("/audit");
});

test("audit renders score and sections", async ({ page }) => {
  await runAudit(page);

  await expect(page.getByText(String(auditFixture.score))).toBeVisible();
  await expect(page.getByText("Quick Wins")).toBeVisible();
  await expect(page.getByText("Content Brief")).toBeVisible();
  await expect(page.getByText("Issues")).toBeVisible();
});

test("content brief renders and copy feedback works", async ({ page }) => {
  await runAudit(page);

  const copyButton = page.getByRole("button", { name: "Copy" });
  await expect(copyButton).toBeVisible();
  await copyButton.click();
  await expect(copyButton).toHaveText("Copied");
});

test("issue chips filter and clear filter works", async ({ page }) => {
  await runAudit(page);

  const issueButtons = page.locator('button[aria-controls^="issue-panel-"]');
  await expect(issueButtons).toHaveCount(3);

  await page.getByRole("button", { name: /^Fix now/ }).click();
  await expect(issueButtons).toHaveCount(1);

  await page.getByRole("button", { name: "Clear filter" }).click();
  await expect(issueButtons).toHaveCount(3);
});

test("issue expands and collapses", async ({ page }) => {
  await runAudit(page);

  const issueButton = page.getByRole("button", { name: /Missing title tag/i });
  const panelId = await issueButton.getAttribute("aria-controls");
  const panel = page.locator(`#${panelId}`);

  await issueButton.click();
  await expect(panel.getByText("Description")).toBeVisible();
  await expect(panel.getByText("How to fix")).toBeVisible();
  await expect(panel.getByText("Evidence")).toBeVisible();

  await issueButton.click();
  await expect(panel.getByText("Description")).toBeHidden();
});

test("export downloads a file and contains expected headings", async ({ page }, testInfo) => {
  await runAudit(page);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export summary/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("rankypulse-audit-summary.txt");

  const filePath = testInfo.outputPath("rankypulse-audit-summary.txt");
  await download.saveAs(filePath);

  const contents = await fs.readFile(filePath, "utf8");
  expect(contents).toContain("RankyPulse — SEO Audit Summary");
  expect(contents).toContain("Quick Wins:");
  expect(contents).toContain("Issues:");
  expect(contents).toContain("Content Brief:");
});
