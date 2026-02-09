import React from "react";
import { Navigate } from "react-router-dom";
import RequireAuth from "./routes/RequireAuth.jsx";

const Landing = React.lazy(() => import("./pages/Landing.jsx"));
const AuditPage = React.lazy(() => import("./pages/AuditPage.jsx"));
const RankPage = React.lazy(() => import("./pages/RankPage.jsx"));
const ImprovePage = React.lazy(() => import("./pages/ImprovePage.jsx"));
const PricingPage = React.lazy(() => import("./pages/PricingPage.jsx"));
const UpgradePage = React.lazy(() => import("./pages/UpgradePage.jsx"));
const UpgradeSuccessPage = React.lazy(() => import("./pages/UpgradeSuccessPage.jsx"));
const PaymentFailurePage = React.lazy(() => import("./pages/PaymentFailurePage.jsx"));
const PlanChangePage = React.lazy(() => import("./pages/PlanChangePage.jsx"));
const PlanChangeSuccessPage = React.lazy(() => import("./pages/PlanChangeSuccessPage.jsx"));
const AccountSettingsPage = React.lazy(() => import("./pages/AccountSettingsPage.jsx"));
const AccountDeletedPage = React.lazy(() => import("./pages/AccountDeletedPage.jsx"));
const ChangelogPage = React.lazy(() => import("./pages/ChangelogPage.jsx"));
const AboutPage = React.lazy(() => import("./pages/AboutPage.jsx"));
const SharedReportPage = React.lazy(() => import("./pages/SharedReportPage.jsx"));
const StartAuditPage = React.lazy(() => import("./pages/StartAuditPage.jsx"));
const SaasLandingAuditPage = React.lazy(() => import("./pages/SaasLandingAuditPage.jsx"));
const BlogAuditChecklistPage = React.lazy(() => import("./pages/BlogAuditChecklistPage.jsx"));
const AgencyAuditWorkflowPage = React.lazy(() => import("./pages/AgencyAuditWorkflowPage.jsx"));
const EmbedWidgetPage = React.lazy(() => import("./pages/EmbedWidgetPage.jsx"));
const EmbedFormPage = React.lazy(() => import("./pages/EmbedFormPage.jsx"));
const LeadsPage = React.lazy(() => import("./pages/LeadsPage.jsx"));
const LeadDetailPage = React.lazy(() => import("./pages/LeadDetailPage.jsx"));
const SignInPage = React.lazy(() => import("./pages/SignInPage.jsx"));
const SignUpPage = React.lazy(() => import("./pages/SignUpPage.jsx"));
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage.jsx"));
const VerifyEmailPage = React.lazy(() => import("./pages/VerifyEmailPage.jsx"));
const TeamSettingsPage = React.lazy(() => import("./pages/TeamSettingsPage.jsx"));
const AnalyticsPage = React.lazy(() => import("./pages/AnalyticsPage.jsx"));
const InviteAcceptPage = React.lazy(() => import("./pages/InviteAcceptPage.jsx"));
const InviteAcceptedPage = React.lazy(() => import("./pages/InviteAcceptedPage.jsx"));
const SharePage = React.lazy(() => import("./pages/SharePage.jsx"));

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
  { path: "/shared", element: suspenseWrap(<SharePage />) },
  { path: "/audit", element: suspenseWrap(<AuditPage />) },
  { path: "/rank", element: <RequireAuth role="member">{suspenseWrap(<RankPage />)}</RequireAuth> },
  { path: "/improve", element: <RequireAuth role="member">{suspenseWrap(<ImprovePage />)}</RequireAuth> },
  { path: "/pricing", element: suspenseWrap(<PricingPage />) },
  { path: "/upgrade", element: suspenseWrap(<UpgradePage />) },
  { path: "/upgrade/success", element: suspenseWrap(<UpgradeSuccessPage />) },
  { path: "/upgrade/failure", element: suspenseWrap(<PaymentFailurePage />) },
  { path: "/plan-change", element: suspenseWrap(<PlanChangePage />) },
  { path: "/plan-change/success", element: suspenseWrap(<PlanChangeSuccessPage />) },
  { path: "/account/settings", element: <RequireAuth>{suspenseWrap(<AccountSettingsPage />)}</RequireAuth> },
  { path: "/account/deleted", element: suspenseWrap(<AccountDeletedPage />) },
  { path: "/changelog", element: suspenseWrap(<ChangelogPage />) },
  { path: "/about", element: suspenseWrap(<AboutPage />) },
  { path: "/use-cases/saas-landing-audit", element: suspenseWrap(<SaasLandingAuditPage />) },
  { path: "/use-cases/blog-audit-checklist", element: suspenseWrap(<BlogAuditChecklistPage />) },
  { path: "/use-cases/agency-audit-workflow", element: suspenseWrap(<AgencyAuditWorkflowPage />) },
  { path: "/embed", element: <RequireAuth role="admin">{suspenseWrap(<EmbedWidgetPage />)}</RequireAuth> },
  { path: "/embed/form", element: suspenseWrap(<EmbedFormPage />) },
  { path: "/leads", element: <RequireAuth role="admin">{suspenseWrap(<LeadsPage />)}</RequireAuth> },
  { path: "/leads/:id", element: <RequireAuth role="admin">{suspenseWrap(<LeadDetailPage />)}</RequireAuth> },
  { path: "/auth/signin", element: suspenseWrap(<SignInPage />) },
  { path: "/auth/signup", element: suspenseWrap(<SignUpPage />) },
  { path: "/auth/reset", element: suspenseWrap(<ResetPasswordPage />) },
  { path: "/auth/verify", element: suspenseWrap(<VerifyEmailPage />) },
  { path: "/admin/team", element: <RequireAuth role="admin">{suspenseWrap(<TeamSettingsPage />)}</RequireAuth> },
  { path: "/admin/analytics", element: <RequireAuth role="admin">{suspenseWrap(<AnalyticsPage />)}</RequireAuth> },
  { path: "/auth/invite", element: suspenseWrap(<InviteAcceptPage />) },
  { path: "/auth/invite-accepted", element: suspenseWrap(<InviteAcceptedPage />) },
  { path: "/r/:reportId", element: suspenseWrap(<SharedReportPage />) },
  { path: "*", element: <Navigate to="/" replace /> }
];

export default routes;
