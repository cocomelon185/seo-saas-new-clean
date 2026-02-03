import React from "react";
import { Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import AuditPage from "./pages/AuditPage.jsx";
import RankPage from "./pages/RankPage.jsx";
import ImprovePage from "./pages/ImprovePage.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import UpgradePage from "./pages/UpgradePage.jsx";
import UpgradeSuccessPage from "./pages/UpgradeSuccessPage.jsx";
import PaymentFailurePage from "./pages/PaymentFailurePage.jsx";
import PlanChangePage from "./pages/PlanChangePage.jsx";
import PlanChangeSuccessPage from "./pages/PlanChangeSuccessPage.jsx";
import AccountSettingsPage from "./pages/AccountSettingsPage.jsx";
import AccountDeletedPage from "./pages/AccountDeletedPage.jsx";
import ChangelogPage from "./pages/ChangelogPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import SharedReportPage from "./pages/SharedReportPage.jsx";
import StartAuditPage from "./pages/StartAuditPage.jsx";
import SaasLandingAuditPage from "./pages/SaasLandingAuditPage.jsx";
import BlogAuditChecklistPage from "./pages/BlogAuditChecklistPage.jsx";
import AgencyAuditWorkflowPage from "./pages/AgencyAuditWorkflowPage.jsx";

const routes = [
  { path: "/", element: <Landing /> },
  { path: "/start", element: <StartAuditPage /> },
  { path: "/audit", element: <AuditPage /> },
  { path: "/rank", element: <RankPage /> },
  { path: "/improve", element: <ImprovePage /> },
  { path: "/pricing", element: <PricingPage /> },
  { path: "/upgrade", element: <UpgradePage /> },
  { path: "/upgrade/success", element: <UpgradeSuccessPage /> },
  { path: "/upgrade/failure", element: <PaymentFailurePage /> },
  { path: "/plan-change", element: <PlanChangePage /> },
  { path: "/plan-change/success", element: <PlanChangeSuccessPage /> },
  { path: "/account/settings", element: <AccountSettingsPage /> },
  { path: "/account/deleted", element: <AccountDeletedPage /> },
  { path: "/changelog", element: <ChangelogPage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/use-cases/saas-landing-audit", element: <SaasLandingAuditPage /> },
  { path: "/use-cases/blog-audit-checklist", element: <BlogAuditChecklistPage /> },
  { path: "/use-cases/agency-audit-workflow", element: <AgencyAuditWorkflowPage /> },
  { path: "/r/:reportId", element: <SharedReportPage /> },
  { path: "*", element: <Navigate to="/" replace /> }
];

export default routes;
