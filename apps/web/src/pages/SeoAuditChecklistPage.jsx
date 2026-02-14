import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { Link } from "react-router-dom";
import { IconDoc, IconBolt, IconArrowRight } from "../components/Icons.jsx";
import Seo from "../components/Seo.jsx";

export default function SeoAuditChecklistPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  return (
    <>
      <Seo
        title="SEO Audit Checklist (Step-by-Step Guide) | RankyPulse"
        description="A complete SEO audit checklist covering technical SEO, on-page optimization, content quality, backlinks, and UX. Use this guide to systematically improve search visibility."
        canonical={`${base}/seo-audit-checklist`}
      />
      <MarketingShell
        title="SEO Audit Checklist (Step-by-Step Guide)"
        subtitle="A systematic guide to auditing your site for search visibility, from technical foundations to content and performance."
      >
        <div className="space-y-8 text-[var(--rp-text-600)]">
          <section>
            <h2 className="rp-section-title">Why SEO Audits Matter</h2>
            <p className="mt-3 rp-body-small">
              Regular SEO audits surface hidden issues that drain rankings and traffic. Without a structured approach,
              teams chase symptoms instead of root causes. A proper <Link to="/seo-tool-audit" className="text-[var(--rp-indigo-700)] hover:underline">free audit tool</Link> combined with this
              checklist lets you prioritize fixes by impact and ship improvements in the right order. RankyPulse automates
              the heavy lifting so you focus on implementation, not diagnosis.
            </p>
          </section>

          <section>
            <h2 className="rp-section-title flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <IconDoc size={16} />
              </span>
              The SEO Audit Checklist
            </h2>
            <ol className="mt-4 space-y-6">
              <li className="rp-card p-5">
                <h3 className="text-base font-semibold text-[var(--rp-text-900)]">1. Technical SEO</h3>
                <p className="mt-2 rp-body-small">
                  Verify robots.txt, sitemaps, crawl budget, canonical tags, and redirect chains. For deeper technical coverage, see our{" "}
                  <Link to="/technical-seo-audit" className="text-[var(--rp-indigo-700)] hover:underline">technical SEO audit guide</Link>.
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  <li>Sitemap submitted and error-free</li>
                  <li>No critical crawl blocks</li>
                  <li>HTTPS and valid SSL</li>
                </ul>
              </li>
              <li className="rp-card p-5">
                <h3 className="text-base font-semibold text-[var(--rp-text-900)]">2. On-Page SEO</h3>
                <p className="mt-2 rp-body-small">
                  Title tags, meta descriptions, headings, and keyword placement. Use a{" "}
                  <Link to="/website-seo-checker" className="text-[var(--rp-indigo-700)] hover:underline">website SEO checker</Link> to automate on-page validation. For a full audit, try our{" "}
                  <Link to="/seo-tool-audit" className="text-[var(--rp-indigo-700)] hover:underline">SEO tool audit</Link>.
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  <li>Unique titles per page</li>
                  <li>H1–H6 hierarchy respected</li>
                  <li>Internal links to key pages</li>
                </ul>
              </li>
              <li className="rp-card p-5">
                <h3 className="text-base font-semibold text-[var(--rp-text-900)]">3. Content Quality</h3>
                <p className="mt-2 rp-body-small">
                  Depth, readability, and intent coverage. Match SERP expectations for length and structure.
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  <li>Content satisfies search intent</li>
                  <li>Credible sources and citations</li>
                  <li>Clear CTAs and next steps</li>
                </ul>
              </li>
              <li className="rp-card p-5">
                <h3 className="text-base font-semibold text-[var(--rp-text-900)]">4. Backlinks</h3>
                <p className="mt-2 rp-body-small">
                  Profile health, toxic links, and anchor text distribution.
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  <li>No major toxic or spam links</li>
                  <li>Anchor text looks natural</li>
                  <li>Key pages earn links</li>
                </ul>
              </li>
              <li className="rp-card p-5">
                <h3 className="text-base font-semibold text-[var(--rp-text-900)]">5. UX and Performance</h3>
                <p className="mt-2 rp-body-small">
                  Core Web Vitals, mobile usability, and navigation clarity.
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  <li>LCP, FID, CLS within targets</li>
                  <li>Mobile-friendly layout</li>
                  <li>Clear site structure</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="rp-section-title flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                <IconBolt size={16} />
              </span>
              Run Your Audit
            </h2>
            <p className="mt-3 rp-body-small">
              Use RankyPulse to run a full audit in under a minute. You get prioritized fixes, plain-English guidance, and an{" "}
              <Link to="/seo-report-template" className="text-[var(--rp-indigo-700)] hover:underline">SEO report template</Link>–ready output.
            </p>
            <div className="mt-4">
              <Link to="/seo-tool-audit" className="rp-btn-primary text-sm inline-flex items-center gap-2">
                <IconArrowRight size={14} />
                Run Free SEO Audit
              </Link>
            </div>
          </section>

          <section>
            <h2 className="rp-section-title">FAQ</h2>
            <dl className="mt-4 space-y-5">
              <div className="rp-card p-5">
                <dt className="font-semibold text-[var(--rp-text-900)]">How often should I run an SEO audit?</dt>
                <dd className="mt-2 rp-body-small">
                  Quarterly for most sites. High-traffic or frequently updated sites benefit from monthly checks. After major launches or migrations, run an audit immediately.
                </dd>
              </div>
              <div className="rp-card p-5">
                <dt className="font-semibold text-[var(--rp-text-900)]">What’s the difference between a technical and on-page audit?</dt>
                <dd className="mt-2 rp-body-small">
                  A technical audit focuses on crawlability, indexing, speed, and structured data. An on-page audit evaluates titles, content, and internal structure. Both matter; start with technical foundations.
                </dd>
              </div>
              <div className="rp-card p-5">
                <dt className="font-semibold text-[var(--rp-text-900)]">Can I automate SEO audits?</dt>
                <dd className="mt-2 rp-body-small">
                  Yes. Tools like RankyPulse run automated audits that score issues by impact, provide fix steps, and generate shareable reports. Manual audits still help for strategy and content quality.
                </dd>
              </div>
            </dl>
          </section>

          <section className="rp-card p-5 border-2 border-[var(--rp-indigo-200)]">
            <h3 className="rp-section-title">Ready to fix your site?</h3>
            <p className="mt-2 rp-body-small">
              Run a free SEO audit now and get a prioritized list of fixes tailored to your site.
            </p>
            <Link to="/seo-tool-audit" className="rp-btn-primary text-sm mt-4 inline-flex items-center gap-2">
              <IconArrowRight size={14} />
              Start Free Audit
            </Link>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
