import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";

import AppShell from "./AppShell";
import Dashboard from "views/admin/Dashboard.jsx";
import Settings from "views/admin/Settings.jsx";
import Audit from "../views/Audit.jsx";

export default function Admin() {
  return (
    <Switch>
      <Route
        path="/admin/dashboard"
        exact
        render={() => (
          <AppShell title="Dashboard" subtitle="Overview of your SEO audits">
            <Dashboard />
          </AppShell>
        )}
      />
      <Route
        path="/admin/audit"
        exact
        render={() => (
          <AppShell title="Site Audit" subtitle="Run audits and review issues">
            <Audit />
          </AppShell>
        )}
      />
      <Route
        path="/admin/settings"
        exact
        render={() => (
          <AppShell title="Settings" subtitle="Manage your account and projects">
            <Settings />
          </AppShell>
        )}
      />
      <Redirect from="/admin" to="/admin/dashboard" />
    </Switch>
  );
}
