import { apiUrl } from "./api.js";

export function trackEvent(name, props = {}) {
  try {
    const payload = {
      event: String(name || "event"),
      ts: new Date().toISOString(),
      props: props && typeof props === "object" ? props : {}
    };

    const json = JSON.stringify(payload);

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
  } catch (_) {}
}
