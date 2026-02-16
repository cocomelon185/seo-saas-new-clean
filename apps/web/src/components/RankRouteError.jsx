import { Link, useRouteError } from "react-router-dom";

export default function RankRouteError() {
  const error = useRouteError();
  const message = String(error?.message || "We could not load Rank Checker right now.");

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border border-[var(--rp-border)] bg-white p-5 shadow-sm">
        <div className="text-lg font-semibold text-[var(--rp-text-900)]">Rank Checker temporarily unavailable</div>
        <p className="mt-2 text-sm text-[var(--rp-text-600)]">
          Action queue failed safely. Your current results are preserved. Please retry, or go back to Audit.
        </p>
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {message}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const search = typeof window !== "undefined" ? window.location.search : "";
              window.location.assign(`/rank${search}`);
            }}
            className="rp-btn-primary rp-btn-sm h-9 px-3 text-xs"
          >
            Retry Rank Checker
          </button>
          <Link to="/audit" className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs inline-flex items-center">
            Go back to Audit
          </Link>
        </div>
      </div>
    </div>
  );
}
