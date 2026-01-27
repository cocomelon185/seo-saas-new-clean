import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import IssuesPanel from "../components/IssuesPanel.jsx";
import AuditImpactBanner from "../components/AuditImpactBanner.jsx";
import { decodeSharePayload } from "../utils/shareCodec.js";

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
    <AppShell title="Shared Audit" subtitle={subtitle}>
      <div className="flex flex-col gap-4">
        {err && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-100">
            {err}
          </div>
        )}

        {data && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Score</div>
              <div className="mt-1 text-3xl font-extrabold text-slate-900">{data.score ?? "N/A"}</div>
              <div className="mt-2 text-xs text-slate-500">Shared at: {data.shared_at}</div>
            </div>

            <AuditImpactBanner score={data.score} issues={data.issues} />
            <IssuesPanel issues={data.issues} />
          </>
        )}
      </div>
    </AppShell>
  );
}
