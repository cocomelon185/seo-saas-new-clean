import React from "react";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">RankyPulse</div>
          <div className="flex gap-4 text-sm">
            <Link className="underline" to="/rank">Rank</Link>
            <Link className="underline" to="/audit">Audit</Link>
          </div>
        </div>

        <div className="mt-10">
          <h1 className="text-3xl font-extrabold">SEO tools that work</h1>
          <p className="mt-3 text-slate-700">
            Public MVP (no login required). Start with Rank or Audit.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              to="/audit"
              className="px-4 py-2 rounded bg-slate-900 text-white"
            >
              Run Audit
            </Link>
            <Link
              to="/rank"
              className="px-4 py-2 rounded border border-slate-300"
            >
              Check Rank
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
