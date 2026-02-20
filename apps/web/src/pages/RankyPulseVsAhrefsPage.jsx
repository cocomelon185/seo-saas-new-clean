import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { Link } from "react-router-dom";
import { IconArrowRight } from "../components/Icons.jsx";
import Seo from "../components/Seo.jsx";

export default function RankyPulseVsAhrefsPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  return (
    <>
      <Seo
        title="RankyPulse vs Ahrefs | SEO Audit Comparison"
        description="Compare RankyPulse vs Ahrefs for audit workflows, fix prioritization, and team execution speed."
        canonical={`${base}/compare/rankypulse-vs-ahrefs`}
      />
      <MarketingShell
        title="RankyPulse vs Ahrefs"
        subtitle="Choose the tool based on workflow fit: fix-first execution vs broad SEO intelligence depth."
      >
        <div className="space-y-8 text-[var(--rp-text-600)]">
          <section className="rp-card p-5">
            <p className="text-xs text-[var(--rp-text-500)]">
              Ahrefs is a trademark of its owner. This page is an independent comparison for buyer education.
            </p>
          </section>

          <section className="overflow-x-auto">
            <table className="w-full min-w-[640px] rp-card text-sm">
              <thead>
                <tr className="border-b border-[var(--rp-border)]">
                  <th className="p-4 text-left font-semibold text-[var(--rp-text-900)]">Capability</th>
                  <th className="p-4 text-left font-semibold text-[var(--rp-text-900)]">RankyPulse</th>
                  <th className="p-4 text-left font-semibold text-[var(--rp-text-900)]">Ahrefs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rp-border)]">
                <tr><td className="p-4">Fast URL audit workflow</td><td className="p-4">Strong</td><td className="p-4">Available</td></tr>
                <tr><td className="p-4">Fix-first prioritized recommendations</td><td className="p-4">Core focus</td><td className="p-4">Broader toolset</td></tr>
                <tr><td className="p-4">Shareable client report workflow</td><td className="p-4">Built-in</td><td className="p-4">Available</td></tr>
                <tr><td className="p-4">Backlink and link index depth</td><td className="p-4">Limited</td><td className="p-4">Strong</td></tr>
              </tbody>
            </table>
          </section>

          <section className="rp-card p-5 border-2 border-[var(--rp-indigo-200)]">
            <h2 className="rp-section-title">Try the workflow</h2>
            <p className="mt-3 rp-body-small">
              If your priority is moving from audit to shipped fixes quickly, run a live scan now.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/start" className="rp-btn-primary text-sm">
                <IconArrowRight size={14} />
                Run Free Audit
              </Link>
              <Link to="/sample-report" className="rp-btn-secondary text-sm">
                <IconArrowRight size={14} />
                View sample report
              </Link>
            </div>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
