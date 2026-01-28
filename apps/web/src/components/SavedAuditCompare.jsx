import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../utils/api.js";

export default function SavedAuditCompare({ url }) {
  const [items, setItems] = useState([]);
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [cmp, setCmp] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let on = true;
    setErr("");
    apiGet(`/api/audits?limit=50${url ? `&url=${encodeURIComponent(url)}` : ""}`)
      .then(j => { if (on) setItems(j.items || []); })
      .catch(e => { if (on) setErr(String(e.message || e)); });
    return () => { on = false; };
  }, [url]);

  const canCompare = useMemo(() => Boolean(before && after && before !== after), [before, after]);

  useEffect(() => {
    let on = true;
    setCmp(null);
    if (!canCompare) return;
    setErr("");
    apiGet(`/api/audits/compare?before=${encodeURIComponent(before)}&after=${encodeURIComponent(after)}`)
      .then(j => { if (on) setCmp(j.compare || null); })
      .catch(e => { if (on) setErr(String(e.message || e)); });
    return () => { on = false; };
  }, [before, after, canCompare]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">Saved audit comparison (before vs after)</div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-xs font-semibold text-slate-700">Before</div>
          <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={before} onChange={e => setBefore(e.target.value)}>
            <option value="">Select…</option>
            {items.map(x => (
              <option key={x.id} value={x.id}>
                {new Date(x.created_at).toLocaleString()} • score {x.score ?? "?"}{x.label ? ` • ${x.label}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-700">After</div>
          <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={after} onChange={e => setAfter(e.target.value)}>
            <option value="">Select…</option>
            {items.map(x => (
              <option key={x.id} value={x.id}>
                {new Date(x.created_at).toLocaleString()} • score {x.score ?? "?"}{x.label ? ` • ${x.label}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {err ? <div className="mt-3 text-sm text-red-600">{err}</div> : null}

      {cmp ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-sm font-semibold text-slate-900">Score delta</div>
            <div className="ml-auto text-sm font-semibold text-slate-900">
              {typeof cmp.score_delta === "number" ? (cmp.score_delta >= 0 ? `+${cmp.score_delta}` : String(cmp.score_delta)) : "?"}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-xs font-semibold text-slate-700">Fixed issues</div>
              <div className="mt-2 space-y-1">
                {(cmp.fixed_issues || []).slice(0, 12).map((x, i) => (
                  <div key={x + ":" + i} className="text-sm text-slate-900">{x}</div>
                ))}
                {(cmp.fixed_issues || []).length > 12 ? <div className="text-xs text-slate-500">+{(cmp.fixed_issues || []).length - 12} more</div> : null}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-xs font-semibold text-slate-700">New issues</div>
              <div className="mt-2 space-y-1">
                {(cmp.new_issues || []).slice(0, 12).map((x, i) => (
                  <div key={x + ":" + i} className="text-sm text-slate-900">{x}</div>
                ))}
                {(cmp.new_issues || []).length > 12 ? <div className="text-xs text-slate-500">+{(cmp.new_issues || []).length - 12} more</div> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
