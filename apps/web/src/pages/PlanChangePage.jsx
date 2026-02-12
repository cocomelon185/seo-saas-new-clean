import React from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { IconArrowRight } from "../components/Icons.jsx";

export default function PlanChangePage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  return (
    <AppShell
      title="Change your plan"
      subtitle="Scale your audit volume up or down any time. Changes take effect immediately."
      seoTitle="Change Plan | RankyPulse"
      seoDescription="Change your RankyPulse plan."
      seoCanonical={`${base}/plan-change`}
      seoRobots="noindex,nofollow"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rp-card p-6">
          <h2 className="text-lg font-semibold text-[var(--rp-text-900)]">Current plan</h2>
          <div className="mt-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
            <p className="text-sm font-semibold text-[var(--rp-text-900)]">Growth</p>
            <p className="text-xs text-[var(--rp-text-500)]">30 audits per month</p>
          </div>
          <p className="mt-4 rp-body-small">
            You can switch plans at any time. Billing changes are prorated automatically.
          </p>
        </div>

        <div className="rp-card p-6">
          <h3 className="text-lg font-semibold text-[var(--rp-text-900)]">Choose a new plan</h3>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-[var(--rp-text-700)]" htmlFor="plan-agency">
              <span>Agency - 120 audits</span>
              <input id="plan-agency" type="radio" name="plan" defaultChecked />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-sm text-[var(--rp-text-600)]" htmlFor="plan-starter">
              <span>Starter - 10 audits</span>
              <input id="plan-starter" type="radio" name="plan" />
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <Link to="/plan-change/success" className="rp-btn-primary"><IconArrowRight size={14} />Confirm change</Link>
            <Link to="/account/settings" className="rp-btn-secondary"><IconArrowRight size={14} />Cancel</Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
