import React from "react";
import { Redirect } from "react-router-dom";
import { getToken } from "../lib/api";

export default function RequireAuth({ children }) {
  const token = getToken();
  if (!token) return <Redirect to="/auth" />;
  return children;
}
