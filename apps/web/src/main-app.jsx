import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { setCanonical } from "./lib/canonical.js";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./routes/appRoutes.jsx";
import "./index.css";
import "./styles/app.css";
import { initTelemetry } from "./lib/telemetry.js";
import { initAnalytics } from "./lib/analytics.js";
import { initSentry } from "./lib/sentry.js";

if (typeof window !== "undefined") {
  const disableApex = String(import.meta.env.VITE_DISABLE_APEX || "").toLowerCase() === "true";
  if (disableApex) {
    window.__DISABLE_APEX__ = true;
  }

  const enableAccountSettingsApi = String(import.meta.env.VITE_ENABLE_ACCOUNT_SETTINGS_API || "").toLowerCase() === "true";
  if (!enableAccountSettingsApi && typeof window.fetch === "function") {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const method = String(init?.method || "GET").toUpperCase();
      const rawUrl = typeof input === "string" ? input : (input && typeof input.url === "string" ? input.url : "");
      const isAccountSettingsGet = method === "GET" && /\/api\/account-settings(?:\?|$)/.test(rawUrl);
      if (isAccountSettingsGet) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ok: true,
              settings: {
                require_verified: false,
                allow_audit: true,
                allow_rank: true,
                allow_improve: true
              }
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return originalFetch(input, init);
    };
  }
}

const router = createBrowserRouter(routes);

function CanonicalManager() {
  useEffect(() => {
    try {
      const update = () => setCanonical(window.location.href);

      update();

      window.addEventListener("popstate", update);

      const pushState = history.pushState;
      const replaceState = history.replaceState;

      history.pushState = function (...args) {
        const r = pushState.apply(this, args);
        update();
        return r;
      };

      history.replaceState = function (...args) {
        const r = replaceState.apply(this, args);
        update();
        return r;
      };

      return () => {
        window.removeEventListener("popstate", update);
        history.pushState = pushState;
        history.replaceState = replaceState;
      };
    } catch {}
  }, []);

  return null;
}

const root = document.getElementById("root");

if (root) {
  initSentry();
  initAnalytics();
  initTelemetry({ sampleRate: 1.0, consoleErrorForwarding: true });

ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}
