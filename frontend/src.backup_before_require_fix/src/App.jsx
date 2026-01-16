import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";

import Admin from "./layouts/Admin.jsx";
import Auth from "./layouts/Auth.jsx";
import Index from "./views/Index.jsx";

export default function App() {
  return (
    <Switch>
      <Route path="/" exact component={Index} />
      <Route path="/admin" component={Admin} />
      <Route path="/auth" component={Auth} />
      <Redirect to="/" />
    </Switch>
  );
}
