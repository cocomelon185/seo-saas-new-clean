import * as Sentry from "@sentry/react";

const CONSENT_KEY = "rp_cookie_consent";
let initialized = false;

function isTrackingDisabled() {
  if (typeof window === "undefined") return true;
  if (window.__RP_DISABLE_TRACKING__ === true) return true;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "denied";
  } catch {
    return false;
  }
}

export function initSentry() {
  if (initialized) return;
  initialized = true;

  if (typeof window === "undefined") return;
  if (!import.meta.env.PROD) return;
  if (isTrackingDisabled()) return;

  const dsn = String(import.meta.env.VITE_SENTRY_DSN || "").trim();
  if (!dsn) return;

  const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1);
  const environment = String(import.meta.env.VITE_SENTRY_ENVIRONMENT || "production");
  const release = String(import.meta.env.VITE_SENTRY_RELEASE || "").trim() || undefined;

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.1,
    integrations: [Sentry.browserTracingIntegration()],
    sendDefaultPii: false
  });
}
