import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function deferCss() {
  return {
    name: "defer-css",
    enforce: "post",
    transformIndexHtml(html) {
      return html.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi, (match) => {
        const hrefMatch = match.match(/href=["']([^"']+)["']/i);
        if (!hrefMatch) return match;
        const href = hrefMatch[1];
        const integrityMatch = match.match(/integrity=["']([^"']+)["']/i);
        const crossoriginMatch = match.match(/crossorigin(?:=["']([^"']*)["'])?/i);
        const referrerMatch = match.match(/referrerpolicy=["']([^"']+)["']/i);
        const attrs = [
          integrityMatch ? ` integrity="${integrityMatch[1]}"` : "",
          crossoriginMatch ? (crossoriginMatch[1] ? ` crossorigin="${crossoriginMatch[1]}"` : " crossorigin") : "",
          referrerMatch ? ` referrerpolicy="${referrerMatch[1]}"` : ""
        ].join("");

        return [
          `<link rel="preload" as="style" href="${href}"${attrs}>`,
          `<link rel="stylesheet" href="${href}"${attrs} media="print" data-rp-defer="style">`,
          `<noscript><link rel="stylesheet" href="${href}"${attrs}></noscript>`
        ].join("");
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), deferCss()],
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
