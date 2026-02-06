import React from "react";

function badgeClass(kind) {
  if (kind === "high") return "bg-rose-100 text-rose-700 border-rose-200";
  if (kind === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-[var(--rp-gray-50)] text-[var(--rp-text-600)] border-[var(--rp-border)]";
}

function bucketClass(bucket) {
  if (bucket === "fix_now") return "bg-rose-100 text-rose-700 border-rose-200";
  if (bucket === "fix_next") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-[var(--rp-gray-50)] text-[var(--rp-text-600)] border-[var(--rp-border)]";
}

export default function IssueCard({ issue }) {
  const status = issue?.status || "warn";
  const title = issue?.title || issue?.issue_id || "Issue";
  const why = issue?.why_it_matters;
  const evidence = issue?.evidence || {};
  const fix = issue?.recommended_fix;

  const statusLabel =
    status === "ok" ? "OK" : status === "fail" ? "Fix needed" : "Check";

  return (
    <div className="rp-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-base font-semibold text-[var(--rp-text-900)]">{title}</div>

        <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold " + (status === "ok" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-[var(--rp-gray-50)] text-[var(--rp-text-600)] border-[var(--rp-border)]")}>
          {statusLabel}
        </span>

        {issue?.severity && (
          <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold " + badgeClass(issue.severity)}>
            Severity: {issue.severity}
          </span>
        )}

        {issue?.priority && (
          <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold " + bucketClass(issue.priority)}>
            {issue.priority === "fix_now" ? "Fix now" : issue.priority === "fix_next" ? "Fix next" : "Fix later"}
          </span>
        )}

        {issue?.issue_id && (
          <span className="ml-auto text-xs text-[var(--rp-text-500)]">{issue.issue_id}</span>
        )}
      </div>

      {why && <p className="mt-2 leading-7 text-[var(--rp-text-600)]">{why}</p>}

      <div className="mt-3 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
        <div className="text-xs font-semibold text-[var(--rp-text-600)]">Evidence</div>
        <pre className="mt-2 overflow-auto text-xs text-[var(--rp-text-600)]">
{JSON.stringify(evidence, null, 2)}
        </pre>
      </div>

      {fix && (fix.steps?.length || fix.examples?.length) ? (
        <div className="mt-4">
          <div className="text-sm font-semibold text-[var(--rp-text-800)]">Recommended fix</div>

          {fix.steps?.length ? (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-7 text-[var(--rp-text-600)]">
              {fix.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          ) : null}

          {fix.examples?.length ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {fix.examples.map((ex, i) => (
                <div key={i} className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs font-semibold text-[var(--rp-text-600)]">Example</div>
                  <div className="mt-2">
                    <div className="text-xs font-semibold text-[var(--rp-text-500)]">Before</div>
                    <pre className="mt-1 overflow-auto text-xs text-[var(--rp-text-600)]">{String(ex.before || "")}</pre>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-semibold text-[var(--rp-text-500)]">After</div>
                    <pre className="mt-1 overflow-auto text-xs text-[var(--rp-text-600)]">{String(ex.after || "")}</pre>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
