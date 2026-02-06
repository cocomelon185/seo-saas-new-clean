export function track(event, payload = {}) {
  try {
    if (typeof window === "undefined") {
      return;
    }

    if (window.__RP_DISABLE_TRACKING__) {
      return;
    }
    try {
      const consent = window.localStorage.getItem("rp_cookie_consent");
      if (consent !== "granted") {
        return;
      }
    } catch {
      return;
    }

    const body = {
      event,
      payload,
      ts: Date.now(),
      url: window.location.href,
      ua: window.navigator ? window.navigator.userAgent : ""
    };

    if (window.navigator && typeof window.navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
      window.navigator.sendBeacon("/api/events", blob);
      return;
    }

    window.fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true
    }).catch(() => {});
  } catch (err) {
    return;
  }
}
