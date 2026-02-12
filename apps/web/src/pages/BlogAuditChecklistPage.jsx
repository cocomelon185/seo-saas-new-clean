import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { Link } from "react-router-dom";
import { IconDoc, IconBolt, IconReport, IconArrowRight } from "../components/Icons.jsx";
import Seo from "../components/Seo.jsx";

export default function BlogAuditChecklistPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  return (
    <>
      <Seo
        title="Blog Post Audit Checklist | RankyPulse"
        description="Use RankyPulse audits to catch thin content, weak structure, and missing search intent coverage."
        canonical={`${base}/use-cases/blog-audit-checklist`}
      />
      <MarketingShell
        title="Blog Post Audit Checklist"
        subtitle="Use RankyPulse audits to catch thin content, weak structure, and missing search intent coverage."
      >
        <div className="space-y-8 text-[var(--rp-text-600)]">
        <section>
          <h2 className="rp-section-title flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <IconDoc size={16} />
            </span>
            Checklist highlights
          </h2>
          <p className="mt-3 rp-body-small">
            Blog posts win when they answer the query fast, cover the right subtopics, and signal credibility.
            This checklist keeps audits focused on the highest-impact fixes.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rp-card p-5">
            <h3 className="text-base font-semibold text-[var(--rp-text-900)] flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <IconBolt size={14} />
              </span>
              Search intent match
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--rp-text-600)]">
              <li>Title includes the exact topic and primary keyword.</li>
              <li>Intro confirms the question being answered.</li>
              <li>H2 sections cover each subtopic you want to rank for.</li>
            </ul>
          </div>
          <div className="rp-card p-5">
            <h3 className="text-base font-semibold text-[var(--rp-text-900)] flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                <IconReport size={14} />
              </span>
              Depth and trust signals
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--rp-text-600)]">
              <li>Word count matches the top results in the SERP.</li>
              <li>Add credible sources or internal links to deeper posts.</li>
              <li>Include a concrete next step or CTA near the end.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="rp-section-title flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
              <IconBolt size={16} />
            </span>
            Run the audit
          </h2>
          <p className="mt-3 rp-body-small">
            Paste a blog post URL and capture the "Fix now" priorities for the quickest SEO lift.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/start"
              className="rp-btn-primary text-sm"
            >
              <IconArrowRight size={14} />
              Run Free Audit
            </Link>
            <Link
              to="/improve"
              className="rp-btn-secondary text-sm"
            >
              <IconArrowRight size={14} />
              See improve workflow
            </Link>
          </div>
        </section>
        </div>
      </MarketingShell>
    </>
  );
}
