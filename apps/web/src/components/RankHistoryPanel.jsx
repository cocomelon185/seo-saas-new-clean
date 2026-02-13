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
  const bestRow = useMemo(() => {
    const valid = rows.filter((x) => Number.isFinite(Number(x.rank)));
    if (!valid.length) return null;
    return valid.reduce((best, row) => (Number(row.rank) < Number(best.rank) ? row : best), valid[0]);
  }, [rows]);
  const latestRow = rows[0] || null;
  const opportunityRow = useMemo(() => {
    const valid = rows.filter((x) => Number.isFinite(Number(x.rank)));
    if (!valid.length) return null;
    return valid
      .map((row) => ({
        ...row,
        opportunity: Math.max(0, 55 - Number(row.rank))
      }))
      .sort((a, b) => b.opportunity - a.opportunity)[0];
  }, [rows]);
  const fastestWinRow = useMemo(() => {
    const valid = rows.filter((x) => Number.isFinite(Number(x.rank)));
    if (!valid.length) return null;
    return valid
      .slice()
      .sort((a, b) => Math.abs(12 - Number(a.rank)) - Math.abs(12 - Number(b.rank)))[0];
  }, [rows]);
  const potentialTrafficGain = useMemo(() => {
    if (!opportunityRow || !Number.isFinite(Number(opportunityRow.rank))) return 0;
    const rank = Number(opportunityRow.rank);
    if (rank <= 10) return 18;
    if (rank <= 20) return 42;
    if (rank <= 40) return 68;
    return 95;
  }, [opportunityRow]);

  if (!has) return null;

  return (
    <div className="rp-card p-4">
      <div className="mb-3 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold text-[var(--rp-text-900)]">Rank command center</div>
          <span className="inline-flex items-center rounded-full border border-[var(--rp-border)] bg-white px-2 py-0.5 text-xs text-[var(--rp-text-600)]">
            {rows.length} saved checks
          </span>
          {bestRow ? (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Best rank #{bestRow.rank}
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {bestRow ? (
            <button
              onClick={() => onPick && onPick({ keyword: bestRow.keyword, domain: bestRow.domain })}
              className="h-8 rounded-lg bg-[var(--rp-indigo-700)] px-3 text-xs font-semibold text-white hover:bg-[var(--rp-indigo-800)]"
            >
              Reuse best keyword
            </button>
          ) : null}
          {latestRow ? (
            <button
              onClick={() => onPick && onPick({ keyword: latestRow.keyword, domain: latestRow.domain })}
              className="h-8 rounded-lg border border-[var(--rp-border)] px-3 text-xs font-semibold text-[var(--rp-text-700)] hover:border-[var(--rp-indigo-300)]"
            >
              Reuse latest check
            </button>
          ) : null}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--rp-border)] bg-white px-2.5 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Biggest opportunity</div>
            <div className="mt-1 text-sm font-semibold text-[var(--rp-text-900)]">
              {opportunityRow ? opportunityRow.keyword : "Run checks to detect opportunity"}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--rp-border)] bg-white px-2.5 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Fastest win</div>
            <div className="mt-1 text-sm font-semibold text-[var(--rp-text-900)]">
              {fastestWinRow ? `${fastestWinRow.keyword} (rank ${fastestWinRow.rank})` : "Run checks to identify"}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--rp-border)] bg-white px-2.5 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Potential traffic gain</div>
            <div className="mt-1 text-sm font-semibold text-[var(--rp-indigo-700)]">
              {potentialTrafficGain ? `≈ +${potentialTrafficGain}/mo` : "Pending checks"}
            </div>
          </div>
        </div>
      </div>

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
