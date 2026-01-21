import React from "react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";

export default function SsgRouter({ children }) {
  if (typeof window === "undefined") {
    const path =
      (globalThis && globalThis.__VITE_REACT_SSG_CONTEXT__ && globalThis.__VITE_REACT_SSG_CONTEXT__.url) || "/";
    return <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>;
  }
  return <BrowserRouter>{children}</BrowserRouter>;
}
