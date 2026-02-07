import React from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { IconArrowRight, IconCheck } from "../components/Icons.jsx";

export default function UpgradeSuccessPage() {
  return (
    <AppShell
      title="Upgrade complete"
      subtitle="Your RankyPulse Pro workspace is ready. Here’s what to do next."
    >
      <div className="rp-card p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <IconCheck size={20} />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[var(--rp-text-900)]">You are all set</h2>
        <p className="mt-2 rp-body-small">
          Premium reports, fix plans, and tracking are now unlocked. A confirmation email is on the way.
        </p>
        <div className="mt-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-left text-sm text-[var(--rp-text-600)]">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--rp-text-500)]">Next steps</div>
          <ul className="mt-3 space-y-2">
            <li>1. Run a new audit to generate your first Pro fix plan.</li>
            <li>2. Export a client‑ready report and share it with stakeholders.</li>
            <li>3. Review billing and manage your plan in Account Settings.</li>
          </ul>
        </div>
        <div className="mt-3 text-xs text-[var(--rp-text-500)]">
          If you still see a verification banner, confirm your email to unlock audits.
        </div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-center">
          <Link to="/audit" className="rp-btn-primary"><IconArrowRight size={14} />Run a new audit</Link>
          <Link to="/account/settings" className="rp-btn-secondary"><IconArrowRight size={14} />Manage account</Link>
        </div>
      </div>
    </AppShell>
  );
}
