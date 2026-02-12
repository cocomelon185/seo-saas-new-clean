import { useEffect, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";

export default function AnalyticsPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const [status, setStatus] = useState("loading");
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/analytics/funnel?days=30"))
      .then((r) => safeJson(r))
      .then((data) => {
        if (cancelled) return;
        if (data?.ok) {
          setCounts(data.counts || null);
          setStatus("success");
        } else {
          setStatus("error");
          setError(data?.error || "Unable to load analytics.");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setError(String(err?.message || "Unable to load analytics."));
      });
    return () => { cancelled = true; };
  }, []);

  const funnel = counts || { signup: 0, audit_run: 0, upgrade_clicked: 0, subscribed: 0 };
  const pct = (a, b) => {
    if (!b) return "—";
    return `${((a / b) * 100).toFixed(1)}%`;
  };

  return (
    <AppShell
      title="Conversion Analytics"
      subtitle="Track the signup → audit → upgrade → subscribe funnel (last 30 days)."
      seoTitle="Conversion Analytics | RankyPulse"
      seoDescription="Track the signup → audit → upgrade → subscribe funnel."
      seoCanonical={`${base}/admin/analytics`}
      seoRobots="noindex,nofollow"
    >
      {status === "error" && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Signups", value: funnel.signup },
          { label: "Audits run", value: funnel.audit_run },
          { label: "Upgrade clicks", value: funnel.upgrade_clicked },
          { label: "Subscribers", value: funnel.subscribed }
        ].map((item) => (
          <div key={item.label} className="rp-kpi-card rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
            <div className="text-xs text-[var(--rp-text-500)]">{item.label}</div>
            <div className="mt-2 text-2xl font-semibold text-[var(--rp-text-900)]">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rp-card p-6">
        <div className="rp-section-title">Funnel conversion</div>
        <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-[var(--rp-text-600)]">
          <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
            <div className="text-xs text-[var(--rp-text-500)]">Signup → Audit</div>
            <div className="mt-2 text-lg font-semibold text-[var(--rp-text-900)]">{pct(funnel.audit_run, funnel.signup)}</div>
          </div>
          <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
            <div className="text-xs text-[var(--rp-text-500)]">Audit → Upgrade Click</div>
            <div className="mt-2 text-lg font-semibold text-[var(--rp-text-900)]">{pct(funnel.upgrade_clicked, funnel.audit_run)}</div>
          </div>
          <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
            <div className="text-xs text-[var(--rp-text-500)]">Upgrade → Subscribe</div>
            <div className="mt-2 text-lg font-semibold text-[var(--rp-text-900)]">{pct(funnel.subscribed, funnel.upgrade_clicked)}</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
