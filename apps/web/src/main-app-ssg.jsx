import "./ssg-shim.js";
import { ViteReactSSG } from "vite-react-ssg";
import routes from "./routes/appRoutes.jsx";
import "./index.css";
import "./styles/app.css";

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

export const createRoot = ViteReactSSG({ routes });
