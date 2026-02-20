import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { Link } from "react-router-dom";
import { IconArrowRight } from "../components/Icons.jsx";
import Seo from "../components/Seo.jsx";

export default function RankyPulseVsSemrushPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  return (
    <>
      <Seo
        title="RankyPulse vs Semrush | SEO Audit Comparison"
        description="Compare RankyPulse vs Semrush for audit speed, recommendation clarity, and execution workflow."
        canonical={`${base}/compare/rankypulse-vs-semrush`}
      />
      <MarketingShell
        title="RankyPulse vs Semrush"
        subtitle="Understand which platform fits your team’s audit depth and execution speed requirements."
      >
        <div className="space-y-8 text-[var(--rp-text-600)]">
          <section className="rp-card p-5">
            <p className="text-xs text-[var(--rp-text-500)]">
              Semrush is a trademark of its owner. This page is an independent comparison for buyer education.
            </p>
          </section>

          <section className="overflow-x-auto">
            <table className="w-full min-w-[640px] rp-card text-sm">
              <thead>
                <tr className="border-b border-[var(--rp-border)]">
                  <th className="p-4 text-left font-semibold text-[var(--rp-text-900)]">Capability</th>
                  <th className="p-4 text-left font-semibold text-[var(--rp-text-900)]">RankyPulse</th>
                  <th className="p-4 text-left font-semibold text-[var(--rp-text-900)]">Semrush</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rp-border)]">
                <tr><td className="p-4">Single-URL audit and fix flow</td><td className="p-4">Core focus</td><td className="p-4">Available</td></tr>
                <tr><td className="p-4">Beginner-friendly recommendation clarity</td><td className="p-4">Strong</td><td className="p-4">Strong</td></tr>
                <tr><td className="p-4">Large suite breadth (ads, keyword DB, etc.)</td><td className="p-4">Focused</td><td className="p-4">Strong</td></tr>
                <tr><td className="p-4">Share-first report UX</td><td className="p-4">Strong</td><td className="p-4">Available</td></tr>
              </tbody>
            </table>
          </section>

          <section className="rp-card p-5 border-2 border-[var(--rp-indigo-200)]">
            <h2 className="rp-section-title">Run your own test</h2>
            <p className="mt-3 rp-body-small">
              Compare results on your own URL and evaluate which output helps your team ship fixes faster.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/start" className="rp-btn-primary text-sm">
                <IconArrowRight size={14} />
                Run Free Audit
              </Link>
              <Link to="/pricing" className="rp-btn-secondary text-sm">
                <IconArrowRight size={14} />
                See pricing
              </Link>
            </div>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
