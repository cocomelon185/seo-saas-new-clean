import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isAppBuild = mode === "app" || mode === "app-public";
  const isAppPublicBuild = mode === "app-public";
  return {
    plugins: [react()],
    ...(isAppPublicBuild
      ? {
          ssgOptions: {
            entry: "src/main-app-ssg.jsx",
            htmlEntry: "app-public.html",
            mock: true
          }
        }
      : {}),
    build: {
      modulePreload: false,
      emptyOutDir: !isAppBuild,
      rollupOptions: {
        input: fileURLToPath(new URL(
          isAppPublicBuild ? "./app-public.html" : isAppBuild ? "./app.html" : "./index.html",
          import.meta.url
        )),
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("chart.js")) return "charts";
              if (id.includes("@fortawesome")) return "icons";
              return "vendor";
            }

            if (id.includes("/src/pages/")) {
              const marketingPages = [
                "/src/pages/Landing.jsx",
                "/src/pages/StartAuditPage.jsx",
                "/src/pages/PricingPage.jsx",
                "/src/pages/AboutPage.jsx",
                "/src/pages/SharePage.jsx",
                "/src/pages/SaasLandingAuditPage.jsx",
                "/src/pages/BlogAuditChecklistPage.jsx",
                "/src/pages/AgencyAuditWorkflowPage.jsx"
              ];

              if (marketingPages.some((page) => id.includes(page))) {
                return "marketing";
              }

              return "app";
            }

            return undefined;
          }
        }
      }
    },
    server: {
      port: 5173,
      strictPort: true,
      host: "127.0.0.1",
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
