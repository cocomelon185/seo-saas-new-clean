import React, { useState } from "react";
import { api, setToken } from "../lib/api";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("test1234");
  const [plan, setPlan] = useState("free");
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOkMsg("");

    try {
      const path = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register"
        ? { email, password, plan }
        : { email, password };

      const r = await api(path, { method: "POST", body });
      setToken(r.token);
      setOkMsg("✅ Logged in. Go to Dashboard or run an audit.");
    } catch (e2) {
      setErr(e2?.message || "Failed");
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>RankyPulse — {mode === "register" ? "Register" : "Login"}</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setMode("login")} style={{ padding: "8px 10px" }}>
          Login
        </button>
        <button onClick={() => setMode("register")} style={{ padding: "8px 10px" }}>
          Register
        </button>
      </div>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10 }}
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10 }}
        />

        {mode === "register" && (
          <select value={plan} onChange={(e) => setPlan(e.target.value)} style={{ padding: 10 }}>
            <option value="free">free</option>
            <option value="pro">pro</option>
          </select>
        )}

        <button type="submit" style={{ padding: 10, fontWeight: 700 }}>
          {mode === "register" ? "Create account" : "Login"}
        </button>

        {err && <div style={{ color: "crimson" }}>❌ {err}</div>}
        {okMsg && <div style={{ color: "green" }}>{okMsg}</div>}

        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Token is stored at <code>localStorage.rankypulse_token</code>
        </div>
      </form>
    </div>
  );
}
