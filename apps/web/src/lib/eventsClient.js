import { apiUrl } from "./api.js";

const CONSENT_KEY = "rp_cookie_consent";

function defer(fn) {
  if (typeof window === "undefined") return fn();
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => fn(), { timeout: 1500 });
    return;
  }
  window.setTimeout(fn, 0);
}

function isTrackingDisabled() {
  try {
    if (typeof window === "undefined") return true;
    if (window.__RP_DISABLE_TRACKING__ === true) return true;
    return window.localStorage.getItem(CONSENT_KEY) === "denied";
  } catch {
    return false;
  }
}

function mapGaEventName(name) {
  if (name === "signup") return "sign_up";
  if (name === "audit_run") return "run_audit";
  return name;
}

function sendGaEvent(name, props) {
  try {
    if (typeof window === "undefined") return;
    if (isTrackingDisabled()) return;
    if (typeof window.gtag !== "function") return;

    const mapped = mapGaEventName(String(name || "event"));
    const payload = props && typeof props === "object" ? props : {};
    if (mapped === "page_view") {
      window.gtag("event", "page_view", {
        page_title: String(payload.title || document.title || ""),
        page_location: String(payload.href || window.location.href || ""),
        page_path: String(payload.path || window.location.pathname || "")
      });
      return;
    }
    window.gtag("event", mapped, payload);
  } catch (_) {}
}

export function trackEvent(name, props = {}) {
  try {
    if (isTrackingDisabled()) return;

    const payload = {
      event: String(name || "event"),
      ts: new Date().toISOString(),
      props: props && typeof props === "object" ? props : {}
    };

    sendGaEvent(payload.event, payload.props);

    const json = JSON.stringify(payload);

    defer(() => {
      if (typeof window !== "undefined" && window.navigator && window.navigator.sendBeacon) {
        const blob = new Blob([json], { type: "application/json" });
        const ok = window.navigator.sendBeacon(apiUrl("/api/events"), blob);
        if (ok) return;
      }

      if (typeof window !== "undefined" && window.fetch) {
        window.fetch(apiUrl("/api/events"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: json,
          keepalive: true
        }).catch(() => {});
      }
    });
  } catch (_) {}
}

export const track = trackEvent;
