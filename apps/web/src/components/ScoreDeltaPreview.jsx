export default function ScoreDeltaPreview({ preview }) {
  if (!preview) return null;
  const items = Array.isArray(preview.items) ? preview.items : [];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-sm font-semibold text-slate-900">{preview.headline || "Score delta preview"}</div>
        <div className="ml-auto text-xs text-slate-500">
          +{preview.total_min ?? "?"}–{preview.total_max ?? "?"}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-slate-600">No high-impact fixes found.</div>
        ) : (
          items.map((x, idx) => (
            <div key={(x.issue_id || x.label || idx) + ":" + idx} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900">{x.label}</div>
                <div className="text-xs text-slate-600">{x.priority || "fix_next"}</div>
              </div>
              <div className="text-xs font-semibold text-slate-900">
                +{Number(x.impact_min ?? 0).toFixed(0)}–{Number(x.impact_max ?? 0).toFixed(0)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
