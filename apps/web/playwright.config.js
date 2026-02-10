import { defineConfig } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const defaultBrowser = process.env.PW_BROWSER || "chromium";
const isChromium = defaultBrowser === "chromium";
const isDarwin = process.platform === "darwin";
const useSystemChrome = process.env.PW_USE_SYSTEM_CHROME === "true";
const chromiumChannel =
  isDarwin && isChromium && useSystemChrome ? "chrome" : undefined;

if (isDarwin && !isCI) {
  process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE =
    process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE || "mac-arm64";
}

const testPort = process.env.RP_TEST_PORT || "5173";
const testHost = process.env.RP_TEST_HOST || "127.0.0.1";
const baseURL = process.env.RP_BASE_URL || `http://${testHost}:${testPort}`;
const disableWebServer = process.env.RP_DISABLE_WEBSERVER === "true";
const headless = process.env.PW_HEADLESS !== "false";

export default defineConfig({
  testDir: "./tests",
  timeout: 90000,
  workers: isCI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    headless,
    browserName: defaultBrowser,
    viewport: { width: 1280, height: 800 },
    trace: "on-first-retry",
    launchOptions: isChromium
      ? {
          ...(chromiumChannel ? { channel: chromiumChannel } : {}),
          args: [
            "--disable-dev-shm-usage",
            "--disable-crashpad",
            "--disable-crash-reporter",
            "--no-crashpad",
            ...(process.platform === "linux" ? ["--no-sandbox"] : []),
          ]
        }
      : undefined
  },
  webServer: disableWebServer ? undefined : {
    command: `npm run dev -- --host ${testHost} --port ${testPort} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
