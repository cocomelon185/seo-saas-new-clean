import StartAuditExtras from "../marketing/components/StartAuditExtras.jsx";
import { IconPlay } from "../components/Icons.jsx";
import Seo from "../components/Seo.jsx";
import { useNavigate } from "react-router-dom";
import { getSignupAuditHref } from "../lib/auditGate.js";

export default function StartAuditPage() {
  const navigate = useNavigate();
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const url = String(fd.get("url") || "").trim();
    if (!url) return;
    navigate(getSignupAuditHref(url));
  };
  return (
    <main className="rp-page rp-premium-bg flex items-center justify-center px-4" role="main">
      <Seo
        title="Start a Free SEO Audit | RankyPulse"
        description="Run a free SEO audit in 30 seconds. Get your score, quick wins, and a clear fix plan."
        canonical={`${base}/start`}
      />
      <div className="relative w-full max-w-2xl">
        <div className="rp-surface p-6 md:p-10">
          <p className="rp-kicker text-center">Instant Audit</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-center text-[var(--rp-text-900)] md:text-4xl">
            Run a free SEO audit in 30 seconds
          </h1>
          <p className="mt-2 text-center rp-body-small">
            Get your score, quick wins, and a clear fix plan.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div>
              <label className="sr-only" htmlFor="start-audit-url">Website URL</label>
              <input
                id="start-audit-url"
                type="text"
                name="url"
                placeholder="https://example.com"
                required
                className="rp-input"
              />
            </div>

            <button
              type="submit"
              title="Run a free audit"
              className="rp-btn-primary w-full"
            >
              <IconPlay size={16} />
              Run Free Audit
            </button>

            <p className="text-xs text-[var(--rp-text-500)] text-center">
              Create a free account to run your audit
            </p>
            <p className="text-xs text-center">
              <a className="text-[var(--rp-indigo-700)] hover:underline" href="/sample-report">
                View a sample results report
              </a>
            </p>
            <p className="text-xs text-center">
              <a className="text-[var(--rp-text-500)] hover:text-[var(--rp-text-700)] hover:underline" href="/sample-report">
                Results
              </a>
              <span className="text-[var(--rp-text-400)]"> · </span>
              <a className="text-[var(--rp-text-500)] hover:text-[var(--rp-text-700)] hover:underline" href="/auth/signup?next=%2Faudit">
                Go to audit
              </a>
            </p>
          </form>

          <StartAuditExtras />
        </div>
      </div>
    </main>
  );
}
