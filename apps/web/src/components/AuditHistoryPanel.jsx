import React, { useMemo } from "react";
import { loadAuditHistory } from "../lib/auditHistory.js";

export default function AuditHistoryPanel({ onPickUrl }) {
  const items = useMemo(() => loadAuditHistory(), []);

  if (!items.length) return null;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">Recent audits</div>
      <div className="mt-2 space-y-2">
        {items.map((it, idx) => (
          <button
            key={(it.url || "u") + "-" + idx}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100"
            onClick={() => onPickUrl && it.url && onPickUrl(it.url)}
            type="button"
          >
            <div className="flex items-center gap-2">
              <div className="truncate text-sm font-semibold text-slate-900">{it.url}</div>
              <div className="ml-auto text-xs text-slate-600">{typeof it.score === "number" ? `Score ${it.score}` : ""}</div>
            </div>
            <div className="mt-1 text-xs text-slate-600">
              {typeof it.issues_found === "number" ? `${it.issues_found} issues` : ""}{it.created_at ? ` • ${new Date(it.created_at).toLocaleString()}` : ""}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
