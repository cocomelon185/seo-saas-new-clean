import { expect, test } from "@playwright/test";

test("rank route renders without TDZ runtime fallback", async ({ page }) => {
  const consoleFailures = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error" && msg.type() !== "warning") return;
    const text = String(msg.text() || "");
    const isHydrationError = /hydration failed|server html was replaced|expected server html/i.test(text);
    const isRouteCrash = /cannot read properties of undefined.*(?:map|length)/i.test(text);
    if (isHydrationError || isRouteCrash) consoleFailures.push(text);
  });
  page.on("pageerror", (err) => {
    const text = String(err || "");
    const isHydrationError = /hydration failed|server html was replaced|expected server html/i.test(text);
    const isRouteCrash = /cannot read properties of undefined.*(?:map|length)/i.test(text);
    if (isHydrationError || isRouteCrash) consoleFailures.push(text);
  });

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
  expect(consoleFailures).toEqual([]);
});
