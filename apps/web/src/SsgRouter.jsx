import { BrowserRouter, MemoryRouter } from "react-router-dom";

function pickPath() {
  const g = globalThis;

  // Try common SSG context shapes
  const ctx =
    g.__VITE_REACT_SSG_CONTEXT__ ||
    g.__vite_react_ssg_context__ ||
    g.__VITE_SSG_CONTEXT__ ||
    g.__ssg_context__ ||
    null;

  let v =
    (ctx && (ctx.url || ctx.path || ctx.pathname || ctx.route)) ||
    (typeof process !== "undefined" && process.env && (process.env.VITE_REACT_SSG_URL || process.env.SSG_URL)) ||
    (g.location && (g.location.pathname || g.location.href)) ||
    "/";

  try {
    if (typeof v === "string" && v.startsWith("http")) v = new URL(v).pathname;
  } catch {}

  if (typeof v !== "string" || !v.startsWith("/")) return "/";
  return v;
}

export default function SsgRouter({ children }) {
  if (typeof window === "undefined") {
    const path = pickPath();
    return <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>;
  }
  return <BrowserRouter>{children}</BrowserRouter>;
}
