import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
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

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/rank"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Run an Audit
            </Link>

            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              View Pricing
            </Link>

            <span className="text-xs text-slate-500 sm:ml-2">
              Paid, professional SEO tooling.
            </span>
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

        <footer className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-7">
          <h2 className="text-lg font-semibold">Start with a real page</h2>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            Run an audit and see what’s holding your page back — clearly.
          </p>
          <div className="mt-5">
            <Link
              to="/rank"
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
