/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/pages/Landing.jsx",
    "./src/pages/StartAuditPage.jsx",
    "./src/pages/PricingPage.jsx",
    "./src/pages/AboutPage.jsx",
    "./src/pages/ChangelogPage.jsx",
    "./src/pages/SharePage.jsx",
    "./src/pages/SaasLandingAuditPage.jsx",
    "./src/pages/BlogAuditChecklistPage.jsx",
    "./src/pages/AgencyAuditWorkflowPage.jsx",
    "./src/marketing/components/**/*.jsx",
    "./src/components/DeferredRender.jsx",
    "./src/components/CookieConsent.jsx",
    "./src/components/Icons.jsx",
    "./src/components/ScreenshotGrid.jsx",
    "./src/styles/marketing.css"
  ],
  theme: { extend: {} },
  plugins: [],
};
