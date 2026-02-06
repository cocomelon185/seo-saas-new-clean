import React, { useEffect, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { getAnonId } from "../utils/anonId.js";
import { Link } from "react-router-dom";
import { safeJson } from "../lib/safeJson.js";

export default function LeadsPage() {
  const anonId = getAnonId();
  const [status, setStatus] = useState("loading");
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");
  const [csvToast, setCsvToast] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  function exportCsv() {
    if (!leads.length) return;
    const header = ["id", "created_at", "name", "email", "url", "status"];
    const rows = leads.map((l) => [
      l.id,
      l.created_at,
      l.name || "",
      l.email || "",
      l.url || "",
      l.status || "new"
    ]);
    const lines = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([lines], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rankypulse-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
    setCsvToast("CSV exported.");
    setTimeout(() => setCsvToast(""), 2500);
  }

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch("/api/embed/leads", {
      headers: anonId ? { "x-rp-anon-id": anonId } : {}
    })
      .then((r) => safeJson(r))
      .then((data) => {
        if (cancelled) return;
        if (data?.ok) {
          const items = Array.isArray(data.leads) ? data.leads : [];
          setLeads(items.map((l) => ({
            ...l,
            tags: (() => {
              if (Array.isArray(l.tags)) return l.tags;
              if (typeof l.tags === "string") {
                try { return JSON.parse(l.tags); } catch { return []; }
              }
              return [];
            })()
          })));
          setStatus("success");
        } else {
          setStatus("error");
          setError(data?.error || "Failed to load leads");
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(String(e?.message || "Failed to load leads"));
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <AppShell
      title="Leads Inbox"
      subtitle="Leads captured from your embeddable audit widget."
    >
      {csvToast && (
        <div className="fixed right-6 top-6 z-[9999] rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-lg">
          {csvToast}
        </div>
      )}
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        {[
          { label: "New leads", value: leads.filter(l => (l.status || "new") === "new").length, tone: "text-[var(--rp-indigo-700)]" },
          { label: "Contacted", value: leads.filter(l => l.status === "contacted").length, tone: "text-amber-600" },
          { label: "Won", value: leads.filter(l => l.status === "won").length, tone: "text-emerald-600" },
          { label: "Total", value: leads.length, tone: "text-[var(--rp-text-900)]" }
        ].map((item) => (
          <div key={item.label} className="rp-kpi-card rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
            <div className="text-xs text-[var(--rp-text-500)]">{item.label}</div>
            <div className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>
      <div className="rp-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-[var(--rp-text-500)]">Total leads: {leads.length}</div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "All" },
              { key: "new", label: "New" },
              { key: "contacted", label: "Contacted" },
              { key: "won", label: "Won" }
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  statusFilter === opt.key
                    ? "border-[var(--rp-indigo-400)] bg-[rgba(66,25,131,0.08)] text-[var(--rp-indigo-900)]"
                    : "border-[var(--rp-border)] text-[var(--rp-text-500)]"
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
            <button
              className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
              onClick={exportCsv}
              disabled={!leads.length}
              title={leads.length ? "Export leads to CSV" : "No leads yet"}
            >
              Export CSV
            </button>
          </div>
        </div>
        {status === "loading" && (
          <div className="text-sm text-[var(--rp-text-600)]">Loading leads…</div>
        )}
        {status === "error" && (
          <div className="text-sm text-rose-600">{error || "Failed to load leads."}</div>
        )}
        {status === "success" && leads.length === 0 && (
          <div className="text-sm text-[var(--rp-text-500)]">
            No leads yet. Share your embed widget to start collecting audit leads.
          </div>
        )}
        {status === "success" && leads.length > 0 && (
          <div className="overflow-auto">
            <table className="rp-table w-full text-left text-sm">
              <thead>
                <tr className="text-[var(--rp-text-500)]">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">URL</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Tags</th>
                </tr>
              </thead>
              <tbody>
                {leads
                  .filter((lead) => statusFilter === "all" || (lead.status || "new") === statusFilter)
                  .map((lead) => (
                  <tr key={lead.id} className="rp-table-row border-t border-[var(--rp-border)]">
                    <td className="px-3 py-2 text-[var(--rp-text-500)]">
                      {lead.created_at ? new Date(lead.created_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-2 text-[var(--rp-text-700)]">
                      <Link to={`/leads/${lead.id}`} className="font-semibold text-[var(--rp-indigo-700)] hover:text-[var(--rp-indigo-900)]">
                        {lead.name || "View lead"}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-[var(--rp-text-700)]">{lead.email || "-"}</td>
                    <td className="px-3 py-2 text-[var(--rp-text-700)] break-all">{lead.url || "-"}</td>
                    <td className="px-3 py-2">
                      <span className="rp-chip rp-chip-neutral capitalize">{lead.status || "new"}</span>
                    </td>
                    <td className="px-3 py-2">
                      {Array.isArray(lead.tags) && lead.tags.length
                        ? lead.tags.slice(0, 3).map((t) => (
                            <span key={t} className="mr-1 inline-flex items-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-2 py-0.5 text-[11px] text-[var(--rp-text-600)]">
                              {t}
                            </span>
                          ))
                        : <span className="text-xs text-[var(--rp-text-400)]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
