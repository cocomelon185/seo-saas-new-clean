import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { getAnonId } from "../utils/anonId.js";
import { Link } from "react-router-dom";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";

export default function LeadsPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const anonId = getAnonId();
  const [status, setStatus] = useState("loading");
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");
  const [csvToast, setCsvToast] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionToast, setActionToast] = useState("");
  const [savingLeadId, setSavingLeadId] = useState(null);
  const [sendingTestLead, setSendingTestLead] = useState(false);

  const newCount = useMemo(() => leads.filter((l) => (l.status || "new") === "new").length, [leads]);
  const contactedCount = useMemo(() => leads.filter((l) => l.status === "contacted").length, [leads]);
  const wonCount = useMemo(() => leads.filter((l) => l.status === "won").length, [leads]);
  const contactRate = leads.length ? Math.round((contactedCount / leads.length) * 100) : 0;
  const winRate = leads.length ? Math.round((wonCount / leads.length) * 100) : 0;
  const filteredLeads = useMemo(
    () => leads.filter((lead) => statusFilter === "all" || (lead.status || "new") === statusFilter),
    [leads, statusFilter]
  );

  async function sendTestLead() {
    if (!anonId) {
      setActionToast("Could not create a test lead. Reload and try again.");
      setTimeout(() => setActionToast(""), 2200);
      return;
    }
    setSendingTestLead(true);
    try {
      const stamp = Date.now();
      const res = await fetch(apiUrl("/api/embed/lead"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: anonId,
          url: "https://example.com/pricing",
          email: `test+${stamp}@example.com`,
          name: "Test Lead"
        })
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Could not create a test lead.");
      await loadLeads();
      setActionToast("Test lead created.");
      setTimeout(() => setActionToast(""), 1800);
    } catch (e) {
      setActionToast(String(e?.message || "Could not create a test lead."));
      setTimeout(() => setActionToast(""), 2200);
    } finally {
      setSendingTestLead(false);
    }
  }

  async function loadLeads() {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(apiUrl("/api/embed/leads"), {
        headers: anonId ? { "x-rp-anon-id": anonId } : {}
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.ok) {
        const msg = String(data?.error || `Failed to load leads (HTTP ${res.status || "unknown"})`);
        if (msg.toLowerCase().includes("missing owner_id")) {
          throw new Error("Leads Inbox is ready. Connect your widget first to start capturing leads.");
        }
        throw new Error(msg);
      }

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
    } catch (e) {
      setStatus("error");
      setError(String(e?.message || "Failed to load leads"));
    }
  }

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
    loadLeads();
  }, []);

  async function updateLeadStatus(leadId, nextStatus) {
    setSavingLeadId(leadId);
    try {
      const res = await fetch(apiUrl(`/api/embed/leads/${leadId}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(anonId ? { "x-rp-anon-id": anonId } : {})
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Could not update lead.");

      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, status: nextStatus } : lead)));
      setActionToast(nextStatus === "won" ? "Lead moved to Won." : "Lead marked Contacted.");
      setTimeout(() => setActionToast(""), 1800);
    } catch (e) {
      setActionToast(String(e?.message || "Could not update lead."));
      setTimeout(() => setActionToast(""), 2200);
    } finally {
      setSavingLeadId(null);
    }
  }

  return (
    <AppShell
      title="Leads Inbox"
      subtitle="This is your lead pipeline from the embeddable SEO audit widget."
      seoTitle="Leads Inbox | RankyPulse"
      seoDescription="Leads captured from your embeddable audit widget."
      seoCanonical={`${base}/leads`}
      seoRobots="noindex,nofollow"
    >
      {csvToast && (
        <div className="fixed right-6 top-6 z-[9999] rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-lg">
          {csvToast}
        </div>
      )}
      {actionToast ? (
        <div className="fixed right-6 top-20 z-[9999] rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 shadow-lg">
          {actionToast}
        </div>
      ) : null}
      <div className="mb-4 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Total", value: leads.length, tone: "text-[var(--rp-text-900)]" },
          { label: "New", value: newCount, tone: "text-[var(--rp-indigo-700)]" },
          { label: "Contacted", value: contactedCount, tone: "text-amber-600" },
          { label: "Won", value: wonCount, tone: "text-emerald-600" },
          { label: "Contact rate", value: `${contactRate}%`, tone: "text-[var(--rp-text-900)]" },
          { label: "Win rate", value: `${winRate}%`, tone: "text-[var(--rp-text-900)]" }
        ].map((item) => (
          <div key={item.label} className="rp-kpi-card rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
            <div className="text-xs text-[var(--rp-text-500)]">{item.label}</div>
            <div className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>
      <div className="rp-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-[var(--rp-text-500)]">Filter and move leads across your pipeline.</div>
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
          <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-sm text-[var(--rp-text-600)]">Loading leads…</div>
        )}
        {status === "error" && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="text-sm font-semibold text-rose-700">{error || "Failed to load leads."}</div>
            <div className="mt-1 text-xs text-rose-600">Leads Inbox fills from your embed widget submissions.</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs" onClick={loadLeads}>Retry</button>
              <Link to="/embed" className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs">Open Embed Widget</Link>
            </div>
          </div>
        )}
        {status === "success" && leads.length === 0 && (
          <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-5">
            <div className="text-base font-semibold text-[var(--rp-text-900)]">No leads yet</div>
            <div className="mt-1 text-sm text-[var(--rp-text-600)]">
              Install and share your embeddable audit form. New submissions will appear here automatically.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/embed" className="rp-btn-primary rp-btn-sm h-9 px-3 text-xs">Open Embed Widget</Link>
              <Link to="/embed#setup" className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs">View setup guide</Link>
              <button
                type="button"
                className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                onClick={sendTestLead}
                disabled={sendingTestLead}
              >
                {sendingTestLead ? "Sending..." : "Send test lead"}
              </button>
            </div>
            <div className="mt-2 text-xs text-[var(--rp-text-500)]">
              Leads appear in real time after widget submissions.
            </div>
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
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Website</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Tags</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
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
                    <td className="px-3 py-2 text-[var(--rp-text-700)]">
                      {lead.email && String(lead.email).includes("@") ? String(lead.email).split("@")[1] : "—"}
                    </td>
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
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          className="rp-btn-secondary rp-btn-sm h-7 px-2 text-[11px]"
                          onClick={() => updateLeadStatus(lead.id, "contacted")}
                          disabled={savingLeadId === lead.id || lead.status === "contacted" || lead.status === "won"}
                        >
                          Mark contacted
                        </button>
                        <button
                          type="button"
                          className="rp-btn-secondary rp-btn-sm h-7 px-2 text-[11px]"
                          onClick={() => updateLeadStatus(lead.id, "won")}
                          disabled={savingLeadId === lead.id || lead.status === "won"}
                        >
                          Mark won
                        </button>
                        <Link to={`/leads/${lead.id}`} className="rp-btn-secondary rp-btn-sm h-7 px-2 text-[11px]">
                          Open
                        </Link>
                      </div>
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
