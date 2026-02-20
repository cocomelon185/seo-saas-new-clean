import { trackEvent } from "./eventsClient.js";

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

function getMeasurementId() {
  return String(import.meta.env.VITE_GA4_MEASUREMENT_ID || "").trim();
}

function loadGtag(measurementId) {
  if (typeof window === "undefined") return;
  if (!measurementId) return;
  if (window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false
  });
}

function emitPageView() {
  if (typeof window === "undefined") return;
  if (isTrackingDisabled()) return;

  const path = `${window.location.pathname}${window.location.search}`;
  trackEvent("page_view", {
    path,
    href: window.location.href,
    title: document.title || ""
  });
}

export function initAnalytics() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (isTrackingDisabled()) return;
  initialized = true;

  const measurementId = getMeasurementId();
  if (measurementId) {
    loadGtag(measurementId);
  }

  let lastRoute = "";
  const sendRouteView = () => {
    const route = `${window.location.pathname}${window.location.search}`;
    if (route === lastRoute) return;
    lastRoute = route;
    emitPageView();
  };

  sendRouteView();

  const onPopState = () => sendRouteView();
  window.addEventListener("popstate", onPopState);

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function pushStatePatched(...args) {
    const result = originalPushState(...args);
    sendRouteView();
    return result;
  };

  history.replaceState = function replaceStatePatched(...args) {
    const result = originalReplaceState(...args);
    sendRouteView();
    return result;
  };
}
