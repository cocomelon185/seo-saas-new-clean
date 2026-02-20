import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const artifactsDir = path.join(rootDir, "artifacts");
const reportPath = path.join(artifactsDir, "junit", "playwright.json");
const summaryPath = path.join(artifactsDir, "summary.txt");

function collectResults(report) {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let flaky = 0;
  const failedTests = [];

  const visitSuite = (suite, parentTitles = []) => {
    const suiteTitle = String(suite?.title || "").trim();
    const currentTitles = suiteTitle ? [...parentTitles, suiteTitle] : parentTitles;

    for (const spec of suite?.specs || []) {
      const specTitle = String(spec?.title || "").trim();
      const testTitle = [...currentTitles, specTitle].filter(Boolean).join(" > ");

      for (const test of spec?.tests || []) {
        const results = Array.isArray(test?.results) ? test.results : [];
        const statuses = results.map((result) => String(result?.status || "").toLowerCase());

        const hasTimedOut = statuses.includes("timedout");
        const hasFailed = statuses.includes("failed") || statuses.includes("interrupted");
        const hasPassed = statuses.includes("passed");
        const hasSkipped = statuses.includes("skipped");

        const projectName = String(test?.projectName || "").trim();
        const namedTitle = projectName ? `${testTitle} [${projectName}]` : testTitle;

        if (hasTimedOut || hasFailed) {
          failed += 1;
          failedTests.push(namedTitle || "Unnamed test");
          continue;
        }

        if (hasPassed && hasSkipped) {
          flaky += 1;
          continue;
        }

        if (hasPassed) {
          passed += 1;
          continue;
        }

        if (hasSkipped || statuses.length === 0) {
          skipped += 1;
          continue;
        }

        failed += 1;
        failedTests.push(namedTitle || "Unnamed test");
      }
    }

    for (const child of suite?.suites || []) {
      visitSuite(child, currentTitles);
    }
  };

  for (const suite of report?.suites || []) {
    visitSuite(suite, []);
  }

  return {
    passed,
    failed,
    skipped,
    flaky,
    failedTests,
    total: passed + failed + skipped + flaky
  };
}

function main() {
  fs.mkdirSync(artifactsDir, { recursive: true });

  if (!fs.existsSync(reportPath)) {
    const summary = [
      "Pre-launch QA Summary",
      "Status: FAIL",
      "Reason: Missing Playwright JSON report at artifacts/junit/playwright.json"
    ].join("\n");
    fs.writeFileSync(summaryPath, `${summary}\n`, "utf8");
    console.log(summary);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const stats = collectResults(report);
  const status = stats.failed === 0 ? "PASS" : "FAIL";

  const lines = [
    "Pre-launch QA Summary",
    `Status: ${status}`,
    `Total: ${stats.total}`,
    `Passed: ${stats.passed}`,
    `Failed: ${stats.failed}`,
    `Skipped: ${stats.skipped}`,
    `Flaky: ${stats.flaky}`
  ];

  if (stats.failedTests.length) {
    lines.push("Failed tests:");
    for (const failedTest of stats.failedTests) {
      lines.push(`- ${failedTest}`);
    }
  }

  const summary = `${lines.join("\n")}\n`;
  fs.writeFileSync(summaryPath, summary, "utf8");
  console.log(summary);
}

main();
