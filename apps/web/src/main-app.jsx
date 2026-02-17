import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { setCanonical } from "./lib/canonical.js";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./routes/appRoutes.jsx";
import "./index.css";
import "./styles/app.css";
import { initTelemetry } from "./lib/telemetry.js";



const root = document.getElementById("root");

if (root) {
  initTelemetry({ sampleRate: 1.0, consoleErrorForwarding: true });
setCanonical(window.location.href);

ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}
