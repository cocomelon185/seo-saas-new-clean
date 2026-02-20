import React from "react";
import { Navigate } from "react-router-dom";

const Landing = React.lazy(() => import("../pages/Landing.jsx"));
const StartAuditPage = React.lazy(() => import("../pages/StartAuditPage.jsx"));
const SeoToolAuditPage = React.lazy(() => import("../pages/SeoToolAuditPage.jsx"));
const SeoAuditChecklistPage = React.lazy(() => import("../pages/SeoAuditChecklistPage.jsx"));
const TechnicalSeoAuditPage = React.lazy(() => import("../pages/TechnicalSeoAuditPage.jsx"));
const WebsiteSeoCheckerPage = React.lazy(() => import("../pages/WebsiteSeoCheckerPage.jsx"));
const SeoAuditForSaasPage = React.lazy(() => import("../pages/SeoAuditForSaasPage.jsx"));
const SeoReportTemplatePage = React.lazy(() => import("../pages/SeoReportTemplatePage.jsx"));
const PricingPage = React.lazy(() => import("../pages/PricingPage.jsx"));
const AboutPage = React.lazy(() => import("../pages/AboutPage.jsx"));
const ChangelogPage = React.lazy(() => import("../pages/ChangelogPage.jsx"));
const SharePage = React.lazy(() => import("../pages/SharePage.jsx"));
const SampleReportPage = React.lazy(() => import("../pages/SampleReportPage.jsx"));
const SaasLandingAuditPage = React.lazy(() => import("../pages/SaasLandingAuditPage.jsx"));
const BlogAuditChecklistPage = React.lazy(() => import("../pages/BlogAuditChecklistPage.jsx"));
const AgencyAuditWorkflowPage = React.lazy(() => import("../pages/AgencyAuditWorkflowPage.jsx"));
const EcommerceSeoAuditPage = React.lazy(() => import("../pages/EcommerceSeoAuditPage.jsx"));
const LocalBusinessSeoAuditPage = React.lazy(() => import("../pages/LocalBusinessSeoAuditPage.jsx"));
const RankyPulseVsAhrefsPage = React.lazy(() => import("../pages/RankyPulseVsAhrefsPage.jsx"));
const RankyPulseVsSemrushPage = React.lazy(() => import("../pages/RankyPulseVsSemrushPage.jsx"));
const FaqPage = React.lazy(() => import("../pages/FaqPage.jsx"));
const PrivacyPage = React.lazy(() => import("../pages/PrivacyPage.jsx"));
const TermsPage = React.lazy(() => import("../pages/TermsPage.jsx"));
const ContactPage = React.lazy(() => import("../pages/ContactPage.jsx"));
const SignInPage = React.lazy(() => import("../pages/SignInPage.jsx"));
const SignUpPage = React.lazy(() => import("../pages/SignUpPage.jsx"));
const AuditPage = React.lazy(() => import("../pages/AuditPage.jsx"));

const suspenseWrap = (element) => (
  <React.Suspense
    fallback={(
      <div className="min-h-screen bg-[#120a24] text-white flex items-center justify-center text-sm">
        Loading...
      </div>
    )}
  >
    {element}
  </React.Suspense>
);

const routes = [
  { path: "/", element: suspenseWrap(<Landing />) },
  { path: "/start", element: suspenseWrap(<StartAuditPage />) },
  { path: "/seo-tool-audit", element: suspenseWrap(<SeoToolAuditPage />) },
  { path: "/seo-audit-checklist", element: suspenseWrap(<SeoAuditChecklistPage />) },
  { path: "/technical-seo-audit", element: suspenseWrap(<TechnicalSeoAuditPage />) },
  { path: "/website-seo-checker", element: suspenseWrap(<WebsiteSeoCheckerPage />) },
  { path: "/seo-audit-for-saas", element: suspenseWrap(<SeoAuditForSaasPage />) },
  { path: "/seo-report-template", element: suspenseWrap(<SeoReportTemplatePage />) },
  { path: "/faq", element: suspenseWrap(<FaqPage />) },
  { path: "/privacy", element: suspenseWrap(<PrivacyPage />) },
  { path: "/terms", element: suspenseWrap(<TermsPage />) },
  { path: "/contact", element: suspenseWrap(<ContactPage />) },
  { path: "/compare/rankypulse-vs-ahrefs", element: suspenseWrap(<RankyPulseVsAhrefsPage />) },
  { path: "/compare/rankypulse-vs-semrush", element: suspenseWrap(<RankyPulseVsSemrushPage />) },
  { path: "/pricing", element: suspenseWrap(<PricingPage />) },
  { path: "/about", element: suspenseWrap(<AboutPage />) },
  { path: "/changelog", element: suspenseWrap(<ChangelogPage />) },
  { path: "/shared", element: suspenseWrap(<SharePage />) },
  { path: "/sample-report", element: suspenseWrap(<SampleReportPage />) },
  { path: "/audit", element: suspenseWrap(<AuditPage />) },
  { path: "/auth/signin", element: suspenseWrap(<SignInPage />) },
  { path: "/auth/signup", element: suspenseWrap(<SignUpPage />) },
  { path: "/use-cases/saas-landing-audit", element: suspenseWrap(<SaasLandingAuditPage />) },
  { path: "/use-cases/blog-audit-checklist", element: suspenseWrap(<BlogAuditChecklistPage />) },
  { path: "/use-cases/agency-audit-workflow", element: suspenseWrap(<AgencyAuditWorkflowPage />) },
  { path: "/use-cases/ecommerce-seo-audit", element: suspenseWrap(<EcommerceSeoAuditPage />) },
  { path: "/use-cases/local-business-seo-audit", element: suspenseWrap(<LocalBusinessSeoAuditPage />) },
  { path: "*", element: <Navigate to="/" replace /> }
];

export default routes;
