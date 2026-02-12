import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";
import { getAuthUser } from "../lib/authClient.js";

export default function VerifyEmailPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendStatus, setResendStatus] = useState("idle");
  const [resendMessage, setResendMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let nextEmail = "";
    try {
      const params = new URLSearchParams(window.location.search || "");
      const t = params.get("token");
      const emailParam = params.get("email");
      if (t) setToken(t);
      if (emailParam) nextEmail = emailParam;
    } catch {}
    if (!nextEmail) {
      try {
        const user = getAuthUser();
        if (user?.email) nextEmail = user.email;
      } catch {}
    }
    if (nextEmail) setEmail(nextEmail);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(apiUrl("/api/verify-email"), {
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

  async function resendVerification() {
    setResendStatus("loading");
    setResendMessage("");
    try {
      if (!email) throw new Error("Enter your email first.");
      const res = await fetch(apiUrl("/api/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verifyOnly: true })
      });
      const data = await safeJson(res);
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Unable to send verification email.");
      }
      setResendStatus("done");
      setResendMessage("Verification email sent. Check your inbox.");
    } catch (e2) {
      setResendStatus("idle");
      setResendMessage(String(e2?.message || "Unable to send verification email."));
    }
  }

  return (
    <AppShell
      title="Verify your email"
      subtitle="Verification is required before running audits or upgrading."
      seoTitle="Verify Email | RankyPulse"
      seoDescription="Verify your email to unlock full access to RankyPulse."
      seoCanonical={`${base}/auth/verify`}
      seoRobots="noindex,nofollow"
    >
      <div className="mx-auto max-w-md space-y-4">
        <div className="rp-card p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--rp-text-500)]">How it works</div>
          <h2 className="mt-2 text-lg font-semibold text-[var(--rp-text-900)]">Unlock full access in minutes</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--rp-text-600)]">
            <li>1. Check your inbox for a message from onboarding@rankypulse.com.</li>
            <li>2. Click the verification link to activate your account.</li>
            <li>3. Come back here if you need to paste a token manually.</li>
          </ul>
        </div>

        <form onSubmit={submit} className="rp-card p-6">
          <label className="block text-xs text-[var(--rp-text-500)]">
            Verification token
            <input className="rp-input mt-2" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token from your email" />
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

        <div className="rp-card p-6">
          <div className="text-sm font-semibold text-[var(--rp-text-900)]">Didn’t get the email?</div>
          <p className="mt-2 text-xs text-[var(--rp-text-500)]">
            We’ll resend the verification link. Make sure to check spam or promotions tabs.
          </p>
          <label className="mt-3 block text-xs text-[var(--rp-text-500)]">
            Email address
            <input
              className="rp-input mt-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </label>
          {resendMessage && (
            <div className={`mt-3 rounded-xl border p-3 text-xs ${resendStatus === "done" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              {resendMessage}
            </div>
          )}
          <button
            type="button"
            className="rp-btn-secondary mt-4 w-full text-sm"
            onClick={resendVerification}
            disabled={resendStatus === "loading"}
          >
            {resendStatus === "loading" ? "Sending..." : "Resend verification email"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
