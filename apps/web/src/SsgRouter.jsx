import React from "react";
import SsgRouter from './SsgRouter';

import { StaticRouter } from "react-router-dom/server";

export default function SsgRouter({ children }) {
  if (typeof window === "undefined") return <StaticRouter location="/">{children}</StaticRouter>;
  return <SsgRouter>{children}</SsgRouter>;
}
