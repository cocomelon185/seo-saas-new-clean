import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("queue action keeps success context and logs diagnostics", async () => {
  const source = await readFile(
    new URL("../src/pages/RankPage.jsx", import.meta.url),
    "utf8"
  );

  const fnMatch = source.match(/function queueKeywordFromActionPlan\(nextKeyword, actionLabel = "action_plan"\) \{[\s\S]*?\n  \}/);
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
  expect(source).toContain("const safeActionableRecipe = asArray(actionableRecipe);");
  expect(source).toContain("const safePredictedActionRows = asArray(predictedActionRows);");
  expect(source).toContain("safeActionableRecipe.map((fix) => (");
  expect(source).toContain("safePredictedActionRows.map((row) => (");
  expect(source).toContain("safeTopUrlsByScope.length ? safeTopUrlsByScope.map");
  expect(source).toContain("safeCauseEffectTimeline.length ? safeCauseEffectTimeline.map");
});
