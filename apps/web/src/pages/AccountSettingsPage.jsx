import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { IconArrowRight, IconSettings, IconTrash } from "../components/Icons.jsx";
import { getAnonId } from "../utils/anonId.js";
import { getAuthToken, getAuthUser } from "../lib/authClient.js";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";

export default function AccountSettingsPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const [gscStatus, setGscStatus] = useState("idle");
  const [gscConnected, setGscConnected] = useState(false);
  const [gscExpiry, setGscExpiry] = useState(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [toast, setToast] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("unknown");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [blockUnverified, setBlockUnverified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [billingStatus, setBillingStatus] = useState("loading");
  const [billingError, setBillingError] = useState("");
  const [entitlements, setEntitlements] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [canceling, setCanceling] = useState(false);
  const anonId = getAnonId();
  const authUser = getAuthUser();

  function refreshBilling() {
    if (!anonId) return;
    setBillingStatus("loading");
    setBillingError("");
    Promise.all([
      fetch(apiUrl("/api/billing/status"), { headers: { "x-rp-anon-id": anonId } }).then((r) => safeJson(r)),
      fetch(apiUrl("/api/billing/razorpay/invoices"), { headers: { "x-rp-anon-id": anonId } }).then((r) => safeJson(r))
    ])
      .then(([statusData, invoiceData]) => {
        if (statusData?.ok) {
          setEntitlements(statusData.entitlements || null);
        }
        if (invoiceData?.ok) {
          setInvoices(Array.isArray(invoiceData.invoices) ? invoiceData.invoices : []);
        }
        if (!statusData?.ok) {
          setBillingError(statusData?.error?.message || "Unable to load billing status.");
        }
        setBillingStatus("success");
      })
      .catch((err) => {
        setBillingStatus("error");
        setBillingError(String(err?.message || "Unable to load billing status."));
      });
  }

  function refreshGscStatus() {
    setGscStatus("loading");
    fetch(apiUrl("/api/gsc/status"), {
      headers: anonId ? { "x-rp-anon-id": anonId } : {}
    })
      .then((r) => safeJson(r))
      .then((data) => {
        if (data?.ok) {
          setGscConnected(!!data.connected);
          setGscExpiry(data.expires_at || null);
          setGscStatus("success");
        } else {
          setGscStatus("error");
        }
      })
      .catch(() => setGscStatus("error"));
  }

  useEffect(() => {
    let cancelled = false;
    setGscStatus("loading");
    fetch(apiUrl("/api/gsc/status"), {
      headers: anonId ? { "x-rp-anon-id": anonId } : {}
    })
      .then((r) => safeJson(r))
      .then((data) => {
        if (cancelled) return;
        if (data?.ok) {
          setGscConnected(!!data.connected);
          setGscExpiry(data.expires_at || null);
          setGscStatus("success");
        } else {
          setGscStatus("error");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setGscStatus("error");
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search || "");
    const gsc = params.get("gsc");
    if (gsc === "connected") {
      setToast("GSC connected.");
      setTimeout(() => setToast(""), 2500);
      params.delete("gsc");
      const next = params.toString();
      const url = next ? `${window.location.pathname}?${next}` : window.location.pathname;
      window.history.replaceState(null, "", url);
    }
  }, []);

  useEffect(() => {
    if (authUser?.email) {
      setVerifyEmail(authUser.email);
      setWorkEmail(authUser.email);
    }
    if (authUser?.verified) {
      setVerifyStatus("verified");
    } else {
      setVerifyStatus("unverified");
    }
    if (authUser?.name) setFullName(authUser.name);
      try {
        const token = getAuthToken();
        if (token) {
          fetch(apiUrl("/api/account-settings"), {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then((r) => safeJson(r))
          .then((data) => {
            if (data?.ok && data?.settings) {
              setBlockUnverified(!!data.settings.require_verified);
              setIsAdmin(data.settings.role === "admin");
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, [authUser?.email, authUser?.verified]);

  useEffect(() => {
    refreshBilling();
  }, [anonId]);

  return (
    <AppShell
      title="Account settings"
      subtitle="Update your profile, billing email, and notification preferences."
      seoTitle="Account Settings | RankyPulse"
      seoDescription="Update your profile, billing email, and notification preferences."
      seoCanonical={`${base}/account/settings`}
      seoRobots="noindex,nofollow"
    >
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="rp-card w-full max-w-md p-6">
            <div className="text-lg font-semibold text-[var(--rp-text-900)]">Disconnect Google Search Console?</div>
            <p className="mt-2 text-sm text-[var(--rp-text-600)]">
              This will remove your current connection. You can reconnect anytime.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rp-btn-secondary"
                onClick={() => setShowDisconnectConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rp-btn-primary"
                onClick={async () => {
                  await fetch(apiUrl("/api/gsc/disconnect"), {
                    method: "POST",
                    headers: anonId ? { "x-rp-anon-id": anonId } : {}
                  });
                  refreshGscStatus();
                  setToast("GSC disconnected.");
                  setTimeout(() => setToast(""), 2500);
                  setShowDisconnectConfirm(false);
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="rp-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-[var(--rp-text-600)]" htmlFor="account-full-name">
              Full name
              <input id="account-full-name" className="rp-input" placeholder="Avery Patel" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label className="flex flex-col gap-2 text-sm text-[var(--rp-text-600)]" htmlFor="account-work-email">
              Work email
              <input id="account-work-email" className="rp-input" placeholder="you@company.com" value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} />
            </label>
            <label className="flex flex-col gap-2 text-sm text-[var(--rp-text-600)] md:col-span-2" htmlFor="account-notify-summary">
              Notification summary
              <select id="account-notify-summary" className="rp-input">
                <option>Weekly digest</option>
                <option>Monthly digest</option>
                <option>Only critical alerts</option>
              </select>
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              className="rp-btn-primary"
              type="button"
              onClick={async () => {
                try {
                  const nextUser = { ...(authUser || {}), name: fullName, email: workEmail };
                  if (authUser?.email && workEmail && authUser.email !== workEmail) {
                    nextUser.verified = false;
                    setVerifyStatus("unverified");
                    setVerifyEmail(workEmail);
                    await fetch(apiUrl("/api/reset-password"), {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: workEmail, verifyOnly: true })
                    });
                    setToast("Email changed. Verification required.");
                    setTimeout(() => setToast(""), 2500);
                  }
                  localStorage.setItem("rp_auth_user", JSON.stringify(nextUser));
                } catch {}
              }}
            >
              <IconSettings size={14} />
              Save changes
            </button>
            <Link to="/plan-change" className="rp-btn-secondary"><IconArrowRight size={14} />Change plan</Link>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rp-card p-6">
            <h3 className="rp-section-title">Billing & subscription</h3>
            <p className="mt-2 rp-body-small">
              Manage your plan, invoices, and cancellation preferences.
            </p>
            <div className="mt-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-sm text-[var(--rp-text-600)]">
              {billingStatus === "loading" && "Loading billing status…"}
              {billingStatus === "error" && (billingError || "Unable to load billing status.")}
              {billingStatus === "success" && (
                <div className="space-y-2">
                  <div className="text-xs text-[var(--rp-text-500)]">Plan</div>
                  <div className="text-sm font-semibold text-[var(--rp-text-800)] capitalize">
                    {entitlements?.plan_id || "Trial"}
                  </div>
                  <div className="text-xs text-[var(--rp-text-500)]">
                    Status: <span className="font-semibold text-[var(--rp-text-700)]">{entitlements?.status || "trialing"}</span>
                  </div>
                  {entitlements?.trial_ends_at && (
                    <div className="text-xs text-[var(--rp-text-500)]">
                      Trial ends: {new Date(entitlements.trial_ends_at).toLocaleDateString()}
                    </div>
                  )}
                  {entitlements?.current_period_end && (
                    <div className="text-xs text-[var(--rp-text-500)]">
                      Next renewal: {new Date(entitlements.current_period_end).toLocaleDateString()}
                    </div>
                  )}
                  {entitlements?.cancel_at_period_end && (
                    <div className="text-xs text-amber-600">
                      Cancellation scheduled at period end.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/pricing" className="rp-btn-secondary">
                View plans
              </Link>
              <button
                type="button"
                className="rp-btn-primary"
                disabled={!entitlements?.subscription_id || canceling}
                title={!entitlements?.subscription_id ? "No active subscription to cancel." : "Cancel at period end"}
                onClick={async () => {
                  if (!entitlements?.subscription_id) return;
                  setCanceling(true);
                  try {
                    await fetch(apiUrl("/api/billing/razorpay/cancel-subscription"), {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "x-rp-anon-id": anonId
                      },
                      body: JSON.stringify({ cancel_at_period_end: true })
                    });
                    refreshBilling();
                  } catch {}
                  setCanceling(false);
                }}
              >
                {canceling ? "Canceling..." : "Cancel subscription"}
              </button>
            </div>
            <div className="mt-4">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--rp-text-400)]">Invoices</div>
              {invoices.length === 0 ? (
                <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                  No invoices yet. They’ll appear after your first payment.
                </div>
              ) : (
                <ul className="mt-2 space-y-2 text-xs text-[var(--rp-text-600)]">
                  {invoices.slice(0, 5).map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between rounded-xl border border-[var(--rp-border)] bg-white px-3 py-2">
                      <div>
                        <div className="font-semibold text-[var(--rp-text-700)]">{inv.id}</div>
                        <div className="text-[var(--rp-text-500)]">
                          {inv.status} · {inv.amount ? `₹${(inv.amount / 100).toFixed(2)}` : "—"}
                        </div>
                      </div>
                      {inv.short_url ? (
                        <a className="text-[var(--rp-indigo-700)] underline" href={inv.short_url} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : (
                        <span className="text-[var(--rp-text-400)]">—</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="rp-card p-6">
            <h3 className="rp-section-title">Email verification</h3>
            <p className="mt-2 rp-body-small">
              Verify your email to secure your account and enable notifications.
            </p>
            <div className="mt-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-sm text-[var(--rp-text-600)]">
              {verifyStatus === "verified" ? "Verified ✅" : "Not verified"}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="rp-btn-primary"
                onClick={async () => {
                  if (!verifyEmail) return;
                  const res = await fetch(apiUrl("/api/reset-password"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: verifyEmail, verifyOnly: true })
                  });
                  if (res.ok) {
                    setToast("Verification email sent.");
                    setTimeout(() => setToast(""), 2500);
                  } else {
                    setToast("Unable to send verification.");
                    setTimeout(() => setToast(""), 2500);
                  }
                }}
              >
                Resend verification email
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-[var(--rp-border)] bg-white p-4 text-sm text-[var(--rp-text-600)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[var(--rp-text-700)]">Require verified email to run audits</div>
                  <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                    When enabled, unverified users are blocked from running audits.
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                  <input
                    type="checkbox"
                    checked={blockUnverified}
                    onChange={async (e) => {
                      if (!isAdmin) return;
                      const next = e.target.checked;
                      setBlockUnverified(next);
                      try {
                        const token = getAuthToken();
                        if (token) {
                          await fetch(apiUrl("/api/account-settings"), {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ require_verified: next })
                          });
                        }
                      } catch {}
                    }}
                    disabled={!isAdmin}
                  />
                  Enable
                </label>
              </div>
              {!isAdmin && (
                <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                  Only admins can change this setting.
                </div>
              )}
            </div>
          </div>
          <div className="rp-card p-6">
            <h3 className="rp-section-title">Google Search Console</h3>
            <p className="mt-2 rp-body-small">
              Connect Search Console for trusted ranking data in audits.
            </p>
            <div className="mt-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-sm text-[var(--rp-text-600)]">
              {gscStatus === "loading" && "Checking connection…"}
              {gscStatus === "error" && "Unable to load GSC status."}
              {gscStatus === "success" && (
                gscConnected
                  ? `Connected. Token expires ${gscExpiry ? new Date(gscExpiry).toLocaleString() : "soon"}.`
                  : "Not connected yet."
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={apiUrl(`/api/gsc/auth/start?state=${encodeURIComponent(anonId)}`)} className="rp-btn-primary"><IconArrowRight size={14} />Connect GSC</a>
              {gscConnected && (
                <button
                  type="button"
                  className="rp-btn-secondary"
                  onClick={() => setShowDisconnectConfirm(true)}
    >
      {toast && (
        <div className="fixed right-6 top-6 z-[9999] rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-lg">
          {toast}
        </div>
      )}
                  <IconTrash size={14} />
                  Disconnect
                </button>
              )}
              <Link to="/audit" className="rp-btn-secondary"><IconArrowRight size={14} />Run audit</Link>
            </div>
          </div>

          <div className="rp-card p-6">
            <h3 className="rp-section-title">Account actions</h3>
            <p className="mt-2 rp-body-small">
              Need to remove your workspace? You can delete your account at any time.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link to="/account/deleted" className="rp-btn-secondary"><IconTrash size={14} />Delete account</Link>
              <Link to="/audit" className="rp-btn-primary"><IconArrowRight size={14} />Run audit</Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
