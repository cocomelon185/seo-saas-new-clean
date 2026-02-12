import { createRoot as marketingCreateRoot } from "./main-marketing.jsx";
import { createRoot as appPublicCreateRoot } from "./main-app-ssg.jsx";

export const createRoot =
  import.meta.env.MODE === "app-public" ? appPublicCreateRoot : marketingCreateRoot;
