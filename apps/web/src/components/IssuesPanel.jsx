import React from "react";
import { enrichIssues } from "../lib/issueCatalog.js";

function bucketClass(priority) {
  if (priority === "fix_now") return "border-red-200 bg-red-50 text-red-700";
  if (priority === "fix_next") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function label(priority) {
  if (priority === "fix_now") return "Fix now";
  if (priority === "fix_next") return "Fix next";
  return "Fix later";
}

export default function IssuesPanel({ issues }) {
  const enriched = enrichIssues(Array.isArray(issues) ? issues : []);
  if (!enriched.length) return null;

  const groups = {
    fix_now: enriched.filter((x) => (x.priority || "fix_later") === "fix_now"),
    fix_next: enriched.filter((x) => (x.priority || "fix_later") === "fix_next"),
    fix_later: enriched.filter((x) => (x.priority || "fix_later") === "fix_later")
  };

  const order = ["fix_now", "fix_next", "fix_later"];

  return (
    <div className="mt-6">
      <div className="text-lg font-semibold text-slate-900">Issues</div>

      <div className="mt-3 space-y-6">
        {order.map((k) => (
          <div key={k}>
            <div className="text-sm font-semibold text-slate-700">
              {label(k)} ({groups[k].length})
            </div>

            <div className="mt-2 space-y-3">
              {groups[k].map((issue, idx) => {
                const evidence = issue.evidence || {};
                return (
                  <div
                    key={(issue.issue_id || "issue") + "-" + idx}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold " +
                          bucketClass(issue.priority || k)
                        }
                      >
                        {label(issue.priority || k)}
                      </span>

                      <div className="text-sm font-semibold text-slate-900">
                        {issue.title || issue.issue_id || "Issue"}
                      </div>

                      {issue.issue_id && (
                        <span className="ml-auto text-xs text-slate-500">{issue.issue_id}</span>
                      )}
                    </div>

                    {issue.why && <p className="mt-2 text-sm leading-6 text-slate-700">{issue.why}</p>}

                    {issue.what && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-slate-700">What to change</div>
                        <p className="mt-1 text-sm leading-6 text-slate-700">{issue.what}</p>
                      </div>
                    )}

                    {issue.example_fix && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-slate-700">Example fix</div>
                        <pre className="mt-1 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                          {issue.example_fix}
                        </pre>
                      </div>
                    )}

                    {Object.keys(evidence).length > 0 && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-700">Evidence</div>
                        <pre className="mt-2 overflow-auto text-xs text-slate-700">
                          {JSON.stringify(evidence, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
