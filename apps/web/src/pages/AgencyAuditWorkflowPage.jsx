import AppShell from "../components/AppShell.jsx";
import { Link } from "react-router-dom";

export default function AgencyAuditWorkflowPage() {
  return (
    <AppShell
      title="Agency Client Audit Workflow"
      subtitle="Deliver shareable audits, align stakeholders, and turn fixes into client-ready action plans."
    >
      <div className="space-y-8 text-white/80">
        <section>
          <h2 className="text-lg font-semibold text-white">Why agencies use this flow</h2>
          <p className="mt-3">
            Clients need clear priority and proof before they approve work. This workflow keeps the audit
            centered on outcomes and makes it easy to share progress.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-base font-semibold text-white">Shareable report delivery</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/70">
              <li>Run the audit and generate a share link.</li>
              <li>Send the read-only report to stakeholders.</li>
              <li>Use the score and priorities to frame the kickoff call.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-base font-semibold text-white">Turn audits into action</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/70">
              <li>Export the audit summary for project planning.</li>
              <li>Assign the “Fix now” list to writers and devs.</li>
              <li>Re-run audits to document before/after progress.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Run the audit</h2>
          <p className="mt-3 text-sm text-white/70">
            Start with your client’s most valuable page and create a shareable report in minutes.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/start"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
            >
              Run Free Audit
            </Link>
            <Link
              to="/r/b2c7fcc7fef8844821e0b335b94a516a"
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white"
            >
              View a shared report
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
