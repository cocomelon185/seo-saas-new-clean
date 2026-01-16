import { Routes, Route, Navigate } from "react-router-dom";

import Index from "./views/Index.js";
import Admin from "./layouts/Admin.js";
import Auth from "./layouts/Auth.js";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/admin/*" element={<Admin />} />
      <Route path="/auth/*" element={<Auth />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
