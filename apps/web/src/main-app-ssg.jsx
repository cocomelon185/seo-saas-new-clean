import "./ssg-shim.js";
import { ViteReactSSG } from "vite-react-ssg";
import routes from "./routes/appRoutes.jsx";
import "./index.css";
import "./styles/app.css";

export const createRoot = ViteReactSSG({ routes });
