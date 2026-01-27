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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-white/80">Saved rank checks</div>
        <button
          onClick={() => { clearRankChecks(); refresh(); }}
          className="ml-auto h-8 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/70 hover:bg-white/[0.04]"
        >
          Clear
        </button>
      </div>

      <div className="mt-3 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-white/50">
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">Keyword</th>
              <th className="py-2 pr-3">Domain</th>
              <th className="py-2 pr-3">Rank</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(x => (
              <tr key={x.id} className="border-t border-white/10 text-white/85">
                <td className="py-2 pr-3 whitespace-nowrap text-white/55">{x.shortDate}</td>
                <td className="py-2 pr-3">{x.keyword}</td>
                <td className="py-2 pr-3">{x.domain}</td>
                <td className="py-2 pr-3 font-semibold">{x.rank ?? "—"}</td>
                <td className="py-2 pr-3 whitespace-nowrap">
                  <button
                    onClick={() => onPick && onPick({ keyword: x.keyword, domain: x.domain })}
                    className="h-8 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/75 hover:bg-white/[0.04]"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => { deleteRankCheck(x.id); refresh(); }}
                    className="ml-2 h-8 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/55 hover:bg-white/[0.04]"
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
