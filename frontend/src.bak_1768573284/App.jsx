import { clearToken, getToken } from "./lib/api";
import React from "react";
import AuthView from "./AuthView.jsx";
import { Switch, Route, Redirect } from "react-router-dom";

import Admin from "./layouts/Admin.jsx";
import Auth from "./layouts/Auth.jsx";
import Index from "./views/Index.jsx";

export default function App() {
  const token = getToken();

  // If not logged in, always send to /auth
  if (!token) {
    return (
      <Switch>
        <Route
          path="/auth"
          render={() => <AuthView onAuthed={() => (window.location.href = "/")} />}
        />
        <Redirect to="/auth" />
      </Switch>
    );
  }

  return (
    <>
      <div style={{ position: "fixed", top: 10, right: 10, zIndex: 9999 }}>
        <button
          onClick={() => {
            clearToken();
            window.location.href = "/auth";
          }}
          style={{ padding: "6px 10px" }}
        >
          Logout
        </button>
      </div>

      <Switch>
        <Route path="/" exact component={Index} />
        <Route path="/admin" component={Admin} />
        {/* Keep /auth route for convenience; redirect to dashboard if already logged in */}
        <Route path="/auth" render={() => <Redirect to="/" />} />
        <Redirect to="/" />
      </Switch>
    </>
  );
}

