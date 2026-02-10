import React from "react";
import { Link } from "react-router-dom";
import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { IconArrowRight, IconShield } from "../components/Icons.jsx";

export default function AboutPage() {
  return (
    <MarketingShell
      title="About RankyPulse"
      subtitle="We help growth teams convert SEO insights into revenue-ready actions."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rp-card p-6">
          <h2 className="rp-section-title flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
              <IconShield size={16} />
            </span>
            Our mission
          </h2>
          <p className="mt-3 rp-body-small">
            RankyPulse turns audits into focused playbooks. We blend technical SEO checks with
            conversion guidance so teams can ship wins fast.
          </p>
          <p className="mt-4 rp-body-small">
            We are obsessed with clarity, speed, and premium client experiences.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/audit" className="rp-btn-primary"><IconArrowRight size={14} />Run an audit</Link>
            <Link to="/pricing" className="rp-btn-secondary"><IconArrowRight size={14} />View pricing</Link>
          </div>
        </div>

        <div className="rp-card p-6">
          <h3 className="rp-section-title">Contact</h3>
          <p className="mt-2 rp-body-small">
            Reach out for enterprise plans, partnerships, or support requests.
          </p>
          <div className="mt-4 space-y-3 text-sm text-[var(--rp-text-600)]">
            <div>Support: support@rankypulse.com</div>
            <div>Partnerships: hello@rankypulse.com</div>
            <div>HQ: Remote-first, global team</div>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
