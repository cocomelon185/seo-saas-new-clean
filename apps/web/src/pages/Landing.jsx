import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  const isValidUrl = useMemo(() => {
    if (!url.trim()) return false;
    try {
      let urlToCheck = url.trim();
      if (!/^https?:\/\//i.test(urlToCheck)) {
        urlToCheck = `https://${urlToCheck}`;
      }
      const parsed = new URL(urlToCheck);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, [url]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValidUrl) return;

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    navigate(`/audit?url=${encodeURIComponent(normalizedUrl)}`);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-5 py-14">
        <header className="pb-10">
          <p className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
            RankyPulse
          </p>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Clear SEO decisions. <span className="text-slate-500">Without the noise.</span>
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-7 text-slate-600">
            Focused page audits with prioritized fixes, examples, and content guidance you can act on immediately.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
          >
            <input
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
            <button
              type="submit"
              disabled={!isValidUrl}
              className={[
                "w-full rounded-xl px-5 py-3 text-sm font-semibold transition sm:w-auto",
                isValidUrl
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "cursor-not-allowed bg-slate-200 text-slate-500"
              ].join(" ")}
            >
              Run Free Audit
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center">
            <span>Prefer a guided start?</span>
            <Link to="/start" className="font-semibold text-slate-900 hover:text-slate-700">
              Open the instant audit page
            </Link>
            <Link to="/pricing" className="font-semibold text-slate-900 hover:text-slate-700">
              View pricing
            </Link>
          </div>
        </header>

        <section className="grid gap-6 border-t border-slate-100 py-10 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">SEO audits designed for action</h2>
            <p className="mt-2 leading-7 text-slate-600">
              RankyPulse analyzes individual pages and produces a clear fix plan — so you know what to change first and why it matters.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">How it works</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 leading-7 text-slate-600">
              <li>Enter a page URL</li>
              <li>Run a focused audit</li>
              <li>Review prioritized fixes</li>
              <li>Improve with confidence</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">What you get</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 leading-7 text-slate-600">
              <li>One-sentence page diagnosis</li>
              <li>Priority fix plan (Fix now / next / later)</li>
              <li>Clear explanations and examples</li>
              <li>Content briefs on paid plans</li>
              <li>Audit history and re-runs</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Who it’s for</h2>
            <p className="mt-2 leading-7 text-slate-600">
              Built for freelancers, agencies, SaaS teams, and founders who want clarity instead of dashboards.
            </p>
          </div>
        </section>

        <section className="grid gap-6 border-t border-slate-100 py-10 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Audit Use Case</p>
            <h3 className="mt-2 text-lg font-semibold">SaaS landing page audit</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A focused checklist to validate headlines, proof, and conversion signals before you scale traffic.
            </p>
            <Link to="/use-cases/saas-landing-audit" className="mt-4 inline-flex text-sm font-semibold text-slate-900 hover:text-slate-700">
              Read the playbook
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Audit Use Case</p>
            <h3 className="mt-2 text-lg font-semibold">Blog post audit checklist</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Diagnose thin content, missing keywords, and structure gaps so posts earn long-term rankings.
            </p>
            <Link to="/use-cases/blog-audit-checklist" className="mt-4 inline-flex text-sm font-semibold text-slate-900 hover:text-slate-700">
              See the checklist
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Audit Use Case</p>
            <h3 className="mt-2 text-lg font-semibold">Agency client audit workflow</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Share reports, align stakeholders, and turn audit findings into an easy action plan.
            </p>
            <Link to="/use-cases/agency-audit-workflow" className="mt-4 inline-flex text-sm font-semibold text-slate-900 hover:text-slate-700">
              View the workflow
            </Link>
          </div>
        </section>

        <footer className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-7">
          <h2 className="text-lg font-semibold">Start with a real page</h2>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            Run an audit and see what’s holding your page back — clearly.
          </p>
          <div className="mt-5">
            <Link
              to="/start"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Run an Audit
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
