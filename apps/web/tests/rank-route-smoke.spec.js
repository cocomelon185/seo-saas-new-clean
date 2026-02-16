import { expect, test } from "@playwright/test";

test("core routes render without hydration or chart runtime fallback", async ({ page }) => {
  const consoleFailures = [];
  const failurePattern = /hydration failed|server html was replaced|expected server html|cannot read properties of undefined.*(?:map|length)/i;
  page.on("console", (msg) => {
    if (msg.type() !== "error" && msg.type() !== "warning") return;
    const text = String(msg.text() || "");
    if (failurePattern.test(text)) consoleFailures.push(text);
  });
  page.on("pageerror", (err) => {
    const text = String(err || "");
    if (failurePattern.test(text)) consoleFailures.push(text);
  });

  for (const route of ["/", "/audit", "/rank"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    await expect(page.getByText("Unexpected Application Error!")).toHaveCount(0);
    await expect(page.getByText(/cannot read properties of undefined/i)).toHaveCount(0);
  }

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
