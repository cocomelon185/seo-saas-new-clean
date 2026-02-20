import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { apiUrl } from "../lib/api.js";
import { safeJson } from "../lib/safeJson.js";

export default function InviteAcceptPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const [invite, setInvite] = useState(null);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search || "");
      const token = params.get("token");
      if (!token) {
        setStatus("error");
        return;
      }
      fetch(apiUrl(`/api/team/invite?token=${encodeURIComponent(token)}`))
        .then((r) => safeJson(r))
        .then((data) => {
          if (data?.ok) {
            setInvite(data.invite);
            setStatus("ready");
          } else {
            setStatus("error");
          }
        })
        .catch(() => setStatus("error"));
    } catch {
      setStatus("error");
    }
  }, []);

  return (
    <AppShell
      title="Team invitation"
      subtitle="You’ve been invited to join a RankyPulse workspace."
      seoTitle="Team Invitation | RankyPulse"
      seoDescription="Accept your RankyPulse team invitation."
      seoCanonical={`${base}/auth/invite`}
      seoRobots="noindex,nofollow"
    >
      <div className="mx-auto max-w-md">
        <div className="rp-card p-6">
          {status === "loading" && <div className="text-sm text-[var(--rp-text-500)]">Loading invite…</div>}
          {status === "error" && <div className="text-sm text-rose-600">Invite not found or expired.</div>}
          {status === "ready" && invite && (
            <>
              <div className="text-sm text-[var(--rp-text-500)]">Team</div>
              <div className="text-lg font-semibold text-[var(--rp-text-900)]">{invite.team_id}</div>
              <div className="mt-2 text-xs text-[var(--rp-text-500)]">Role: {invite.role}</div>
              <div className="mt-4 flex flex-col gap-2">
                <Link to={`/auth/signup?invite=${encodeURIComponent(new URLSearchParams(window.location.search).get("token") || "")}&email=${encodeURIComponent(invite.email || "")}`} className="rp-btn-primary text-sm">
                  Accept invite & create account
                </Link>
                <Link to={`/auth/signin?invite=${encodeURIComponent(new URLSearchParams(window.location.search).get("token") || "")}`} className="rp-btn-secondary text-sm">
                  I already have an account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
