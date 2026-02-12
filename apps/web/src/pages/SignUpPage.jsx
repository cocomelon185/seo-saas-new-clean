import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { setAuthSession } from "../lib/authClient.js";
import { track } from "../lib/eventsClient.js";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";

function getApiErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data?.error === "string") return data.error;
  if (data?.error && typeof data.error === "object") {
    if (typeof data.error.message === "string" && data.error.message.trim()) return data.error.message;
    if (typeof data.error.code === "string" && data.error.code.trim()) return data.error.code;
  }
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  return fallback;
}

function getCaughtErrorMessage(err, fallback) {
  if (!err) return fallback;
  if (typeof err === "string" && err.trim()) return err;
  if (typeof err === "object") {
    if (typeof err.message === "string" && err.message.trim()) return err.message;
    if (err.error && typeof err.error === "object") {
      if (typeof err.error.message === "string" && err.error.message.trim()) return err.error.message;
      if (typeof err.error.code === "string" && err.error.code.trim()) return err.error.code;
    }
    if (typeof err.error === "string" && err.error.trim()) return err.error;
  }
  return fallback;
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const googleButtonRef = useRef(null);
  const [googleClientId, setGoogleClientId] = useState(() => import.meta.env.VITE_GOOGLE_CLIENT_ID || "");
  const [provider, setProvider] = useState("");
  const [planParam, setPlanParam] = useState("");
  const [nextPath, setNextPath] = useState("/audit");
  const googlePromptedRef = useRef(false);

  async function submit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(apiUrl("/api/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, invite_token: inviteToken })
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.token) {
        throw new Error(getApiErrorMessage(data, "Sign up failed"));
      }
      const submittedName = String(name || "").trim();
      setAuthSession({
        token: data.token,
        user: {
          ...(data.user || {}),
          ...(submittedName ? { name: submittedName } : {})
        }
      });
      if (data.verifyToken) setVerifyToken(data.verifyToken);
      try {
        const anon = localStorage.getItem("rp_anon_id") || "";
        if (anon && data?.user?.email) {
          await fetch(apiUrl("/api/migrate-anon"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.token}`
            },
            body: JSON.stringify({ anon_id: anon, user_id: data.user.email })
          });
        }
      } catch {}
      try {
        track("signup", { method: "email", plan: planParam || null });
      } catch {}
      if (inviteToken) {
        navigate("/auth/invite-accepted");
      } else {
        navigate(nextPath || "/audit");
      }
    } catch (e2) {
      setError(getCaughtErrorMessage(e2, "Sign up failed"));
      setStatus("idle");
    }
  }

  async function handleGoogleCredential(credential) {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(apiUrl("/api/auth/google"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, invite_token: inviteToken })
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.token) {
        throw new Error(getApiErrorMessage(data, "Google sign up failed"));
      }
      setAuthSession({ token: data.token, user: data.user });
      try {
        const anon = localStorage.getItem("rp_anon_id") || "";
        if (anon && data?.user?.email) {
          await fetch(apiUrl("/api/migrate-anon"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.token}`
            },
            body: JSON.stringify({ anon_id: anon, user_id: data.user.email })
          });
        }
      } catch {}
      try {
        track("signup", { method: "google", plan: planParam || null });
      } catch {}
      if (inviteToken) {
        await fetch(apiUrl("/api/accept-invite"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.token}`
          },
          body: JSON.stringify({ token: inviteToken })
        });
        navigate("/auth/invite-accepted");
      } else {
        navigate(nextPath || "/audit");
      }
    } catch (e2) {
      setError(getCaughtErrorMessage(e2, "Google sign up failed"));
      setStatus("idle");
    }
  }

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || "");
      const invite = params.get("invite") || "";
      const emailParam = params.get("email") || "";
      const providerParam = params.get("provider") || "";
      const plan = params.get("plan") || "";
      const next = params.get("next") || "";
      if (invite) setInviteToken(invite);
      if (emailParam) setEmail(emailParam);
      if (providerParam) setProvider(providerParam);
      if (plan) setPlanParam(plan);
      if (next && next.startsWith("/")) setNextPath(next);
    } catch {}
  }, [location.search]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hostname !== "127.0.0.1") return;
    const nextHost = "localhost";
    const nextUrl = `${window.location.protocol}//${nextHost}${window.location.port ? `:${window.location.port}` : ""}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(nextUrl);
  }, []);

  useEffect(() => {
    if (googleClientId) return;
    let cancelled = false;
    fetch(apiUrl("/api/auth/google-config"))
      .then((r) => safeJson(r))
      .then((data) => {
        if (cancelled) return;
        if (data?.enabled && data?.client_id) {
          setGoogleClientId(String(data.client_id));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [googleClientId]);

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
    <AppShell
      title="Create account"
      subtitle="Start with a free audit, then verify your email to unlock full access."
      seoTitle="Create Account | RankyPulse"
      seoDescription="Create a RankyPulse account to save audits, track fixes, and share reports."
      seoCanonical={`${base}/auth/signup`}
      seoRobots="noindex,nofollow"
    >
      <div className="mx-auto max-w-md rp-auth-shell">
        <form onSubmit={submit} className="rp-card rp-auth-card p-6">
          <div className="rp-auth-title text-sm font-semibold text-[var(--rp-text-700)]">Create your RankyPulse account</div>
          <div className="mt-3 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3 text-xs text-[var(--rp-text-600)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--rp-text-500)]">Email verification</div>
            <p className="mt-2">
              We’ll send a verification link after sign up. Verification unlocks audits, reports, and billing.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-[var(--rp-text-500)]">
              <li>Check your inbox from onboarding@rankypulse.com</li>
              <li>Click the link to activate full access</li>
              <li>You can browse, but audits require verification</li>
            </ul>
          </div>
          <div className="mt-4 rp-google-shell">
            {googleClientId ? (
              <div ref={googleButtonRef} className="flex justify-center" />
            ) : (
              <div className="rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-4 py-2 text-center text-xs text-[var(--rp-text-500)]">
                Google sign-up unavailable
              </div>
            )}
          </div>
          <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-[var(--rp-text-400)]">
            <span className="h-px flex-1 bg-[var(--rp-border)]" />
            or
            <span className="h-px flex-1 bg-[var(--rp-border)]" />
          </div>
          <label className="mt-4 block text-xs text-[var(--rp-text-500)]">
            Full name
            <input className="rp-input mt-2" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="mt-4 block text-xs text-[var(--rp-text-500)]">
            Work email
            <input className="rp-input mt-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="mt-4 block text-xs text-[var(--rp-text-500)]">
            Password
            <input className="rp-input mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <div className="mt-2 text-xs text-[var(--rp-text-500)]">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-full rounded-full bg-[var(--rp-gray-100)]">
                <div
                  className={`h-1.5 rounded-full ${
                    password.length >= 12 ? "bg-emerald-400" :
                    password.length >= 8 ? "bg-amber-400" :
                    "bg-rose-400"
                  }`}
                  style={{ width: `${Math.min(100, (password.length / 12) * 100)}%` }}
                />
              </div>
              <span className={
                password.length >= 12 ? "text-emerald-600 font-semibold" :
                password.length >= 8 ? "text-amber-600 font-semibold" :
                "text-rose-600 font-semibold"
              }>
                {password.length >= 12 ? "Strong" : password.length >= 8 ? "Medium" : "Weak"}
              </span>
            </div>
            <ul className="mt-2 grid gap-1 text-[11px] text-[var(--rp-text-500)]">
              <li className={/[a-z]/.test(password) ? "text-emerald-600" : ""}>• Lowercase letter</li>
              <li className={/[A-Z]/.test(password) ? "text-emerald-600" : ""}>• Uppercase letter</li>
              <li className={/[0-9]/.test(password) ? "text-emerald-600" : ""}>• Number</li>
              <li className={/[^A-Za-z0-9]/.test(password) ? "text-emerald-600" : ""}>• Symbol</li>
              <li className={password.length >= 8 ? "text-emerald-600" : ""}>• 8+ characters</li>
            </ul>
          </div>
          {error && <div className="mt-3 text-xs text-rose-600">{error}</div>}
          <button
            className="rp-btn-primary mt-4 w-full text-sm"
            title="Complete all password requirements to enable sign up."
            disabled={
              status === "loading" ||
              !(
                password.length >= 8 &&
                /[a-z]/.test(password) &&
                /[A-Z]/.test(password) &&
                /[0-9]/.test(password) &&
                /[^A-Za-z0-9]/.test(password)
              )
            }
          >
            {status === "loading" ? "Creating..." : "Create account"}
          </button>
          <div className="mt-2 text-center text-xs text-[var(--rp-text-500)]">
            We’ll email a verification link to unlock full access.
          </div>
          {verifyToken && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              Verification email sent. Check your inbox to unlock audits.
            </div>
          )}
          <div className="mt-4 text-xs text-[var(--rp-text-500)]">
            Already have an account? <Link className="font-semibold text-[var(--rp-indigo-700)]" to="/auth/signin">Sign in</Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
