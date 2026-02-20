import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { Link } from "react-router-dom";
import { IconArrowRight, IconBolt, IconCheck, IconCompass } from "../components/Icons.jsx";
import Seo from "../components/Seo.jsx";

export default function SeoAuditForSaasPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  return (
    <>
      <Seo
        title="SEO Audit for SaaS | RankyPulse"
        description="Run an SEO audit for SaaS pages and prioritize fixes that improve signups, demos, and organic pipeline."
        canonical={`${base}/seo-audit-for-saas`}
      />
      <MarketingShell
        title="SEO Audit for SaaS"
        subtitle="Find and fix the SEO bottlenecks that block qualified demo and trial signups."
      >
        <div className="space-y-8 text-[var(--rp-text-600)]">
          <section className="rp-card p-5">
            <h2 className="rp-section-title flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                <IconCompass size={16} />
              </span>
              What makes a SaaS SEO audit different
            </h2>
            <p className="mt-3 rp-body-small">
              SaaS sites depend on high-intent pages like product, pricing, integrations, and solution pages.
              A generic audit often misses revenue impact. A SaaS audit should prioritize fixes that increase
              qualified organic traffic and conversion rate, not just traffic volume.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rp-card p-5">
              <h3 className="text-base font-semibold text-[var(--rp-text-900)]">Priority pages to audit first</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                <li>Homepage and core product overview pages</li>
                <li>Pricing and plan comparison pages</li>
                <li>Use-case and solution pages for ICP segments</li>
                <li>Feature pages targeting bottom-funnel terms</li>
              </ul>
            </div>
            <div className="rp-card p-5">
              <h3 className="text-base font-semibold text-[var(--rp-text-900)]">Signals with highest business impact</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                <li>Title and meta clarity for demo/trial intent</li>
                <li>Internal links into pricing and key conversion pages</li>
                <li>Page speed on signup-critical routes</li>
                <li>Content depth against direct SaaS competitors</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="rp-section-title flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <IconCheck size={16} />
              </span>
              SaaS audit checklist
            </h2>
            <div className="mt-4 rp-card p-5">
              <ul className="space-y-2 text-sm">
                <li>1. Verify indexability and canonicals across product/pricing pages</li>
                <li>2. Improve title/meta copy around value + ICP language</li>
                <li>3. Fix weak internal linking to conversion pages</li>
                <li>4. Improve Core Web Vitals on high-traffic landing pages</li>
                <li>5. Close content gaps for competitor and alternative keywords</li>
              </ul>
            </div>
          </section>

          <section className="rp-card p-5 border-2 border-[var(--rp-indigo-200)]">
            <h2 className="rp-section-title flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <IconBolt size={16} />
              </span>
              Run your SaaS SEO audit
            </h2>
            <p className="mt-3 rp-body-small">
              Use RankyPulse to audit your key SaaS pages, get prioritized fixes, and turn findings into shipped changes.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/seo-tool-audit" className="rp-btn-primary text-sm">
                <IconArrowRight size={14} />
                Run Free SEO Audit
              </Link>
              <Link to="/use-cases/saas-landing-audit" className="rp-btn-secondary text-sm">
                <IconArrowRight size={14} />
                See SaaS landing page use case
              </Link>
            </div>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
