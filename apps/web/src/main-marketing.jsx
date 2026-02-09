import { ViteReactSSG } from "vite-react-ssg";
import routes from "./routes/marketingRoutes.jsx";
import "./styles/marketing.css";

export const createRoot = ViteReactSSG({ routes });
