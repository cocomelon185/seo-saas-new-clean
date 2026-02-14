import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { Link } from "react-router-dom";
import { IconDoc, IconBolt, IconArrowRight } from "../components/Icons.jsx";
import Seo from "../components/Seo.jsx";

export default function SeoReportTemplatePage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  return (
    <>
      <Seo
        title="SEO Report Template (What to Include) | RankyPulse"
        description="Learn what sections every SEO report should contain. Use our template structure and automate reporting with RankyPulse."
        canonical={`${base}/seo-report-template`}
      />
      <MarketingShell
        title="SEO Report Template (What to Include)"
        subtitle="A practical structure for SEO reports that stakeholders understand and act on."
      >
        <div className="space-y-8 text-[var(--rp-text-600)]">
          <section>
            <h2 className="rp-section-title">What an SEO Report Is</h2>
            <p className="mt-3 rp-body-small">
              An SEO report summarizes audit results, rankings, traffic, and recommendations. It answers "What’s wrong?"
              and "What should we do first?" A good report uses clear language, visual scores, and prioritized actions.
              Tools like RankyPulse can generate report-ready output from a single audit—see our{" "}
              <Link to="/seo-tool-audit" className="text-[var(--rp-indigo-700)] hover:underline">free SEO audit tool</Link> to automate this.
            </p>
          </section>

          <section>
            <h2 className="rp-section-title flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <IconDoc size={16} />
              </span>
              Sections Every Report Should Contain
            </h2>
            <ol className="mt-4 space-y-4">
              <li className="rp-card p-5">
                <h3 className="text-base font-semibold text-[var(--rp-text-900)]">1. Executive Summary</h3>
                <p className="mt-2 rp-body-small">
                  One-paragraph overview: current health, top 3–5 issues, and main recommendation. Non-technical stakeholders should understand it.
                </p>
              </li>
              <li className="rp-card p-5">
                <h3 className="text-base font-semibold text-[var(--rp-text-900)]">2. SEO Score or Health Metric</h3>
                <p className="mt-2 rp-body-small">
                  A single number or grade (e.g. 0–100) that signals overall health. Include a trend if you have historical data.
                </p>
              </li>
              <li className="rp-card p-5">
                <h3 className="text-base font-semibold text-[var(--rp-text-900)]">3. Prioritized Issues</h3>
                <p className="mt-2 rp-body-small">
                  Ranked list of issues with severity, impact, and fix steps. Use our{" "}
                  <Link to="/seo-audit-checklist" className="text-[var(--rp-indigo-700)] hover:underline">audit checklist</Link> to ensure you’ve covered technical, on-page, content, and UX.
                </p>
              </li>
              <li className="rp-card p-5">
                <h3 className="text-base font-semibold text-[var(--rp-text-900)]">4. Quick Wins</h3>
                <p className="mt-2 rp-body-small">
                  Low-effort, high-impact fixes that can be shipped quickly. Clients love these.
                </p>
              </li>
              <li className="rp-card p-5">
                <h3 className="text-base font-semibold text-[var(--rp-text-900)]">5. Next Steps</h3>
                <p className="mt-2 rp-body-small">
                  Clear actions with owners and timelines. Tie back to the prioritized issues.
                </p>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="rp-section-title">Example Report Structure</h2>
            <div className="mt-4 rp-card p-5 font-mono text-sm text-[var(--rp-text-700)]">
              <pre className="whitespace-pre-wrap break-words">
{`1. Executive summary
2. SEO score (e.g., 72/100)
3. Top 5 issues (each with severity, impact, fix)
4. Quick wins (3–5 items)
5. Technical overview (optional)
6. Content / on-page summary (optional)
7. Recommendations & next steps`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="rp-section-title">How Tools Automate Reporting</h2>
            <p className="mt-3 rp-body-small">
              Manual reports take hours. A <Link to="/website-seo-checker" className="text-[var(--rp-indigo-700)] hover:underline">website checker</Link> like RankyPulse
              runs the audit and outputs score, prioritized issues, quick wins, and shareable links. You can export or
              send the report directly to stakeholders. For a deeper technical breakdown, combine with our{" "}
              <Link to="/technical-seo-audit" className="text-[var(--rp-indigo-700)] hover:underline">technical SEO audit guide</Link>.
            </p>
          </section>

          <section>
            <h2 className="rp-section-title flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                <IconBolt size={16} />
              </span>
              Generate a Report Now
            </h2>
            <p className="mt-3 rp-body-small">
              Run an audit with RankyPulse and get a report structure that includes score, top fixes, quick wins, and shareable output.
            </p>
            <div className="mt-4">
              <Link to="/seo-tool-audit" className="rp-btn-primary text-sm inline-flex items-center gap-2">
                <IconArrowRight size={14} />
                Run Audit & Generate Report
              </Link>
            </div>
          </section>

          <section className="rp-card p-5 border-2 border-[var(--rp-indigo-200)]">
            <h3 className="rp-section-title">Ready for a client-ready report?</h3>
            <p className="mt-2 rp-body-small">
              Start with a free audit. Share the results or export for your own reporting template.
            </p>
            <Link to="/seo-tool-audit" className="rp-btn-primary text-sm mt-4 inline-flex items-center gap-2">
              <IconArrowRight size={14} />
              Start Free Audit
            </Link>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
