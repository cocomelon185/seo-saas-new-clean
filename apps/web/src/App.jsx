import React from "react";
import { Switch, Route, Redirect, Link } from "react-router-dom";

import RequireAuth from "./routes/RequireAuth";
import { clearToken, getToken } from "./lib/api";

import AuthView from "./AuthView.jsx";
import Admin from "./layouts/Admin.jsx";

import Projects from "./views/Projects.jsx";
import Index from "./views/Index.jsx";
import Ranking from "./views/Ranking.jsx";
import Audit from "./views/Audit.jsx";

function TopNav() {
  const linkStyle = {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 10,
    textDecoration: "none",
    color: "inherit",
    border: "1px solid rgba(0,0,0,0.10)",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        zIndex: 9999,
        display: "flex",
        gap: 8,
        alignItems: "center",
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(6px)",
        padding: 8,
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.10)",
      }}
    >
      <Link to="/" style={linkStyle}>Home</Link>
      <Link to="/rank" style={linkStyle}>SEO Ranking</Link>
      <Link to="/audit" style={linkStyle}>SEO Audit</Link>
      <Link to="/admin" style={linkStyle}>Admin</Link>
    </div>
  );
}

export default function App() {
  const token = getToken();

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
      <TopNav />

      <div style={{ position: "fixed", top: 10, right: 10, zIndex: 9999 }}>
        <button
          onClick={() => {
            clearToken();
            window.location.href = "/auth";
          }}
          style={{ padding: "8px 12px", borderRadius: 10 }}
        >
          Logout
        </button>
      </div>

      <Switch>
        <Route path="/" exact component={Projects} />
        <Route path="/rank" exact component={Ranking} />
        <Route path="/audit" exact component={Audit} />
        <Route path="/admin" render={(props) => (<RequireAuth><Admin {...props} /></RequireAuth>)} />
        <Route path="/auth" render={() => <Redirect to="/" />} />
        <Redirect to="/" />
      </Switch>
    </>
  );
}
