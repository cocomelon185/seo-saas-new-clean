import { useEffect, useMemo, useState } from "react";
import { clearRankChecks, deleteRankCheck, listRankChecks } from "../utils/rankHistory.js";

export default function RankHistoryPanel({ onPick }) {
  const [items, setItems] = useState([]);

  function refresh() {
    setItems(listRankChecks());
  }

  useEffect(() => {
    refresh();
  }, []);

  const has = items.length > 0;

  const rows = useMemo(() => {
    return items.map(x => ({
      ...x,
      shortDate: (x.createdAt || "").replace("T", " ").slice(0, 16)
    }));
  }, [items]);

  if (!has) return null;

  return (
    <div className="rp-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-[var(--rp-text-700)]">Saved rank checks</div>
        <button
          onClick={() => { clearRankChecks(); refresh(); }}
          className="ml-auto h-8 rounded-lg border border-[var(--rp-border)] px-3 text-xs font-semibold text-[var(--rp-text-600)] hover:border-[var(--rp-orange-500)]/40 hover:text-[var(--rp-indigo-900)]"
        >
          Clear
        </button>
      </div>

      <div className="mt-3 overflow-auto">
        <table className="rp-table w-full text-left text-sm">
          <thead>
            <tr className="text-[var(--rp-text-500)]">
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">Keyword</th>
              <th className="py-2 pr-3">Domain</th>
              <th className="py-2 pr-3">Rank</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(x => (
              <tr key={x.id} className="rp-table-row border-t border-[var(--rp-border)] text-[var(--rp-text-700)]">
                <td className="py-2 pr-3 whitespace-nowrap text-[var(--rp-text-500)]">{x.shortDate}</td>
                <td className="py-2 pr-3">{x.keyword}</td>
                <td className="py-2 pr-3">{x.domain}</td>
                <td className="py-2 pr-3 font-semibold">{x.rank ?? "—"}</td>
                <td className="py-2 pr-3 whitespace-nowrap">
                  <button
                    onClick={() => onPick && onPick({ keyword: x.keyword, domain: x.domain })}
                    className="h-8 rounded-lg border border-[var(--rp-border)] px-3 text-xs font-semibold text-[var(--rp-text-600)] hover:border-[var(--rp-orange-500)]/40 hover:text-[var(--rp-indigo-900)]"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => { deleteRankCheck(x.id); refresh(); }}
                    className="ml-2 h-8 rounded-lg border border-[var(--rp-border)] px-3 text-xs font-semibold text-[var(--rp-text-500)] hover:border-[var(--rp-orange-500)]/40 hover:text-[var(--rp-indigo-900)]"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
