import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("SafeApexChart supports runtime apex kill switch", async () => {
  const source = await readFile(
    new URL("../src/components/charts/SafeApexChart.jsx", import.meta.url),
    "utf8"
  );

  expect(source).toContain("window.__DISABLE_APEX__ === true");
  expect(source).toMatch(/if \(apexDisabled\) \{[\s\S]*setApexChart\(\(\) => null\);/);
  expect(source).toMatch(/if \(apexDisabled \|\| !ApexChart \|\| !hasRenderableSeries\)/);
});

test("SafeApexChart enforces strict axis and non-axis series validation", async () => {
  const source = await readFile(
    new URL("../src/components/charts/SafeApexChart.jsx", import.meta.url),
    "utf8"
  );

  expect(source).toContain("function hasValidAxisSeries");
  expect(source).toContain("function hasValidNonAxisSeries");
  expect(source).toContain("hasValidAxisSeries(normalizedSeries)");
  expect(source).toContain("hasValidNonAxisSeries(normalizedSeries)");
});

test("app entrypoints support env-driven apex disable flag", async () => {
  const appEntry = await readFile(
    new URL("../src/main-app.jsx", import.meta.url),
    "utf8"
  );
  const ssgEntry = await readFile(
    new URL("../src/main-app-ssg.jsx", import.meta.url),
    "utf8"
  );

  expect(appEntry).toContain("VITE_DISABLE_APEX");
  expect(appEntry).toContain("window.__DISABLE_APEX__ = true");
  expect(ssgEntry).toContain("VITE_DISABLE_APEX");
  expect(ssgEntry).toContain("window.__DISABLE_APEX__ = true");
});
