import { useEffect, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { safeJson } from "../lib/safeJson.js";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

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
    setError("");
    try {
      if (!token) {
        const res = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await safeJson(res);
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Reset failed");
        }
        setStatus("done");
        return;
      }

      const res = await fetch("/api/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword })
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Reset failed");
      }
      setStatus("done");
    } catch (e2) {
      setError(String(e2?.message || "Reset failed"));
      setStatus("idle");
    }
  }

  return (
    <AppShell title="Reset password" subtitle="We’ll send a reset link to your email.">
      <div className="mx-auto max-w-md rp-auth-shell">
        <form onSubmit={submit} className="rp-card rp-auth-card p-6">
          <div className="rp-auth-title text-sm font-semibold text-[var(--rp-text-700)]">
            {token ? "Choose a new password" : "Reset password"}
          </div>
          {!token ? (
            <label className="block text-xs text-[var(--rp-text-500)]">
              Account email
              <input className="rp-input mt-2" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          ) : (
            <>
              <label className="block text-xs text-[var(--rp-text-500)]">
                New password
                <input className="rp-input mt-2" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </label>
              <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-full rounded-full bg-[var(--rp-gray-100)]">
                    <div
                      className={`h-1.5 rounded-full ${
                        newPassword.length >= 12 ? "bg-emerald-400" :
                        newPassword.length >= 8 ? "bg-amber-400" :
                        "bg-rose-400"
                      }`}
                      style={{ width: `${Math.min(100, (newPassword.length / 12) * 100)}%` }}
                    />
                  </div>
                  <span className={
                    newPassword.length >= 12 ? "text-emerald-600 font-semibold" :
                    newPassword.length >= 8 ? "text-amber-600 font-semibold" :
                    "text-rose-600 font-semibold"
                  }>
                    {newPassword.length >= 12 ? "Strong" : newPassword.length >= 8 ? "Medium" : "Weak"}
                  </span>
                </div>
                <ul className="mt-2 grid gap-1 text-[11px] text-[var(--rp-text-500)]">
                  <li className={/[a-z]/.test(newPassword) ? "text-emerald-600" : ""}>• Lowercase letter</li>
                  <li className={/[A-Z]/.test(newPassword) ? "text-emerald-600" : ""}>• Uppercase letter</li>
                  <li className={/[0-9]/.test(newPassword) ? "text-emerald-600" : ""}>• Number</li>
                  <li className={/[^A-Za-z0-9]/.test(newPassword) ? "text-emerald-600" : ""}>• Symbol</li>
                  <li className={newPassword.length >= 8 ? "text-emerald-600" : ""}>• 8+ characters</li>
                </ul>
              </div>
            </>
          )}
          {error && <div className="mt-3 text-xs text-rose-600">{error}</div>}
          <button
            className="rp-btn-primary mt-4 w-full text-sm"
            disabled={
              status === "loading" ||
              (token && !(
                newPassword.length >= 8 &&
                /[a-z]/.test(newPassword) &&
                /[A-Z]/.test(newPassword) &&
                /[0-9]/.test(newPassword) &&
                /[^A-Za-z0-9]/.test(newPassword)
              ))
            }
          >
            {status === "loading" ? "Submitting..." : token ? "Reset password" : "Send reset link"}
          </button>
          {status === "done" && !token && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              Reset email sent. Check your inbox.
            </div>
          )}
          {status === "done" && token && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              Password updated. You can sign in now.
            </div>
          )}
        </form>
      </div>
    </AppShell>
  );
}
