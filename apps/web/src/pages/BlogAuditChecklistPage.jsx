import AppShell from "../components/AppShell.jsx";
import { Link } from "react-router-dom";

export default function BlogAuditChecklistPage() {
  return (
    <AppShell
      title="Blog Post Audit Checklist"
      subtitle="Use RankyPulse audits to catch thin content, weak structure, and missing search intent coverage."
    >
      <div className="space-y-8 text-white/80">
        <section>
          <h2 className="text-lg font-semibold text-white">Checklist highlights</h2>
          <p className="mt-3">
            Blog posts win when they answer the query fast, cover the right subtopics, and signal credibility.
            This checklist keeps audits focused on the highest-impact fixes.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-base font-semibold text-white">Search intent match</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/70">
              <li>Title includes the exact topic and primary keyword.</li>
              <li>Intro confirms the question being answered.</li>
              <li>H2 sections cover each subtopic you want to rank for.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-base font-semibold text-white">Depth and trust signals</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/70">
              <li>Word count matches the top results in the SERP.</li>
              <li>Add credible sources or internal links to deeper posts.</li>
              <li>Include a concrete next step or CTA near the end.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Run the audit</h2>
          <p className="mt-3 text-sm text-white/70">
            Paste a blog post URL and capture the “Fix now” priorities for the quickest SEO lift.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/start"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
            >
              Run Free Audit
            </Link>
            <Link
              to="/improve"
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white"
            >
              See improve workflow
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
