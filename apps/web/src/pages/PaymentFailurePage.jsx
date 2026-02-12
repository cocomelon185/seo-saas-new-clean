import React from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { IconArrowRight } from "../components/Icons.jsx";

export default function PaymentFailurePage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  return (
    <AppShell
      title="Payment failed"
      subtitle="We could not complete the upgrade. Please try again or use a different payment method."
      seoTitle="Payment Failed | RankyPulse"
      seoDescription="We could not complete the upgrade. Please try again or use a different payment method."
      seoCanonical={`${base}/upgrade/failure`}
      seoRobots="noindex,nofollow"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rp-card p-6">
          <h2 className="text-lg font-semibold text-[var(--rp-text-900)]">What happened</h2>
          <p className="mt-2 rp-body-small">
            The payment provider declined the charge or the session expired. No funds were captured.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/upgrade" className="rp-btn-primary"><IconArrowRight size={14} />Try again</Link>
            <Link to="/pricing" className="rp-btn-secondary"><IconArrowRight size={14} />View plans</Link>
          </div>
        </div>
        <div className="rp-card p-6">
          <h3 className="text-sm uppercase tracking-[0.3em] text-[var(--rp-text-500)]">Need help?</h3>
          <p className="mt-3 rp-body-small">
            If you see this again, contact support and we will restore your upgrade session quickly.
          </p>
          <div className="mt-5">
            <Link to="/about" className="rp-btn-secondary w-full text-center"><IconArrowRight size={14} />Contact support</Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
