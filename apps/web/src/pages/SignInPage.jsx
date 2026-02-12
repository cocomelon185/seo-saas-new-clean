import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { setAuthSession } from "../lib/authClient.js";
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

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const googleButtonRef = useRef(null);
  const [googleClientId, setGoogleClientId] = useState(() => import.meta.env.VITE_GOOGLE_CLIENT_ID || "");

  const params = new URLSearchParams(location.search || "");
  const next = params.get("next") || "/audit";
  const inviteToken = params.get("invite") || "";
  const provider = params.get("provider") || "";
  const googlePromptedRef = useRef(false);

  async function handleAuthSuccess(data) {
    setAuthSession({ token: data.token, user: data.user });

    if (inviteToken) {
      await fetch(apiUrl("/api/accept-invite"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`
        },
        body: JSON.stringify({ token: inviteToken })
      });

      try {
        const settingsRes = await fetch(apiUrl("/api/account-settings"), {
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

    navigate(next);
  }

  async function submit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const loginId = String(username || "").trim();
      const res = await fetch(apiUrl("/api/signin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: loginId, email: loginId, username: loginId, password })
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.token) {
        throw new Error(getApiErrorMessage(data, "Sign in failed"));
      }
      await handleAuthSuccess(data);
    } catch (e2) {
      setError(getCaughtErrorMessage(e2, "Sign in failed"));
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
        throw new Error(getApiErrorMessage(data, "Google sign in failed"));
      }
      await handleAuthSuccess(data);
    } catch (e2) {
      setError(getCaughtErrorMessage(e2, "Google sign in failed"));
      setStatus("idle");
    }
  }

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
  try {
    if (typeof window !== "undefined" && window.localStorage && window.localStorage.getItem("rp_signed_out") === "1") {
      window.localStorage.removeItem("rp_signed_out");
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.disableAutoSelect();
        window.google.accounts.id.cancel();
      }
    }
  } catch (_) {}

    if (!googleClientId) return;
    const target = googleButtonRef.current;
    if (!target) return;

    function initGoogle() {
      if (!window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.disableAutoSelect();
        window.google.accounts.id.cancel();
      } catch {}
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response?.credential) {
            handleGoogleCredential(response.credential);
          }
        },
        auto_select: false
      });
      target.innerHTML = "";
      window.google.accounts.id.renderButton(target, {
        text: "signin_with",
        theme: "outline",
        size: "large",
        shape: "pill",
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
        const t = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(t);
            initGoogle();
          }
        }, 200);
        return () => clearInterval(t);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = initGoogle;
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, [googleClientId, inviteToken, provider]);

  return (
    <AppShell
      seoTitle="Sign In | RankyPulse"
      seoDescription="Sign in to access your audits, saved fixes, and monitoring."
      seoCanonical={`${base}/auth/signin`}
      seoRobots="noindex,nofollow"
    >
      <div className="mx-auto w-full max-w-md px-4 py-10">
        <div className="rounded-2xl border border-[var(--rp-gray-200)] bg-white p-6 shadow-xl">
          <h1 className="text-2xl font-semibold text-[var(--rp-text-900)]">Welcome back</h1>
          <p className="mt-2 text-sm text-[var(--rp-text-500)]">
            Sign in to access your audits, saved fixes, and monitoring.
          </p>

          <div className="mt-6 flex flex-col items-center">
            {googleClientId ? (
              <div ref={googleButtonRef} className="w-full flex justify-center" />
            ) : (
              <div className="rounded-full border border-[var(--rp-gray-200)] bg-[var(--rp-gray-50)] px-4 py-2 text-center text-xs text-[var(--rp-text-500)]">
                Google sign-in unavailable
              </div>
            )}
            <div className="mt-4 text-xs text-[var(--rp-text-400)]">OR</div>
          </div>

          <form className="mt-4 space-y-3" onSubmit={submit}>
            <label className="sr-only" htmlFor="signin-username">Username or email</label>
            <input
              id="signin-username"
              className="w-full rounded-xl border border-[var(--rp-gray-200)] bg-white px-3 py-2 text-[var(--rp-text-900)] outline-none placeholder:text-[var(--rp-text-400)]"
              placeholder="Username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <label className="sr-only" htmlFor="signin-password">Password</label>
            <input
              id="signin-password"
              className="w-full rounded-xl border border-[var(--rp-gray-200)] bg-white px-3 py-2 text-[var(--rp-text-900)] outline-none placeholder:text-[var(--rp-text-400)]"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              className="w-full rounded-xl border border-[var(--rp-indigo-700)] bg-[var(--rp-indigo-700)] px-3 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(66,25,131,0.3)] disabled:opacity-60 hover:bg-[var(--rp-indigo-800)]"
              disabled={status === "loading"}
              type="submit"
            >
              {status === "loading" ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-start gap-8 text-sm">
            <Link
              className="rounded-xl border border-[var(--rp-gray-200)] bg-[var(--rp-gray-50)] px-3 py-2 text-xs font-semibold text-[var(--rp-text-700)] hover:border-[var(--rp-text-400)] hover:text-[var(--rp-text-900)]"
              to="/auth/reset"
            >
              Forgot password?
            </Link>
            <Link
              className="rounded-xl border border-[var(--rp-gray-200)] bg-[var(--rp-gray-50)] px-3 py-2 text-xs font-semibold text-[var(--rp-text-700)] hover:border-[var(--rp-text-400)] hover:text-[var(--rp-text-900)]"
              to="/auth/reset?mode=username"
            >
              Forgot username?
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
