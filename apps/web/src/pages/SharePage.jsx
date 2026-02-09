import { useEffect, useMemo, useState } from "react";
import MarketingShell from "../components/MarketingShell.jsx";
import IssuesPanel from "../components/IssuesPanel.jsx";
import AuditImpactBanner from "../components/AuditImpactBanner.jsx";
import { decodeSharePayload } from "../utils/shareCodec.js";
import { IconReport } from "../components/Icons.jsx";

export default function SharePage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const token = (window.location.hash || "").replace(/^#/, "").trim();
    if (!token) {
      setErr("Missing share token.");
      return;
    }
    (async () => {
      try {
        const obj = await decodeSharePayload(token);
        setData(obj);
      } catch (e) {
        setErr(String(e?.message || "Invalid share link."));
      }
    })();
  }, []);

  const subtitle = useMemo(() => {
    if (!data) return "Read-only shared audit.";
    return data.url ? `Read-only audit for ${data.url}` : "Read-only shared audit.";
  }, [data]);

  return (
    <MarketingShell title="Shared Audit" subtitle={subtitle}>
      <div className="flex flex-col gap-4">
        {err && (
          <div className="rounded-2xl border border-rose-300/60 bg-rose-100/70 p-5 text-rose-700">
            {err}
          </div>
        )}

        {data && (
          <>
            <div className="rp-card p-4">
              <div className="flex items-center gap-2 rp-section-title">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                  <IconReport size={14} />
                </span>
                Score
              </div>
              <div className="mt-1 text-3xl font-semibold text-[var(--rp-text-900)]">{data.score ?? "N/A"}</div>
              <div className="mt-2 rp-body-xsmall">Shared at: {data.shared_at}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rp-card p-4">
                <div className="text-xs text-[var(--rp-text-500)]">Issues found</div>
                <div className="mt-2 text-2xl font-semibold text-[var(--rp-text-900)]">
                  {Array.isArray(data.issues) ? data.issues.length : 0}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--rp-gray-100)]">
                  <div className="rp-bar h-1.5 rounded-full bg-amber-400" style={{ width: "65%" }} />
                </div>
              </div>
              <div className="rp-card p-4">
                <div className="text-xs text-[var(--rp-text-500)]">Quick wins</div>
                <div className="mt-2 text-2xl font-semibold text-[var(--rp-text-900)]">
                  {Array.isArray(data.quick_wins) ? data.quick_wins.length : 0}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--rp-gray-100)]">
                  <div className="rp-bar h-1.5 rounded-full bg-emerald-400" style={{ width: "55%" }} />
                </div>
              </div>
              <div className="rp-card p-4">
                <div className="text-xs text-[var(--rp-text-500)]">Priority focus</div>
                <div className="mt-2 text-sm font-semibold text-[var(--rp-text-800)]">Fix Now</div>
                <div className="mt-2 rp-body-xsmall text-[var(--rp-text-500)]">
                  Shareable audits highlight the top fixes first.
                </div>
              </div>
            </div>

            <AuditImpactBanner score={data.score} issues={data.issues} />
            <IssuesPanel issues={data.issues} />
          </>
        )}
      </div>
    </MarketingShell>
  );
}
