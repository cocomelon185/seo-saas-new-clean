import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { setAuthSession } from "../lib/authClient.js";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";

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
      const res = await fetch(apiUrl("/api/signin"), {
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
      const res = await fetch(apiUrl("/api/auth/google"), {
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
    <AppShell>
      <div className="mx-auto w-full max-w-md px-4 py-10">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-xl">
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-white/70">
            Sign in to access your audits, saved fixes, and monitoring.
          </p>

          <div className="mt-6 flex flex-col items-center">
            <div ref={googleButtonRef} className="w-full flex justify-center" />
            <div className="mt-4 text-xs text-white/40">OR</div>
          </div>

          <form className="mt-4 space-y-3" onSubmit={submit}>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none"
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
              className="w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-60"
              disabled={status === "loading"}
              type="submit"
            >
              {status === "loading" ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link className="text-white/70 hover:text-white" to="/reset-password">Forgot password?</Link>
            <Link className="text-white/70 hover:text-white" to="/signup">Create account</Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
