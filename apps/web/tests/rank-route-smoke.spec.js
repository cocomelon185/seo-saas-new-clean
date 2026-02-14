import { expect, test } from "@playwright/test";

test("rank route renders without TDZ runtime fallback", async ({ page }) => {
  await page.goto("/rank", { waitUntil: "domcontentloaded" });

  const hasRankHeading = await page.getByRole("heading", { name: "Rank Checker" }).count();
  if (hasRankHeading > 0) {
    await expect(page.getByRole("heading", { name: "Rank Checker" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Check Rank" })).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { name: "The cleanest way to turn SEO issues into shipped fixes." })).toBeVisible();
  }

  await expect(page.getByText("Rank Checker temporarily unavailable")).toHaveCount(0);
  await expect(page.getByText(/before initialization/i)).toHaveCount(0);
});
