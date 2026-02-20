import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("queue action keeps success context and logs diagnostics", async () => {
  const source = await readFile(
    new URL("../src/pages/RankPage.jsx", import.meta.url),
    "utf8"
  );

  const fnMatch = source.match(/function queueKeywordFromActionPlan\(nextKeyword, actionLabel = "action_plan"\) \{[\s\S]*?\n {2}\}/);
  expect(fnMatch).toBeTruthy();
  const fnBody = fnMatch?.[0] || "";

  expect(fnBody).toContain("setForceFresh(true);");
  expect(fnBody).toContain("setQueuedActionMessage(");
  expect(fnBody).toContain("console.info(`[rank.queue]");
  expect(fnBody).toContain("try {");
  expect(fnBody).toContain("catch (err)");
  expect(fnBody).not.toContain('setStatus("idle")');
  expect(fnBody).not.toContain("setResult(null)");
  expect(fnBody).not.toContain('setLastCheckedAt("")');
});

test("action plan and content gap queue actions are action-specific", async () => {
  const source = await readFile(
    new URL("../src/pages/RankPage.jsx", import.meta.url),
    "utf8"
  );

  expect(source).toContain("queueKeywordFromActionPlan(fix.queueKeyword, fix.title)");
  expect(source).toContain('queueKeywordFromActionPlan(first, "content_gap_queue")');
  expect(source).toMatch(/safeActionableRecipe\s*=\s*asArray\(actionableRecipe\)/);
  expect(source).toMatch(/safePredictedActionRows\s*=\s*asArray\(predictedActionRows\)/);
  expect(source).toMatch(/safeActionableRecipe\.map\(\(fix\)\s*=>/);
  expect(source).toMatch(/safePredictedActionRows\.map\(\(row\)\s*=>/);
  expect(source).toMatch(/safeTopUrlsByScope\.length\s*\?\s*safeTopUrlsByScope\.map/);
  expect(source).toMatch(/safeCauseEffectTimeline\.length\s*\?\s*safeCauseEffectTimeline\.map/);
});
