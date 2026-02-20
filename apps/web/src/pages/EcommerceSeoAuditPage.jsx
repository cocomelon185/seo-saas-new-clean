import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { Link } from "react-router-dom";
import { IconArrowRight, IconBolt, IconReport, IconShield } from "../components/Icons.jsx";
import Seo from "../components/Seo.jsx";

export default function EcommerceSeoAuditPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  return (
    <>
      <Seo
        title="Ecommerce SEO Audit | RankyPulse"
        description="Audit category and product pages for crawlability, indexation, and conversion-focused SEO fixes."
        canonical={`${base}/use-cases/ecommerce-seo-audit`}
      />
      <MarketingShell
        title="Ecommerce SEO Audit"
        subtitle="Find technical and on-page blockers that prevent product and category pages from ranking."
      >
        <div className="space-y-8 text-[var(--rp-text-600)]">
          <section>
            <h2 className="rp-section-title">What to prioritize first</h2>
            <p className="mt-3 rp-body-small">
              Ecommerce SEO issues often hide in templates and faceted navigation. Start with money pages:
              top categories, top products, and high-intent collection pages.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rp-card p-5">
              <h3 className="text-base font-semibold text-[var(--rp-text-900)] flex items-center gap-2">
                <IconShield size={14} />
                Technical checks
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                <li>Canonical consistency on product variants</li>
                <li>No blocked category paths in robots.txt</li>
                <li>Pagination and faceted URLs are controlled</li>
                <li>Critical category/product pages return 200</li>
              </ul>
            </div>
            <div className="rp-card p-5">
              <h3 className="text-base font-semibold text-[var(--rp-text-900)] flex items-center gap-2">
                <IconBolt size={14} />
                Revenue-impact checks
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                <li>Title/meta copy matches buyer intent</li>
                <li>Internal links point to best-selling collections</li>
                <li>Thin product descriptions are improved</li>
                <li>Schema and rich snippet signals are validated</li>
              </ul>
            </div>
          </section>

          <section className="rp-card p-5 border-2 border-[var(--rp-indigo-200)]">
            <h2 className="rp-section-title flex items-center gap-2">
              <IconReport size={16} />
              Run ecommerce audit now
            </h2>
            <p className="mt-3 rp-body-small">
              Run your store URL and get a prioritized fix list you can hand to content and dev teams.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/start" className="rp-btn-primary text-sm">
                <IconArrowRight size={14} />
                Run Free Audit
              </Link>
              <Link to="/sample-report" className="rp-btn-secondary text-sm">
                <IconArrowRight size={14} />
                View sample report
              </Link>
            </div>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
