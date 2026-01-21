import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/Landing.jsx";
import AuditPage from "./pages/AuditPage.jsx";
import RankPage from "./pages/RankPage.jsx";
import ImprovePage from "./pages/ImprovePage.jsx";
import PricingPage from "./pages/PricingPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/rank" element={<RankPage />} />
        <Route path="/improve" element={<ImprovePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
