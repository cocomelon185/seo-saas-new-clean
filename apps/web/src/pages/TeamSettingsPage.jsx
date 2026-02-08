import { useEffect, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { getAuthToken, getAuthUser } from "../lib/authClient.js";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";

export default function TeamSettingsPage() {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [requireVerified, setRequireVerified] = useState(false);
  const [allowAudit, setAllowAudit] = useState(true);
  const [allowRank, setAllowRank] = useState(true);
  const [allowImprove, setAllowImprove] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamId, setTeamId] = useState("");
  const [toast, setToast] = useState("");
  const authUser = getAuthUser();
  const token = getAuthToken();

  useEffect(() => {
    if (!token) return;
    fetch(apiUrl("/api/team/members"), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => safeJson(r))
      .then((data) => {
        if (data?.ok) {
          setMembers(data.members || []);
          setIsAdmin(data.role === "admin");
          setTeamId(data.team_id || "");
        }
      });
    fetch(apiUrl("/api/team/invites"), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => safeJson(r))
      .then((data) => {
        if (data?.ok) setInvites(data.invites || []);
      });
    fetch(apiUrl("/api/account-settings"), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => safeJson(r))
      .then((data) => {
        if (data?.ok && data?.settings) {
          setRequireVerified(!!data.settings.require_verified);
          setAllowAudit(data.settings.allow_audit !== false);
          setAllowRank(data.settings.allow_rank !== false);
          setAllowImprove(data.settings.allow_improve !== false);
        }
      });
  }, [token]);

  return (
    <AppShell title="Team Settings" subtitle="Manage team members, roles, and audit rules.">
      {toast && (
        <div className="mb-4 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
          {toast}
        </div>
      )}
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        {[
          { label: "Team members", value: members.length, tone: "text-[var(--rp-indigo-700)]" },
          { label: "Pending invites", value: invites.length, tone: "text-amber-600" },
          { label: "Audit access", value: allowAudit ? "On" : "Off", tone: allowAudit ? "text-emerald-600" : "text-rose-600" },
          { label: "Verified required", value: requireVerified ? "Yes" : "No", tone: requireVerified ? "text-emerald-600" : "text-[var(--rp-text-700)]" }
        ].map((item) => (
          <div key={item.label} className="rp-kpi-card rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
            <div className="text-xs text-[var(--rp-text-500)]">{item.label}</div>
            <div className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="rp-card p-6">
          <div className="rp-section-title">Team members</div>
          <div className="mt-2 text-xs text-[var(--rp-text-500)]">Team: {teamId || "—"}</div>
          <div className="mt-4 overflow-auto">
            <table className="rp-table w-full text-left text-sm">
              <thead>
                <tr className="text-[var(--rp-text-500)]">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Verified</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.email} className="border-t border-[var(--rp-border)]">
                    <td className="px-3 py-2">{m.name || "—"}</td>
                    <td className="px-3 py-2">{m.email}</td>
                    <td className="px-3 py-2">
                      {isAdmin && m.email !== authUser?.email ? (
                        <select
                          className="rp-input h-8 text-xs"
                          value={m.role || "member"}
                          onChange={async (e) => {
                            const next = e.target.value;
                            await fetch(apiUrl("/api/team/members"), {
                              method: "POST",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ email: m.email, role: next })
                            });
                            setMembers((prev) => prev.map((x) => (x.email === m.email ? { ...x, role: next } : x)));
                          }}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="rp-chip rp-chip-neutral">{m.role || "member"}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{m.verified ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">
                      {isAdmin && m.email !== authUser?.email ? (
                        <div className="flex gap-2">
                          <button
                            className="rp-btn-secondary rp-btn-sm h-7 px-2 text-[11px]"
                            onClick={async () => {
                              const action = m.active === 0 ? "activate" : "deactivate";
                              await fetch(apiUrl("/api/team/members"), {
                                method: "POST",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ email: m.email, action })
                              });
                              setMembers((prev) =>
                                prev.map((x) => (x.email === m.email ? { ...x, active: action === "activate" ? 1 : 0 } : x))
                              );
                            }}
                          >
                            {m.active === 0 ? "Activate" : "Deactivate"}
                          </button>
                          <button
                            className="rp-btn-secondary rp-btn-sm h-7 px-2 text-[11px]"
                            onClick={async () => {
                              await fetch(apiUrl("/api/team/members"), {
                                method: "POST",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ email: m.email, action: "deactivate" })
                              });
                              setMembers((prev) =>
                                prev.filter((x) => x.email !== m.email)
                              );
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <span className="rp-chip rp-chip-neutral">{m.active === 0 ? "Inactive" : "Active"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rp-card p-6">
            <div className="rp-section-title">Invite user</div>
            <div className="mt-3 grid gap-3">
              <input className="rp-input" placeholder="email@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <select className="rp-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                className="rp-btn-primary"
                disabled={!isAdmin}
                title={!isAdmin ? "Admins only" : "Send team invite"}
                onClick={async () => {
                  if (!email) return;
                  const res = await fetch(apiUrl("/api/team/invites"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ email, role })
                  });
                  const data = await safeJson(res);
                  if (data?.ok) {
                    setInvites(data.invites || []);
                    setToast("Invite sent.");
                    setTimeout(() => setToast(""), 2000);
                    setEmail("");
                  }
                }}
              >
                Send invite
              </button>
              {!isAdmin && <div className="text-xs text-[var(--rp-text-500)]">Admins only</div>}
            </div>
          </div>

          <div className="rp-card p-6">
            <div className="rp-section-title">Admin audit controls</div>
            <div className="mt-2 text-xs text-[var(--rp-text-500)]">Shared across the team.</div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--rp-text-700)]">Require verified email</div>
                <div className="text-xs text-[var(--rp-text-500)]">Block audits for unverified users.</div>
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                <input
                  type="checkbox"
                  checked={requireVerified}
                  disabled={!isAdmin}
                  onChange={async (e) => {
                    const next = e.target.checked;
                    setRequireVerified(next);
                    await fetch(apiUrl("/api/account-settings"), {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ require_verified: next })
                    });
                  }}
                />
                Enable
              </label>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="flex items-center justify-between text-xs text-[var(--rp-text-500)]">
                <span>Allow Audit tool</span>
                <input
                  type="checkbox"
                  checked={allowAudit}
                  disabled={!isAdmin}
                  onChange={async (e) => {
                    const next = e.target.checked;
                    setAllowAudit(next);
                    await fetch(apiUrl("/api/account-settings"), {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ allow_audit: next })
                    });
                  }}
                />
              </label>
              <label className="flex items-center justify-between text-xs text-[var(--rp-text-500)]">
                <span>Allow Rank Tracker</span>
                <input
                  type="checkbox"
                  checked={allowRank}
                  disabled={!isAdmin}
                  onChange={async (e) => {
                    const next = e.target.checked;
                    setAllowRank(next);
                    await fetch(apiUrl("/api/account-settings"), {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ allow_rank: next })
                    });
                  }}
                />
              </label>
              <label className="flex items-center justify-between text-xs text-[var(--rp-text-500)]">
                <span>Allow Improve Page</span>
                <input
                  type="checkbox"
                  checked={allowImprove}
                  disabled={!isAdmin}
                  onChange={async (e) => {
                    const next = e.target.checked;
                    setAllowImprove(next);
                    await fetch(apiUrl("/api/account-settings"), {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ allow_improve: next })
                    });
                  }}
                />
              </label>
            </div>
            <div className="mt-4 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3 text-xs text-[var(--rp-text-500)]">
              More controls (guest preview limits, export gating) can be added here.
            </div>
          </div>

          <div className="rp-card p-6">
            <div className="rp-section-title">Pending invites</div>
            <div className="mt-3 space-y-2 text-xs text-[var(--rp-text-600)]">
              {invites.length ? invites.map((i, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="font-semibold">{i.email}</div>
                  <div className="text-[var(--rp-text-500)]">{i.role} · {i.status}</div>
                </div>
              )) : "No pending invites."}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
