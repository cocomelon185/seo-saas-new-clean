import { Link } from "react-router-dom";
import MarketingShell from "../marketing/components/MarketingShell.jsx";
import Seo from "../components/Seo.jsx";
import { getAuthToken } from "../lib/authClient.js";

export default function SampleReportPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const authed = Boolean(getAuthToken());

  return (
    <>
      <Seo
        title="Sample SEO Audit Report | RankyPulse"
        description="Preview a sample RankyPulse SEO audit report with score, issues, quick wins, and fix priorities."
        canonical={`${base}/sample-report`}
      />
      <MarketingShell
        title="Sample SEO Audit Report"
        subtitle="This is a real-style sample so new users can see exactly what they get after signup."
      >
        <div className="space-y-5 text-[var(--rp-text-700)]">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "SEO health", value: "49", tone: "text-emerald-700" },
              { label: "Issues found", value: "2", tone: "text-rose-700" },
              { label: "Quick wins", value: "2", tone: "text-amber-700" },
              { label: "Estimated lift", value: "+6%", tone: "text-[var(--rp-indigo-700)]" }
            ].map((item) => (
              <div key={item.label} className="rp-card p-4">
                <div className="text-xs text-[var(--rp-text-500)]">{item.label}</div>
                <div className={`mt-2 text-3xl font-semibold ${item.tone}`}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="rp-card p-5">
            <h2 className="rp-section-title">Top fix preview</h2>
            <div className="mt-3 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
              <div className="text-sm font-semibold text-[var(--rp-text-900)]">No main page URL set</div>
              <p className="mt-2 text-sm text-[var(--rp-text-600)]">
                Search engines may split ranking power across duplicate URL versions.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[var(--rp-border)] bg-white p-3 text-sm">
                  <div className="font-semibold">Simple fix</div>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-[var(--rp-text-600)]">
                    <li>Open your page SEO settings.</li>
                    <li>Set one canonical/main URL.</li>
                    <li>Save and republish.</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-[var(--rp-border)] bg-white p-3 text-sm">
                  <div className="font-semibold">Expected result</div>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-[var(--rp-text-600)]">
                    <li>Cleaner indexing signals.</li>
                    <li>Less duplicate confusion.</li>
                    <li>Better ranking stability.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="rp-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-[var(--rp-text-900)]">Ready to run your own audit?</div>
                <div className="text-sm text-[var(--rp-text-500)]">
                  Sign up first, then run a live audit for your own website URL.
                </div>
              </div>
              <Link to={authed ? "/start" : "/auth/signup?next=%2Fstart"} className="rp-btn-primary text-sm">
                Run Free Audit
              </Link>
            </div>
          </div>
        </div>
      </MarketingShell>
    </>
  );
}

