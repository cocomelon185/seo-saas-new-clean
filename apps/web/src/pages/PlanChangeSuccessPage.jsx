import React from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { IconArrowRight, IconCheck } from "../components/Icons.jsx";

export default function PlanChangeSuccessPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  return (
    <AppShell
      title="Plan updated"
      subtitle="Your subscription has been updated. The new limits are active now."
      seoTitle="Plan Updated | RankyPulse"
      seoDescription="Your subscription has been updated."
      seoCanonical={`${base}/plan-change/success`}
      seoRobots="noindex,nofollow"
    >
      <div className="rp-card p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
          <IconCheck size={20} />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[var(--rp-text-900)]">Update confirmed</h2>
        <p className="mt-2 rp-body-small">
          A receipt has been sent to your inbox. Your team can now schedule the next audit run.
        </p>
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-center">
          <Link to="/audit" className="rp-btn-primary"><IconArrowRight size={14} />Run audit</Link>
          <Link to="/account/settings" className="rp-btn-secondary"><IconArrowRight size={14} />View settings</Link>
        </div>
      </div>
    </AppShell>
  );
}
