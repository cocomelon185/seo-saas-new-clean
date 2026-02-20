import { ViteReactSSG } from "vite-react-ssg";
import routes from "./routes/marketingRoutes.jsx";
import "./styles/marketing.css";
import { initAnalytics } from "./lib/analytics.js";
import { initSentry } from "./lib/sentry.js";

if (typeof window !== "undefined") {
  initSentry();
  initAnalytics();
}

export const createRoot = ViteReactSSG({ routes });
