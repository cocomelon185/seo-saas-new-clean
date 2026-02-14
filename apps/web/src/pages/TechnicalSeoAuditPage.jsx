import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { Link } from "react-router-dom";
import { IconRefresh, IconArrowRight } from "../components/Icons.jsx";
import Seo from "../components/Seo.jsx";

export default function TechnicalSeoAuditPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  return (
    <>
      <Seo
        title="Technical SEO Audit Guide | RankyPulse"
        description="Learn how to audit crawlability, indexing, Core Web Vitals, structured data, and internal linking. Troubleshoot technical SEO issues systematically."
        canonical={`${base}/technical-seo-audit`}
      />
      <MarketingShell
        title="Technical SEO Audit Guide"
        subtitle="A technical deep-dive into crawlability, indexing, performance, structured data, and internal architecture."
      >
        <div className="space-y-8 text-[var(--rp-text-600)]">
          <section>
            <h2 className="rp-section-title">Crawlability</h2>
            <p className="mt-3 rp-body-small">
              Search engines must reach your pages before they can rank. Crawlability audits verify that nothing blocks
              or delays discovery. Check robots.txt directives, meta robots, X-Robots-Tag headers, and sitemap coverage.
            </p>
            <h3 className="mt-4 text-base font-semibold text-[var(--rp-text-900)]">Key Checks</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>robots.txt allows crawling of important sections</li>
              <li>No accidental noindex on key pages</li>
              <li>Sitemap URLs return 200 and are indexable</li>
              <li>Orphaned or poorly linked pages are identified</li>
            </ul>
          </section>

          <section>
            <h2 className="rp-section-title">Indexing Issues</h2>
            <p className="mt-3 rp-body-small">
              Many pages are crawlable but not indexed. Causes include thin content, duplicate or near-duplicate content,
              canonical confusion, and coverage exclusions. Compare URLs in sitemaps vs. indexed URLs in Search Console.
            </p>
            <h3 className="mt-4 text-base font-semibold text-[var(--rp-text-900)]">Common Causes</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>Multiple canonicals pointing to different URLs</li>
              <li>Soft 404s (pages returning 200 but with empty or error content)</li>
              <li>Parameter-heavy or session-heavy URLs not consolidated</li>
            </ul>
          </section>

          <section>
            <h2 className="rp-section-title">Site Speed & Core Web Vitals</h2>
            <p className="mt-3 rp-body-small">
              LCP (Largest Contentful Paint), FID (First Input Delay), INP (Interaction to Next Paint), and CLS
              (Cumulative Layout Shift) directly affect rankings and user experience. Measure with PageSpeed Insights,
              CrUX, and real-user monitoring.
            </p>
            <h3 className="mt-4 text-base font-semibold text-[var(--rp-text-900)]">Optimization Targets</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>LCP under 2.5s (preferably under 1.5s)</li>
              <li>FID/INP under 100ms</li>
              <li>CLS under 0.1</li>
              <li>Reduce render-blocking resources and critical path</li>
            </ul>
          </section>

          <section>
            <h2 className="rp-section-title">Structured Data</h2>
            <p className="mt-3 rp-body-small">
              Valid JSON-LD (or microdata) helps search engines understand entities, products, articles, and FAQs.
              Invalid or conflicting schemas can trigger manual actions or lost rich result eligibility. See our{" "}
              <Link to="/seo-report-template" className="text-[var(--rp-indigo-700)] hover:underline">SEO reporting template</Link> for how to present audit findings in reports.
            </p>
            <h3 className="mt-4 text-base font-semibold text-[var(--rp-text-900)]">Schema Audit Points</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>No syntax errors in Google’s Rich Results Test</li>
              <li>Required properties present for each type</li>
              <li>No duplicate or conflicting types on the same page</li>
            </ul>
          </section>

          <section>
            <h2 className="rp-section-title">Internal Linking</h2>
            <p className="mt-3 rp-body-small">
              Internal links pass authority and help crawlers discover content. Audit link depth from the homepage,
              identify orphan pages, and ensure high-value pages receive sufficient internal link equity. Our{" "}
              <Link to="/seo-audit-checklist" className="text-[var(--rp-indigo-700)] hover:underline">SEO audit checklist</Link>{" "}
              covers this in the broader context; a <Link to="/website-seo-checker" className="text-[var(--rp-indigo-700)] hover:underline">website SEO checker</Link> can automate link discovery.
            </p>
          </section>

          <section>
            <h2 className="rp-section-title flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <IconRefresh size={16} />
              </span>
              Technical Troubleshooting Checklist
            </h2>
            <div className="mt-4 rp-card p-5">
              <ul className="space-y-2 text-sm">
                <li>□ Crawl errors in Search Console resolved or explained</li>
                <li>□ Sitemap lastmod and priority reflect reality</li>
                <li>□ Redirect chains shortened (ideally 1 hop)</li>
                <li>□ Hreflang implemented correctly for multilingual sites</li>
                <li>□ Server response times acceptable (&lt;200ms)</li>
                <li>□ No mixed content (HTTP resources on HTTPS pages)</li>
                <li>□ Mobile usability issues fixed</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="rp-section-title">Run a Technical SEO Audit</h2>
            <p className="mt-3 rp-body-small">
              RankyPulse runs technical checks as part of every audit, including crawlability signals, performance, and
              structural issues. For a full checklist that includes technical SEO alongside on-page and content, see our{" "}
              <Link to="/seo-audit-checklist" className="text-[var(--rp-indigo-700)] hover:underline">SEO audit checklist guide</Link>.
            </p>
            <div className="mt-4">
              <Link to="/seo-tool-audit" className="rp-btn-primary text-sm inline-flex items-center gap-2">
                <IconArrowRight size={14} />
                Run Technical SEO Audit
              </Link>
            </div>
          </section>

          <section className="rp-card p-5 border-2 border-[var(--rp-indigo-200)]">
            <h3 className="rp-section-title">Automate Your Technical Audit</h3>
            <p className="mt-2 rp-body-small">
              Get crawlability, indexing, and performance issues surfaced automatically with clear fix steps.
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
