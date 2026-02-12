import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { Link } from "react-router-dom";
import { IconShield, IconReport, IconBolt, IconArrowRight } from "../components/Icons.jsx";
import Seo from "../components/Seo.jsx";

export default function AgencyAuditWorkflowPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  return (
    <>
      <Seo
        title="Agency Client Audit Workflow | RankyPulse"
        description="Deliver shareable audits, align stakeholders, and turn fixes into client-ready action plans."
        canonical={`${base}/use-cases/agency-audit-workflow`}
      />
      <MarketingShell
        title="Agency Client Audit Workflow"
        subtitle="Deliver shareable audits, align stakeholders, and turn fixes into client-ready action plans."
      >
        <div className="space-y-8 text-[var(--rp-text-600)]">
        <section>
          <h2 className="rp-section-title flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <IconShield size={16} />
            </span>
            Why agencies use this flow
          </h2>
          <p className="mt-3 rp-body-small">
            Clients need clear priority and proof before they approve work. This workflow keeps the audit
            centered on outcomes and makes it easy to share progress.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rp-card p-5">
            <h3 className="text-base font-semibold text-[var(--rp-text-900)] flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                <IconReport size={14} />
              </span>
              Shareable report delivery
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--rp-text-600)]">
              <li>Run the audit and generate a share link.</li>
              <li>Send the read-only report to stakeholders.</li>
              <li>Use the score and priorities to frame the kickoff call.</li>
            </ul>
          </div>
          <div className="rp-card p-5">
            <h3 className="text-base font-semibold text-[var(--rp-text-900)] flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <IconBolt size={14} />
              </span>
              Turn audits into action
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--rp-text-600)]">
              <li>Export the audit summary for project planning.</li>
              <li>Assign the "Fix now" list to writers and devs.</li>
              <li>Re-run audits to document before/after progress.</li>
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
            Start with your client's most valuable page and create a shareable report in minutes.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/auth/signup?next=%2Fstart"
              className="rp-btn-primary text-sm"
            >
              <IconArrowRight size={14} />
              Run Free Audit
            </Link>
            <Link
              to="/r/b2c7fcc7fef8844821e0b335b94a516a"
              className="rp-btn-secondary text-sm"
            >
              <IconArrowRight size={14} />
              View a shared report
            </Link>
          </div>
        </section>
        </div>
      </MarketingShell>
    </>
  );
}
