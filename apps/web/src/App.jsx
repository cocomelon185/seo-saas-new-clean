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
import EmbedWidgetPage from "./pages/EmbedWidgetPage.jsx";
import EmbedFormPage from "./pages/EmbedFormPage.jsx";
import LeadsPage from "./pages/LeadsPage.jsx";
import LeadDetailPage from "./pages/LeadDetailPage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import TeamSettingsPage from "./pages/TeamSettingsPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import InviteAcceptPage from "./pages/InviteAcceptPage.jsx";
import InviteAcceptedPage from "./pages/InviteAcceptedPage.jsx";
import SharePage from "./pages/SharePage.jsx";
import RequireAuth from "./routes/RequireAuth.jsx";

const routes = [
  { path: "/", element: <Landing /> },
  { path: "/start", element: <StartAuditPage /> },
  { path: "/shared", element: <SharePage /> },
  { path: "/audit", element: <AuditPage /> },
  { path: "/rank", element: <RequireAuth role="member"><RankPage /></RequireAuth> },
  { path: "/improve", element: <RequireAuth role="member"><ImprovePage /></RequireAuth> },
  { path: "/pricing", element: <PricingPage /> },
  { path: "/upgrade", element: <UpgradePage /> },
  { path: "/upgrade/success", element: <UpgradeSuccessPage /> },
  { path: "/upgrade/failure", element: <PaymentFailurePage /> },
  { path: "/plan-change", element: <PlanChangePage /> },
  { path: "/plan-change/success", element: <PlanChangeSuccessPage /> },
  { path: "/account/settings", element: <RequireAuth><AccountSettingsPage /></RequireAuth> },
  { path: "/account/deleted", element: <AccountDeletedPage /> },
  { path: "/changelog", element: <ChangelogPage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/use-cases/saas-landing-audit", element: <SaasLandingAuditPage /> },
  { path: "/use-cases/blog-audit-checklist", element: <BlogAuditChecklistPage /> },
  { path: "/use-cases/agency-audit-workflow", element: <AgencyAuditWorkflowPage /> },
  { path: "/embed", element: <RequireAuth role="admin"><EmbedWidgetPage /></RequireAuth> },
  { path: "/embed/form", element: <EmbedFormPage /> },
  { path: "/leads", element: <RequireAuth role="admin"><LeadsPage /></RequireAuth> },
  { path: "/leads/:id", element: <RequireAuth role="admin"><LeadDetailPage /></RequireAuth> },
  { path: "/auth/signin", element: <SignInPage /> },
  { path: "/auth/signup", element: <SignUpPage /> },
  { path: "/auth/reset", element: <ResetPasswordPage /> },
  { path: "/auth/verify", element: <VerifyEmailPage /> },
  { path: "/admin/team", element: <RequireAuth role="admin"><TeamSettingsPage /></RequireAuth> },
  { path: "/admin/analytics", element: <RequireAuth role="admin"><AnalyticsPage /></RequireAuth> },
  { path: "/auth/invite", element: <InviteAcceptPage /> },
  { path: "/auth/invite-accepted", element: <InviteAcceptedPage /> },
  { path: "/r/:reportId", element: <SharedReportPage /> },
  { path: "*", element: <Navigate to="/" replace /> }
];

export default routes;
