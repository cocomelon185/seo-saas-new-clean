import React from "react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";

export default function SsgRouter({ children }) {
  if (typeof window === "undefined") return <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>;
  return <BrowserRouter>{children}</BrowserRouter>;
}
