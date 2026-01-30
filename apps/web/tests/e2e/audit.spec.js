import { expect, test } from "@playwright/test";
import auditFixture from "../fixtures/audit.json" assert { type: "json" };
import { promises as fs } from "fs";

const runAudit = async (page) => {
  await page.getByTestId("audit-url-input").fill(auditFixture.url);
  await page.getByTestId("audit-run-button").click();
  await expect(page.getByTestId("audit-score")).toBeVisible();
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

  await expect(page.getByTestId("audit-score")).toHaveText(String(auditFixture.score));
  await expect(page.getByText("Quick Wins")).toBeVisible();
  await expect(page.getByTestId("content-brief")).toBeVisible();
  await expect(page.getByText("Issues")).toBeVisible();
});

test("content brief renders and copy feedback works", async ({ page }) => {
  await runAudit(page);

  const copyButton = page.getByTestId("content-brief-copy");
  await expect(copyButton).toBeVisible();
  await copyButton.click();
  await expect(copyButton).toHaveText("Copied");
});

test("issue chips filter and clear filter works", async ({ page }) => {
  await runAudit(page);

  const issueButtons = page.getByTestId("issue-toggle");
  await expect(issueButtons).toHaveCount(3);

  await page.getByTestId("issue-filter-fix_now").click();
  await expect(issueButtons).toHaveCount(1);

  await page.getByRole("button", { name: "Clear filter" }).click();
  await expect(issueButtons).toHaveCount(3);
});

test("issue expands and collapses", async ({ page }) => {
  await runAudit(page);

  const issueButton = page.getByTestId("issue-toggle").first();
  await expect(issueButton).toHaveAttribute("aria-expanded", "false");
  const panelId = await issueButton.getAttribute("aria-controls");
  const panel = page.locator(`#${panelId}`);

  await issueButton.click();
  await expect(issueButton).toHaveAttribute("aria-expanded", "true");
  await expect(panel.getByText("Description")).toBeVisible();
  await expect(panel.getByText("How to fix")).toBeVisible();
  await expect(panel.getByText("Evidence")).toBeVisible();

  await issueButton.click();
  await expect(panel.getByText("Description")).toBeHidden();
});

test("export downloads a file and contains expected headings", async ({ page }, testInfo) => {
  await runAudit(page);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("audit-export-summary").click()
  ]);

  expect(download.suggestedFilename()).toBe("rankypulse-audit-summary.txt");

  const filePath = testInfo.outputPath("rankypulse-audit-summary.txt");
  await download.saveAs(filePath);

  const contents = await fs.readFile(filePath, "utf8");
  expect(contents).toContain("RankyPulse — SEO Audit Summary");
  expect(contents).toContain("Quick Wins:");
  expect(contents).toContain("Issues:");
  expect(contents).toContain("Content Brief:");
});
