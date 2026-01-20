import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuditPage from "./pages/AuditPage.jsx";
import RankPage from "./pages/RankPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/audit" replace />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/rank" element={<RankPage />} />
        <Route path="*" element={<Navigate to="/audit" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
