import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { safeJson } from "../lib/safeJson.js";

export default function VerifyEmailPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search || "");
      const t = params.get("token");
      if (t) setToken(t);
    } catch {}
  }, []);

  async function submit(e) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Verification failed");
      }
      if (data?.token) {
        try {
          localStorage.setItem("rp_auth_token", data.token);
        } catch {}
      }
      setStatus("done");
      setMessage("Email verified. You can continue to the audit.");
      setTimeout(() => navigate("/audit"), 1200);
    } catch (e2) {
      setStatus("idle");
      setMessage(String(e2?.message || "Verification failed"));
    }
  }

  return (
    <AppShell title="Verify email" subtitle="Enter your verification token to continue.">
      <div className="mx-auto max-w-md">
        <form onSubmit={submit} className="rp-card p-6">
          <label className="block text-xs text-[var(--rp-text-500)]">
            Verification token
            <input className="rp-input mt-2" value={token} onChange={(e) => setToken(e.target.value)} />
          </label>
          {message && (
            <div className={`mt-3 rounded-xl border p-3 text-xs ${status === "done" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              {message}
            </div>
          )}
          <button className="rp-btn-primary mt-4 w-full text-sm" disabled={status === "loading"}>
            {status === "loading" ? "Verifying..." : "Verify email"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
