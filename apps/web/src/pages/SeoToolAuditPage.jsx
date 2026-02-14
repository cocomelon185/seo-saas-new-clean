import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { IconPlay, IconDoc, IconBolt, IconSearch, IconReport, IconArrowRight, IconCheck } from "../components/Icons.jsx";
import Seo from "../components/Seo.jsx";
import { getSignupAuditHref } from "../lib/auditGate.js";

const FAQ_ITEMS = [
  {
    question: "How accurate are SEO audit tools?",
    answer: "Quality SEO audit tools use industry-standard heuristics and best practices to evaluate crawlability, on-page signals, performance, and content. Accuracy depends on tool depth and update frequency. RankyPulse prioritizes high-impact issues with clear, actionable guidance."
  },
  {
    question: "What is the best free SEO checker?",
    answer: "The best free SEO checker provides a score, prioritized issues, and fix steps in one place. RankyPulse offers a free audit that surfaces technical and on-page problems with plain-English recommendations, shareable reports, and no hidden limits on URL length."
  },
  {
    question: "How often should I run SEO audits?",
    answer: "Run SEO audits quarterly for most sites. High-traffic or frequently updated sites benefit from monthly checks. After major launches, migrations, or content overhauls, run an audit immediately to catch new issues early."
  }
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer
    }
  }))
};

