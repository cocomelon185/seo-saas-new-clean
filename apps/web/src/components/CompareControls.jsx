import React, { useEffect, useMemo, useState } from "react";
import { loadAuditHistory, renameAuditSnapshot, upsertAuditSnapshot, deleteAuditSnapshot, makeSnapshotFromResult } from "../lib/audit_history.js";
import { diffIssues } from "../lib/issue_diff.js";

function fmt(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function normUrl(u) {
  return String(u || "").trim();
}

function chipClass(kind) {
  if (kind === "new") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (kind === "fixed") return "border-sky-200 bg-sky-50 text-sky-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function openComparePrintWindow({ baseline, compare, delta }) {
  const esc = (s) =>
    String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const title = `RankyPulse Compare`;
  const leftName = baseline?.name?.trim() ? baseline.name.trim() : fmt(baseline?.createdAt);
  const rightName = compare?.name?.trim() ? compare.name.trim() : fmt(compare?.createdAt);

  const fixedList = (delta?.fixed || []).slice(0, 500).map((x) => `<li>${esc(x?.title || x?.name || x?.summary || "Issue")}</li>`).join("");
  const newList = (delta?.added || []).slice(0, 500).map((x) => `<li>${esc(x?.title || x?.name || x?.summary || "Issue")}</li>`).join("");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 24px; color: #0f172a; }
    h1 { font-size: 18px; margin: 0 0 12px; }
    .meta { font-size: 12px; color: #475569; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; background: #fff; }
    .label { font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; }
    .pill { display: inline-block; border: 1px solid #e2e8f0; border-radius: 999px; padding: 2px 10px; font-size: 12px; margin-right: 8px; }
    .pill.new { border-color: #a7f3d0; background: #ecfdf5; color: #065f46; }
    .pill.fixed { border-color: #bae6fd; background: #f0f9ff; color: #075985; }
    ul { margin: 8px 0 0 18px; padding: 0; }
    li { margin: 4px 0; font-size: 12px; color: #0f172a; }
    .muted { color: #64748b; }
    @media print { body { margin: 0.5in; } }
  </style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <div class="meta">
    <div><b>URL:</b> ${esc(compare?.url || baseline?.url || "")}</div>
    <div><b>Compared:</b> ${esc(leftName)} → ${esc(rightName)}</div>
    <div class="muted"><span class="pill new">New: ${esc(delta?.addedCount ?? 0)}</span><span class="pill fixed">Fixed: ${esc(delta?.fixedCount ?? 0)}</span></div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="label">Fixed issues</div>
      <ul>${fixedList || "<li class='muted'>None</li>"}</ul>
    </div>
    <div class="card">
      <div class="label">New issues</div>
      <ul>${newList || "<li class='muted'>None</li>"}</ul>
    </div>
  </div>

  <script>
    window.onload = () => { window.focus(); window.print(); };
  </script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export default function CompareControls({
  currentResult,
  currentUrl,
  refreshKey,
  onCompareIssues,
  onSaveSnapshot
}) {
  const [history, setHistory] = useState([]);
  const [pairKey, setPairKey] = useState("");

  useEffect(() => {
    (async () => setHistory(await loadAuditHistory()))();
  }, []);

  useEffect(() => {
    (async () => setHistory(await loadAuditHistory()))();
  }, [refreshKey]);

  const sorted = useMemo(() => {
    const arr = Array.isArray(history) ? [...history] : [];
    arr.sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0));
    return arr;
  }, [history]);

  const lockedUrl = useMemo(() => {
    const u = normUrl(currentUrl);
    if (u) return u;
    const newest = sorted[0]?.url;
    return normUrl(newest);
  }, [currentUrl, sorted]);

  const pairOptions = useMemo(() => {
    const opts = [];
    const pool = sorted.filter((x) => normUrl(x?.url) === lockedUrl);
    for (let i = 0; i < pool.length - 1; i++) {
      const newer = pool[i];
      const older = pool[i + 1];
      if (!newer?.id || !older?.id) continue;
      const key = older.id + "::" + newer.id;
      const labelLeft = older.name?.trim() ? older.name.trim() : fmt(older.createdAt);
      const labelRight = newer.name?.trim() ? newer.name.trim() : fmt(newer.createdAt);
      opts.push({
        key,
        older,
        newer,
        label: labelLeft + "  →  " + labelRight
      });
    }
    return opts;
  }, [sorted, lockedUrl]);

  useEffect(() => {
    if (!pairKey && pairOptions.length > 0) {
      setPairKey(pairOptions[0].key);
    }
  }, [pairKey, pairOptions]);

  const selectedPair = useMemo(() => {
    const hit = pairOptions.find((x) => x.key === pairKey);
    return hit || null;
  }, [pairOptions, pairKey]);

  const delta = useMemo(() => {
    if (!selectedPair) return { fixedCount: 0, addedCount: 0, fixed: [], added: [], fixedKeys: [], addedKeys: [] };
    return diffIssues(selectedPair.older?.issues, selectedPair.newer?.issues);
  }, [selectedPair]);

  useEffect(() => {
    if (!selectedPair) {
      onCompareIssues?.(null);
      return;
    }
    onCompareIssues?.({
      lockedUrl,
      baseline: selectedPair.older,
      compare: selectedPair.newer,
      delta: {
        ...delta,
        fixedKeySet: new Set(delta.fixedKeys || []),
        addedKeySet: new Set(delta.addedKeys || [])
      }
    });
  }, [selectedPair, delta, onCompareIssues, lockedUrl]);

  async function onSaveSnapshotInternal() {
    if (!currentResult) return;
    if (onSaveSnapshot) {
      await onSaveSnapshot();
      setPairKey("");
      return;
    }
    const snap = makeSnapshotFromResult(currentResult, currentUrl);
    const next = await upsertAuditSnapshot(snap);
    setHistory(next);
    setPairKey("");
  }

  async function onRename(id, name) {
    const next = await renameAuditSnapshot(id, name);
    setHistory(next);
  }

  async function onDelete(id) {
    const next = await deleteAuditSnapshot(id);
    setHistory(next);
    setPairKey("");
  }

  const older = selectedPair?.older || null;
  const newer = selectedPair?.newer || null;

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm font-semibold text-slate-800">Compare</div>

        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
          value={pairKey}
          onChange={(e) => setPairKey(e.target.value)}
          disabled={pairOptions.length === 0}
        >
          {pairOptions.length === 0 ? (
            <option value="">Save 2+ audits for this URL</option>
          ) : (
            pairOptions.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))
          )}
        </select>

        <div className={"inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold " + chipClass("new")}>
          New <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">{delta.addedCount}</span>
        </div>

        <div className={"inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold " + chipClass("fixed")}>
          Fixed <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">{delta.fixedCount}</span>
        </div>

        <button
          className="ml-auto inline-flex items-center rounded-xl border border-slate-200 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onSaveSnapshotInternal}
          disabled={!currentResult}
          type="button"
        >
          Save audit
        </button>

        <button
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => selectedPair && openComparePrintWindow({ baseline: older, compare: newer, delta })}
          disabled={!selectedPair}
          type="button"
        >
          Export PDF
        </button>
      </div>

      <div className="mt-2 text-xs text-slate-500">
        Locked to URL: <span className="font-semibold text-slate-700">{lockedUrl || "(none)"}</span>
      </div>

      {selectedPair && (
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-slate-700">Before</div>
              <div className="text-xs text-slate-500">{fmt(older?.createdAt)}</div>
              <button
                className="ml-auto rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                type="button"
                onClick={() => onDelete(older?.id)}
              >
                Delete
              </button>
            </div>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
              value={older?.name || ""}
              placeholder="Name this audit (e.g., Before fix)"
              onChange={(e) => onRename(older?.id, e.target.value)}
            />
            <div className="mt-2 text-xs text-slate-600">{older?.url || ""}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-slate-700">After</div>
              <div className="text-xs text-slate-500">{fmt(newer?.createdAt)}</div>
              <button
                className="ml-auto rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                type="button"
                onClick={() => onDelete(newer?.id)}
              >
                Delete
              </button>
            </div>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
              value={newer?.name || ""}
              placeholder="Name this audit (e.g., After fix)"
              onChange={(e) => onRename(newer?.id, e.target.value)}
            />
            <div className="mt-2 text-xs text-slate-600">{newer?.url || ""}</div>
          </div>
        </div>
      )}
    </div>
  );
}
