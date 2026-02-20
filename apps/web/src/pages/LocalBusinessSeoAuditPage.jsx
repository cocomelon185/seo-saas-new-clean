import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { Link } from "react-router-dom";
import { IconArrowRight, IconCompass, IconReport, IconShield } from "../components/Icons.jsx";
import Seo from "../components/Seo.jsx";

export default function LocalBusinessSeoAuditPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  return (
    <>
      <Seo
        title="Local Business SEO Audit | RankyPulse"
        description="Audit local service pages for location relevance, trust signals, and conversion-ready SEO improvements."
        canonical={`${base}/use-cases/local-business-seo-audit`}
      />
      <MarketingShell
        title="Local Business SEO Audit"
        subtitle="Improve local visibility with audits focused on service pages, location intent, and trust."
      >
        <div className="space-y-8 text-[var(--rp-text-600)]">
          <section>
            <h2 className="rp-section-title flex items-center gap-2">
              <IconCompass size={16} />
              Core local SEO checks
            </h2>
            <p className="mt-3 rp-body-small">
              Local sites win when service pages are clear, location intent is explicit, and trust signals are strong.
              This workflow keeps your audit focused on calls, leads, and booked appointments.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rp-card p-5">
              <h3 className="text-base font-semibold text-[var(--rp-text-900)] flex items-center gap-2">
                <IconShield size={14} />
                On-page location relevance
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                <li>Service + city terms in titles and headings</li>
                <li>Clear NAP details on priority pages</li>
                <li>Dedicated pages for major service areas</li>
                <li>Internal links from blog to service pages</li>
              </ul>
            </div>
            <div className="rp-card p-5">
              <h3 className="text-base font-semibold text-[var(--rp-text-900)] flex items-center gap-2">
                <IconReport size={14} />
                Conversion trust signals
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                <li>Fast mobile load times on contact pages</li>
                <li>Testimonials/reviews visible near CTA</li>
                <li>Contact buttons above the fold</li>
                <li>Schema and crawlability checks pass</li>
              </ul>
            </div>
          </section>

          <section className="rp-card p-5 border-2 border-[var(--rp-indigo-200)]">
            <h2 className="rp-section-title">Run local SEO audit</h2>
            <p className="mt-3 rp-body-small">
              Start with your highest-value service page and capture quick wins for rankings and lead conversion.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/start" className="rp-btn-primary text-sm">
                <IconArrowRight size={14} />
                Run Free Audit
              </Link>
              <Link to="/contact" className="rp-btn-secondary text-sm">
                <IconArrowRight size={14} />
                Contact us for help
              </Link>
            </div>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
