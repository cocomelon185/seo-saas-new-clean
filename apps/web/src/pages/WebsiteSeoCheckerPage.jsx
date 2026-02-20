import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { IconSearch, IconArrowRight, IconPlay } from "../components/Icons.jsx";
import Seo from "../components/Seo.jsx";
import { getSignupAuditHref } from "../lib/auditGate.js";
import { track } from "../lib/eventsClient.js";

export default function WebsiteSeoCheckerPage() {
  const navigate = useNavigate();
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const url = String(fd.get("url") || "").trim();
    if (!url) return;
    track("run_audit_click", { source: "website_seo_checker_page", has_url: true });
    navigate(getSignupAuditHref(url));
  };

  return (
    <>
      <Seo
        title="Website SEO Checker | Check Your Site Instantly | RankyPulse"
        description="Check your website SEO in 30 seconds. Get your score, prioritized fixes, and actionable recommendations. Used by marketers and agencies."
        canonical={`${base}/website-seo-checker`}
      />
      <MarketingShell
        title="Website SEO Checker — Free Tool"
        subtitle="Paste your URL below and get your SEO score, issues, and recommendations in under a minute."
      >
        <div className="space-y-10 text-[var(--rp-text-600)]">
          {/* Above-the-fold: tool-focused headline, form, trust strip */}
          <section className="rp-card p-6 md:p-8 max-w-2xl border-2 border-[var(--rp-indigo-200)] bg-gradient-to-br from-white to-[rgba(124,58,237,0.04)]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="sr-only" htmlFor="website-seo-checker-url">Website URL</label>
                <input
                  id="website-seo-checker-url"
                  type="text"
                  name="url"
                  placeholder="https://example.com"
                  required
                  className="rp-input"
                />
              </div>
              <button type="submit" title="Check website SEO" className="rp-btn-primary w-full">
                <IconPlay size={16} />
                Check My Website SEO
              </button>
              <p className="text-xs text-[var(--rp-text-500)] text-center">
                Create a free account to run your check
              </p>
            </form>
            {/* Trust strip */}
            <div className="mt-5 pt-5 border-t border-[var(--rp-border)] flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--rp-text-500)]">
              <span className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-semibold">142k+</span>
                Issues prioritized
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 font-semibold">~30s</span>
                Per audit
              </span>
              <span className="text-[var(--rp-text-600)] font-medium">Used by marketers and agencies</span>
            </div>
          </section>

          {/* Directly below: See what your SEO report looks like */}
          <section>
            <h2 className="rp-section-title">See what your SEO report looks like</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rp-card p-5 border border-[var(--rp-border)]">
                <div className="h-20 rounded-xl bg-gradient-to-br from-[var(--rp-indigo-100)] to-[var(--rp-gray-100)] flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[var(--rp-indigo-700)]">84</span>
                  <span className="text-xs text-[var(--rp-text-500)] mt-1">SEO score</span>
                </div>
                <p className="mt-3 text-sm font-medium text-[var(--rp-text-800)]">SEO Score</p>
                <p className="mt-1 text-xs text-[var(--rp-text-500)]">Overall health at a glance</p>
              </div>
              <div className="rp-card p-5 border border-[var(--rp-border)]">
                <div className="h-20 rounded-xl bg-gradient-to-br from-amber-50 to-[var(--rp-gray-100)] flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-amber-700">12</span>
                  <span className="text-xs text-[var(--rp-text-500)] mt-1">Issues found</span>
                </div>
                <p className="mt-3 text-sm font-medium text-[var(--rp-text-800)]">Issues Found</p>
                <p className="mt-1 text-xs text-[var(--rp-text-500)]">Ranked by impact</p>
              </div>
              <div className="rp-card p-5 border border-[var(--rp-border)]">
                <div className="h-20 rounded-xl bg-gradient-to-br from-emerald-50 to-[var(--rp-gray-100)] flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-700">5</span>
                  <span className="text-xs text-[var(--rp-text-500)] mt-1">Recommendations</span>
                </div>
                <p className="mt-3 text-sm font-medium text-[var(--rp-text-800)]">Recommendations</p>
                <p className="mt-1 text-xs text-[var(--rp-text-500)]">Prioritized fix steps</p>
              </div>
            </div>
          </section>

          {/* Benefits strip */}
          <section className="rp-card p-5">
            <div className="flex flex-wrap gap-6 sm:gap-10 justify-center">
              <span className="flex items-center gap-2 text-sm font-medium text-[var(--rp-text-700)]">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 text-xs">✓</span>
                Detect technical SEO issues instantly
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-[var(--rp-text-700)]">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs">✓</span>
                Identify content gaps quickly
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-[var(--rp-text-700)]">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs">✓</span>
                Get prioritized optimization steps
              </span>
            </div>
          </section>

          {/* How our website SEO checker works — explanatory guide below tool */}
          <section className="pt-4 border-t border-[var(--rp-border)]">
            <h2 className="rp-section-title flex items-center gap-2 text-xl">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--rp-gray-200)] text-[var(--rp-text-600)]">
                <IconSearch size={14} />
              </span>
              How our website SEO checker works
            </h2>
            <p className="mt-3 rp-body-small">
              A website SEO checker analyzes a URL (or entire site) for issues that hurt search visibility. It crawls or
              fetches the page, evaluates on-page signals, technical setup, content quality, and often performance.
              Results are typically scored and prioritized so you know what to fix first.
            </p>
            <p className="mt-3 rp-body-small">
              Automated checkers use crawlers and parsers to extract HTML, meta tags, headings, links, and scripts.
              They run heuristics against SEO best practices and sometimes compare against competitors. RankyPulse
              combines automated analysis with clear, fix-first output: you get a score, a ranked issue list, and
              copy-paste instructions instead of raw data dumps.
            </p>
            <p className="mt-3 rp-body-small">
              RankyPulse surfaces the highest-impact issues first, with plain-English explanations and optional code snippets.
              Many checkers overwhelm you with hundreds of items; we focus on prioritization by impact, clear guidance, and
              shareable reports. For deeper technical coverage, pair results with our{" "}
              <Link to="/technical-seo-audit" className="text-[var(--rp-indigo-700)] hover:underline">technical SEO audit guide</Link>.
              For a structured workflow, use our <Link to="/seo-audit-checklist" className="text-[var(--rp-indigo-700)] hover:underline">audit checklist</Link>.
            </p>
            <div className="mt-4 rp-card p-5">
              <ul className="space-y-2 text-sm">
                <li><strong>Prioritized fixes</strong> — Issues ranked by impact, not alphabetically</li>
                <li><strong>Plain-English guidance</strong> — For marketers and developers alike</li>
                <li><strong>Shareable reports</strong> — Client-ready output in one click</li>
                <li><strong>Ongoing tracking</strong> — Re-run audits to measure improvement</li>
              </ul>
            </div>
            <p className="mt-4 rp-body-small">
              Use our <Link to="/seo-report-template" className="text-[var(--rp-indigo-700)] hover:underline">SEO reporting template</Link> guide
              to understand what a good report looks like, or run an audit with our{" "}
              <Link to="/seo-tool-audit" className="text-[var(--rp-indigo-700)] hover:underline">free SEO audit tool</Link> to
              generate one automatically.
            </p>
            <div className="mt-4">
              <Link to="/seo-tool-audit" className="rp-btn-primary text-sm inline-flex items-center gap-2">
                <IconArrowRight size={14} />
                Run Free Website SEO Check
              </Link>
            </div>
          </section>

          <section className="rp-card p-5 border-2 border-[var(--rp-indigo-200)]">
            <h3 className="rp-section-title">Ready to check your site?</h3>
            <p className="mt-2 rp-body-small">
              Get your score, top fixes, and a clear action plan in under a minute.
            </p>
            <Link to="/seo-tool-audit" className="rp-btn-primary text-sm mt-4 inline-flex items-center gap-2">
              <IconArrowRight size={14} />
              Start Free SEO Check
            </Link>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
