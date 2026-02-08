import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { getAnonId } from "../utils/anonId.js";
import { safeJson } from "../lib/safeJson.js";

export default function LeadDetailPage() {
  const { id } = useParams();
  const anonId = getAnonId();
  const [status, setStatus] = useState("loading");
  const [lead, setLead] = useState(null);
  const [error, setError] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [leadStatus, setLeadStatus] = useState("new");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(apiUrl(`/api/embed/leads/${id}`), {
      headers: anonId ? { "x-rp-anon-id": anonId } : {}
    })
      .then((r) => safeJson(r))
      .then((data) => {
        if (cancelled) return;
        if (data?.ok && data.lead) {
          setLead(data.lead);
          setTags(Array.isArray(data.lead.tags) ? data.lead.tags.join(", ") : "");
          if (typeof data.lead.tags === "string") {
            try {
              const parsed = JSON.parse(data.lead.tags);
              if (Array.isArray(parsed)) setTags(parsed.join(", "));
            } catch {}
          }
          setNotes(data.lead.notes || "");
          setLeadStatus(data.lead.status || "new");
          setStatus("success");
        } else {
          setStatus("error");
          setError("Lead not found.");
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(String(e?.message || "Failed to load lead"));
      });
    return () => { cancelled = true; };
  }, [id]);

  return (
    <AppShell title="Lead Details" subtitle="Review a single lead captured by your widget.">
      <div className="rp-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/leads" className="text-sm text-[var(--rp-text-500)] hover:text-[var(--rp-text-900)]">
            ← Back to leads
          </Link>
        </div>
        {status === "loading" && <div className="text-sm text-[var(--rp-text-600)]">Loading…</div>}
        {status === "error" && <div className="text-sm text-rose-600">{error}</div>}
        {status === "success" && lead && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs text-[var(--rp-text-500)]">Name</div>
              <div className="text-lg font-semibold text-[var(--rp-text-900)]">{lead.name || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--rp-text-500)]">Email</div>
              <div className="text-lg font-semibold text-[var(--rp-text-900)]">{lead.email || "-"}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-[var(--rp-text-500)]">URL</div>
              <div className="text-[var(--rp-text-700)] break-all">{lead.url || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--rp-text-500)]">Captured</div>
              <div className="text-[var(--rp-text-700)]">{lead.created_at ? new Date(lead.created_at).toLocaleString() : "-"}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--rp-text-500)]">Status</div>
              <select
                className="rp-input mt-2"
                value={leadStatus}
                onChange={(e) => setLeadStatus(e.target.value)}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="won">Won</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-[var(--rp-text-500)]">Tags (comma separated)</div>
              <input
                className="rp-input mt-2"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="agency, pricing, ecommerce"
              />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-[var(--rp-text-500)]">Notes</div>
              <textarea
                className="rp-input mt-2 min-h-[120px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Follow-up notes, context, next steps..."
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                className="rp-btn-primary"
                onClick={async () => {
                  setSaveStatus("saving");
                  await fetch(apiUrl(`/api/embed/leads/${lead.id}`), {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(anonId ? { "x-rp-anon-id": anonId } : {})
                    },
                    body: JSON.stringify({
                      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                      notes,
                      status: leadStatus
                    })
                  });
                  setSaveStatus("saved");
                  setTimeout(() => setSaveStatus(""), 2000);
                }}
              >
                Save
              </button>
              {saveStatus === "saved" && (
                <span className="text-xs text-emerald-600">Saved</span>
              )}
              {saveStatus === "saving" && (
                <span className="text-xs text-[var(--rp-text-500)]">Saving…</span>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
