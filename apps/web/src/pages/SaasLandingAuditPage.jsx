import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { Link } from "react-router-dom";
import { IconCompass, IconShield, IconBolt, IconArrowRight } from "../components/Icons.jsx";

export default function SaasLandingAuditPage() {
  return (
    <MarketingShell
      title="SaaS Landing Page Audit"
      subtitle="Use this audit to validate clarity, proof, and conversion signals before you scale traffic."
    >
      <div className="space-y-8 text-[var(--rp-text-600)]">
        <section>
          <h2 className="rp-section-title flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
              <IconCompass size={16} />
            </span>
            What this audit solves
          </h2>
          <p className="mt-3 rp-body-small">
            SaaS landing pages fail when the message is vague or when proof is missing. This checklist ties
            the audit to the exact fixes that keep visitors reading and converting.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rp-card p-5">
            <h3 className="text-base font-semibold text-[var(--rp-text-900)] flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <IconBolt size={14} />
              </span>
              Above-the-fold clarity
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--rp-text-600)]">
              <li>Headline states the outcome, not the feature.</li>
              <li>Subhead clarifies who it's for and the primary use case.</li>
              <li>CTA copy matches the audit step (e.g. "Run a free audit").</li>
            </ul>
          </div>
          <div className="rp-card p-5">
            <h3 className="text-base font-semibold text-[var(--rp-text-900)] flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <IconShield size={14} />
              </span>
              Proof and credibility
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--rp-text-600)]">
              <li>Add screenshots or before/after metrics near the CTA.</li>
              <li>Use client logos or quotes that mention outcomes.</li>
              <li>Link to a shareable report to show real audit output.</li>
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
            Start with a real landing page and capture the first 3 fixes that unlock immediate clarity.
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
              to="/pricing"
              className="rp-btn-secondary text-sm"
            >
              <IconArrowRight size={14} />
              See paid plan examples
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
