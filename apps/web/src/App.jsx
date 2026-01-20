import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";

import Projects from "views/Index.jsx";
import Ranking from "views/Ranking.jsx";
import Audit from "views/Audit.jsx";
import Admin from "layouts/Admin.jsx";

export default function App() {
  return (
    <Switch>
      <Route path="/" exact component={Projects} />
      <Route path="/rank" exact component={Ranking} />
      <Route path="/audit" exact component={Audit} />
      <Route path="/admin" component={Admin} />
      <Redirect to="/" />
    </Switch>
  );
}
