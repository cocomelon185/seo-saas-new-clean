import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { setAuthSession } from "../lib/authClient.js";
import { safeJson } from "../lib/safeJson.js";

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  const params = new URLSearchParams(location.search || "");
  const next = params.get("next") || "/audit";
  const inviteToken = params.get("invite") || "";
  const provider = params.get("provider") || "";
  const googlePromptedRef = useRef(false);

  async function handleAuthSuccess(data) {
    setAuthSession({ token: data.token, user: data.user });
    if (inviteToken) {
      await fetch("/api/accept-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`
        },
        body: JSON.stringify({ token: inviteToken })
      });
      try {
        const settingsRes = await fetch("/api/account-settings", {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        const settingsData = await safeJson(settingsRes);
        if (settingsData?.ok && settingsData?.settings) {
          setAuthSession({
            token: data.token,
            user: {
              ...data.user,
              role: settingsData.settings.role,
              team_id: settingsData.settings.team_id
            }
          });
        }
      } catch {}
    }
    try {
      const anon = localStorage.getItem("rp_anon_id") || "";
      if (anon && data?.user?.email) {
        await fetch("/api/migrate-anon", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.token}`
          },
          body: JSON.stringify({ anon_id: anon, user_id: data.user.email })
        });
      }
    } catch {}
    navigate(next);
  }

  async function submit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.token) {
        throw new Error(data?.error || "Sign in failed");
      }
      await handleAuthSuccess(data);
    } catch (e2) {
      setError(String(e2?.message || "Sign in failed"));
      setStatus("idle");
    }
  }

  async function handleGoogleCredential(credential) {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, invite_token: inviteToken })
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.token) {
        throw new Error(data?.error || "Google sign in failed");
      }
      await handleAuthSuccess(data);
    } catch (e2) {
      setError(String(e2?.message || "Google sign in failed"));
      setStatus("idle");
    }
  }

  useEffect(() => {
    if (!googleClientId) return;
    const target = googleButtonRef.current;
    if (!target) return;
    function initGoogle() {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response?.credential) {
            handleGoogleCredential(response.credential);
          }
        }
      });
      target.innerHTML = "";
      window.google.accounts.id.renderButton(target, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: "320"
      });
      if (provider === "google" && !googlePromptedRef.current) {
        googlePromptedRef.current = true;
        window.google.accounts.id.prompt();
      }
    }
    const existing = document.querySelector('script[data-google-identity="true"]');
    if (existing) {
      if (window.google?.accounts?.id) {
        initGoogle();
      } else {
        existing.addEventListener("load", initGoogle, { once: true });
      }
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, [googleClientId, inviteToken, provider]);

  return (
    <AppShell title="Sign in" subtitle="Access your audits, saved fixes, and monitoring.">
      <div className="mx-auto max-w-md rp-auth-shell">
        <form onSubmit={submit} className="rp-card rp-auth-card p-6">
          <div className="rp-auth-title text-sm font-semibold text-[var(--rp-text-700)]">Welcome back</div>
          <div className="mt-4 rp-google-shell">
            {googleClientId ? (
              <div ref={googleButtonRef} className="flex justify-center" />
            ) : (
              <div className="rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-4 py-2 text-center text-xs text-[var(--rp-text-500)]">
                Google sign-in unavailable
              </div>
            )}
          </div>
          <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-[var(--rp-text-400)]">
            <span className="h-px flex-1 bg-[var(--rp-border)]" />
            or
            <span className="h-px flex-1 bg-[var(--rp-border)]" />
          </div>
          <label className="mt-4 block text-xs text-[var(--rp-text-500)]">
            Work email
            <input className="rp-input mt-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="mt-4 block text-xs text-[var(--rp-text-500)]">
            Password
            <input className="rp-input mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <div className="mt-3 text-xs text-rose-600">{error}</div>}
          <button className="rp-btn-primary mt-4 w-full text-sm" disabled={status === "loading"}>
            {status === "loading" ? "Signing in..." : "Sign in"}
          </button>
          <div className="mt-4 text-xs text-[var(--rp-text-500)]">
            New here? <Link className="font-semibold text-[var(--rp-indigo-700)]" to="/auth/signup">Create an account</Link>
          </div>
          <div className="mt-2 text-xs text-[var(--rp-text-500)]">
            Forgot password? <Link className="font-semibold text-[var(--rp-indigo-700)]" to="/auth/reset">Reset it</Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
