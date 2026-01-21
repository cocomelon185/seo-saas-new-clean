import React from "react";
import { Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import AuditPage from "./pages/AuditPage.jsx";
import RankPage from "./pages/RankPage.jsx";
import ImprovePage from "./pages/ImprovePage.jsx";
import PricingPage from "./pages/PricingPage.jsx";

const routes = [
  { path: "/", element: <Landing /> },
  { path: "/audit", element: <AuditPage /> },
  { path: "/rank", element: <RankPage /> },
  { path: "/improve", element: <ImprovePage /> },
  { path: "/pricing", element: <PricingPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
];

export default routes;
