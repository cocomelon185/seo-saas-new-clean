import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = "http://localhost:5173";
const outDir = path.join(process.cwd(), "apps", "web", "public", "landing");

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function capturePage(page, url, outPath) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: outPath, fullPage: false });
}

async function main() {
  await ensureDir(outDir);

  const armExecutable = path.join(
    process.env.HOME || "",
    "Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell"
  );
  let executablePath = undefined;
  try {
    await fs.access(armExecutable);
    executablePath = armExecutable;
  } catch {}

  const browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {})
  });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1200 }
  });

  await context.addInitScript(() => {
    localStorage.setItem("rp_auth_token", "demo-token");
    localStorage.setItem(
      "rp_auth_user",
      JSON.stringify({ name: "Demo User", role: "admin", verified: true })
    );
  });

  const page = await context.newPage();
  await capturePage(page, `${baseUrl}/audit`, path.join(outDir, "feature-audit.png"));
  await capturePage(page, `${baseUrl}/rank`, path.join(outDir, "feature-priorities.png"));
  await capturePage(page, `${baseUrl}/improve`, path.join(outDir, "feature-report.png"));
  await capturePage(page, `${baseUrl}/start`, path.join(outDir, "feature-start.png"));

  await browser.close();
  console.log("Screenshots captured.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
