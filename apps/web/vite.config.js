import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: false,
    rollupOptions: {
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

          if (id.includes("/src/components/")) {
            if (id.includes("/src/components/")) return "app";
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
});
