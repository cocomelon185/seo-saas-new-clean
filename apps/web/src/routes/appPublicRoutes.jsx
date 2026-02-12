import React from "react";

const AuditPage = React.lazy(() => import("../pages/AuditPage.jsx"));
const UpgradePage = React.lazy(() => import("../pages/UpgradePage.jsx"));
const UpgradeSuccessPage = React.lazy(() => import("../pages/UpgradeSuccessPage.jsx"));
const PaymentFailurePage = React.lazy(() => import("../pages/PaymentFailurePage.jsx"));

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
  { path: "/audit", element: suspenseWrap(<AuditPage />) },
  { path: "/upgrade", element: suspenseWrap(<UpgradePage />) },
  { path: "/upgrade/success", element: suspenseWrap(<UpgradeSuccessPage />) },
  { path: "/upgrade/failure", element: suspenseWrap(<PaymentFailurePage />) }
];

export default routes;
