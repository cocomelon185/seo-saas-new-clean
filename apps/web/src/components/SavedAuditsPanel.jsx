import { useEffect, useMemo, useState } from "react";
import { listSnapshots, saveSnapshot, deleteSnapshot, clearSnapshots, getSnapshot, summarize } from "../utils/auditSnapshots.js";

function fmtTs(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function SavedAuditsPanel({ result }) {
  const [snaps, setSnaps] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    setSnaps(listSnapshots());
  }, []);

  const currentSummary = useMemo(() => summarize(result), [result]);
  const selected = useMemo(() => (selectedId ? getSnapshot(selectedId) : null), [selectedId, snaps.length]);
  const selectedSummary = useMemo(() => summarize(selected), [selected]);

  const canSave = !!result;

  const onSave = () => {
    const snap = saveSnapshot(result);
    const next = listSnapshots();
    setSnaps(next);
    if (snap?.id) setSelectedId(snap.id);
  };

  const onDeleteSelected = () => {
    if (!selectedId) return;
    deleteSnapshot(selectedId);
    const next = listSnapshots();
    setSnaps(next);
    setSelectedId("");
  };

  const onClear = () => {
    clearSnapshots();
    setSnaps([]);
    setSelectedId("");
  };

  const scoreDelta =
    selectedSummary.score === null || currentSummary.score === null
      ? null
      : currentSummary.score - selectedSummary.score;

  const fixNowDelta =
    currentSummary.fixNow === null || selectedSummary.fixNow === null
      ? null
      : currentSummary.fixNow - selectedSummary.fixNow;

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-slate-900">Saved audits</div>

        <button
          disabled={!canSave}
          onClick={onSave}
          className={"ml-auto h-9 rounded-lg border px-3 text-sm font-semibold " + (canSave ? "text-slate-700 hover:bg-slate-50" : "cursor-not-allowed text-slate-400")}
        >
          Save this audit
        </button>

        <button
          disabled={!snaps.length}
          onClick={onClear}
          className={"h-9 rounded-lg border px-3 text-sm font-semibold " + (snaps.length ? "text-slate-700 hover:bg-slate-50" : "cursor-not-allowed text-slate-400")}
        >
          Clear
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 md:w-[520px]"
        >
          <option value="">Select a saved audit to compare…</option>
          {snaps.map((s) => (
            <option key={s.id} value={s.id}>
              {fmtTs(s.createdAt)} — {s.url || "N/A"} — score {s.score ?? "N/A"}
            </option>
          ))}
        </select>

        <button
          disabled={!selectedId}
          onClick={onDeleteSelected}
          className={"h-10 rounded-lg border px-3 text-sm font-semibold " + (selectedId ? "text-slate-700 hover:bg-slate-50" : "cursor-not-allowed text-slate-400")}
        >
          Delete selected
        </button>
      </div>

      {selected && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-semibold text-slate-700">Comparison</div>

          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-xs font-semibold text-slate-700">Score</div>
              <div className="mt-1 text-sm text-slate-900">
                Now: <span className="font-extrabold">{currentSummary.score ?? "N/A"}</span>{" "}
                <span className="text-slate-500">vs</span>{" "}
                Saved: <span className="font-extrabold">{selectedSummary.score ?? "N/A"}</span>
              </div>
              {scoreDelta !== null && (
                <div className="mt-1 text-xs text-slate-700">
                  Change: <span className="font-extrabold">{scoreDelta >= 0 ? `+${scoreDelta}` : `${scoreDelta}`}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-xs font-semibold text-slate-700">Fix now</div>
              <div className="mt-1 text-sm text-slate-900">
                Now: <span className="font-extrabold">{currentSummary.fixNow}</span>{" "}
                <span className="text-slate-500">vs</span>{" "}
                Saved: <span className="font-extrabold">{selectedSummary.fixNow}</span>
              </div>
              {fixNowDelta !== null && (
                <div className="mt-1 text-xs text-slate-700">
                  Change: <span className="font-extrabold">{fixNowDelta >= 0 ? `+${fixNowDelta}` : `${fixNowDelta}`}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-xs font-semibold text-slate-700">Total issues</div>
              <div className="mt-1 text-sm text-slate-900">
                Now: <span className="font-extrabold">{currentSummary.total}</span>{" "}
                <span className="text-slate-500">vs</span>{" "}
                Saved: <span className="font-extrabold">{selectedSummary.total}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 text-xs text-slate-600">
            Saved: <span className="font-semibold">{fmtTs(selected.createdAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
