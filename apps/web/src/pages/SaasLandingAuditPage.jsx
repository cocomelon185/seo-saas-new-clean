import AppShell from "../components/AppShell.jsx";
import { Link } from "react-router-dom";

export default function SaasLandingAuditPage() {
  return (
    <AppShell
      title="SaaS Landing Page Audit"
      subtitle="Use this audit to validate clarity, proof, and conversion signals before you scale traffic."
    >
      <div className="space-y-8 text-white/80">
        <section>
          <h2 className="text-lg font-semibold text-white">What this audit solves</h2>
          <p className="mt-3">
            SaaS landing pages fail when the message is vague or when proof is missing. This checklist ties
            the audit to the exact fixes that keep visitors reading and converting.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-base font-semibold text-white">Above-the-fold clarity</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/70">
              <li>Headline states the outcome, not the feature.</li>
              <li>Subhead clarifies who it’s for and the primary use case.</li>
              <li>CTA copy matches the audit step (e.g. “Run a free audit”).</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-base font-semibold text-white">Proof and credibility</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/70">
              <li>Add screenshots or before/after metrics near the CTA.</li>
              <li>Use client logos or quotes that mention outcomes.</li>
              <li>Link to a shareable report to show real audit output.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Run the audit</h2>
          <p className="mt-3 text-sm text-white/70">
            Start with a real landing page and capture the first 3 fixes that unlock immediate clarity.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/start"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
            >
              Run Free Audit
            </Link>
            <Link
              to="/pricing"
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white"
            >
              See paid plan examples
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