export default function SeoToolAuditPage() {
  const navigate = useNavigate();
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const url = String(fd.get("url") || "").trim();
    if (!url) return;
    navigate(getSignupAuditHref(url));
  };

  return (
    <>
      <Seo
        title="Free SEO Audit Tool | RankyPulse"
        description="Run a free SEO audit in 30 seconds. Get your score, prioritized fixes, and a clear action plan."
        canonical={`${base}/seo-tool-audit`}
        jsonLd={faqSchema}
      />
      <MarketingShell
        title="Free SEO Audit Tool"
        subtitle="Run a full SEO audit in under a minute. Get your score, top fixes, and actionable recommendations."
      >
        <div className="space-y-10 text-[var(--rp-text-600)]">
          {/* Benefits strip above fold */}
          <section className="flex flex-wrap gap-4 sm:gap-8 justify-center">
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--rp-text-700)]">
              <IconCheck size={16} className="text-emerald-600 shrink-0" />
              Detect technical SEO issues instantly
            </span>
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--rp-text-700)]">
              <IconCheck size={16} className="text-emerald-600 shrink-0" />
              Identify content gaps quickly
            </span>
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--rp-text-700)]">
              <IconCheck size={16} className="text-emerald-600 shrink-0" />
              Get prioritized optimization steps
            </span>
          </section>

          {/* Trust strip */}
          <section className="rp-card p-4">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-[var(--rp-text-600)]">
              <span className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-xs">142k+</span>
                Audits run
              </span>
              <span className="text-[var(--rp-text-700)] font-medium">Used by marketers and agencies</span>
              <span className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--rp-indigo-100)] text-[var(--rp-indigo-700)]">✓</span>
                Free tier available
              </span>
            </div>
          </section>

          <section className="rp-card p-6 md:p-8 max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="sr-only" htmlFor="seo-tool-audit-url">Website URL</label>
                <input
                  id="seo-tool-audit-url"
                  type="text"
                  name="url"
                  placeholder="https://example.com"
                  required
                  className="rp-input"
                />
              </div>
              <button type="submit" title="Run a free audit" className="rp-btn-primary w-full">
                <IconPlay size={16} />
                Run Free Audit
              </button>
              <p className="text-xs text-[var(--rp-text-500)] text-center">
                Create a free account to run your audit
              </p>
            </form>
          </section>

          {/* Comparison table */}
          <section>
            <h2 className="rp-section-title">Compare SEO Audit Tools</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] rp-card text-sm">
                <thead>
                  <tr className="border-b border-[var(--rp-border)]">
                    <th className="text-left p-4 font-semibold text-[var(--rp-text-900)]">Tool</th>
                    <th className="text-left p-4 font-semibold text-[var(--rp-text-900)]">Free audit</th>
                    <th className="text-left p-4 font-semibold text-[var(--rp-text-900)]">AI suggestions</th>
                    <th className="text-left p-4 font-semibold text-[var(--rp-text-900)]">Backlink analysis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rp-border)]">
                  <tr>
                    <td className="p-4 font-medium text-[var(--rp-text-900)]">RankyPulse</td>
                    <td className="p-4">✓</td>
                    <td className="p-4">✓</td>
                    <td className="p-4">—</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-[var(--rp-text-700)]">Screaming Frog</td>
                    <td className="p-4">Limited (500 URLs)</td>
                    <td className="p-4">—</td>
                    <td className="p-4">—</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-[var(--rp-text-700)]">Ahrefs</td>
                    <td className="p-4">—</td>
                    <td className="p-4">Limited</td>
                    <td className="p-4">✓</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-[var(--rp-text-700)]">Semrush</td>
                    <td className="p-4">Limited</td>
                    <td className="p-4">✓</td>
                    <td className="p-4">✓</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-[var(--rp-text-700)]">Lighthouse</td>
                    <td className="p-4">✓</td>
                    <td className="p-4">—</td>
                    <td className="p-4">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ section */}
          <section>
            <h2 className="rp-section-title">FAQ</h2>
            <dl className="mt-4 space-y-4">
              {FAQ_ITEMS.map(({ question, answer }) => (
                <div key={question} className="rp-card p-5">
                  <dt className="font-semibold text-[var(--rp-text-900)]">{question}</dt>
                  <dd className="mt-2 rp-body-small">{answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="rp-section-title">Learn More</h2>
            <p className="mt-2 rp-body-small">
              Deepen your SEO knowledge with our guides and use this tool to put recommendations into action.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/seo-audit-checklist"
                className="rp-card p-5 rp-card-hover group flex flex-col"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-3">
                  <IconDoc size={18} />
                </span>
                <span className="font-semibold text-[var(--rp-text-900)] group-hover:text-[var(--rp-indigo-700)]">
                  SEO audit checklist
                </span>
                <span className="mt-2 text-sm rp-body-small">
                  Step-by-step guide covering technical, on-page, content, backlinks, and UX.
                </span>
                <span className="mt-auto pt-3 text-sm font-medium text-[var(--rp-indigo-700)] flex items-center gap-1">
                  Read guide <IconArrowRight size={14} />
                </span>
              </Link>
              <Link
                to="/technical-seo-audit"
                className="rp-card p-5 rp-card-hover group flex flex-col"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mb-3">
                  <IconBolt size={18} />
                </span>
                <span className="font-semibold text-[var(--rp-text-900)] group-hover:text-[var(--rp-indigo-700)]">
                  Technical SEO audit
                </span>
                <span className="mt-2 text-sm rp-body-small">
                  Crawlability, indexing, Core Web Vitals, structured data, and troubleshooting.
                </span>
                <span className="mt-auto pt-3 text-sm font-medium text-[var(--rp-indigo-700)] flex items-center gap-1">
                  Read guide <IconArrowRight size={14} />
                </span>
              </Link>
              <Link
                to="/website-seo-checker"
                className="rp-card p-5 rp-card-hover group flex flex-col"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 mb-3">
                  <IconSearch size={18} />
                </span>
                <span className="font-semibold text-[var(--rp-text-900)] group-hover:text-[var(--rp-indigo-700)]">
                  Website SEO checker
                </span>
                <span className="mt-2 text-sm rp-body-small">
                  How automated audits work and what to expect from the tool.
                </span>
                <span className="mt-auto pt-3 text-sm font-medium text-[var(--rp-indigo-700)] flex items-center gap-1">
                  Read guide <IconArrowRight size={14} />
                </span>
              </Link>
              <Link
                to="/seo-report-template"
                className="rp-card p-5 rp-card-hover group flex flex-col"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 mb-3">
                  <IconReport size={18} />
                </span>
                <span className="font-semibold text-[var(--rp-text-900)] group-hover:text-[var(--rp-indigo-700)]">
                  SEO reporting template
                </span>
                <span className="mt-2 text-sm rp-body-small">
                  What sections every report needs and how tools automate them.
                </span>
                <span className="mt-auto pt-3 text-sm font-medium text-[var(--rp-indigo-700)] flex items-center gap-1">
                  Read guide <IconArrowRight size={14} />
                </span>
              </Link>
            </div>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
