import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PricingModal from "../components/PricingModal.jsx";
import AppShell from "../components/AppShell.jsx";
import ActionPlan from "../components/ActionPlan.jsx";

export default function AuditPage() {
  const navigate = useNavigate();
  const [pricingOpen, setPricingOpen] = useState(false);

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const canRun = useMemo(() => {
    try {
      const u = new URL(url.trim());
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, [url]);

  async function run() {
    setError("");
    setResult(null);

    if (!canRun) {
      setStatus("error");
      setError("Enter a valid URL (include https://).");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/page-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(String(e?.message || "Request failed."));
    }
  }

  return (
    <AppShell
      title="SEO Page Audit"
      subtitle="Paste a URL and get a score, quick wins, and a prioritized list of issues. Fast, clear, and usable."
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Page URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/pricing"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-white/20"
            />
            <div className="mt-2 text-xs text-white/50">Tip: test with https://example.com</div>
          </div>

          <button
            onClick={run}
            disabled={status === "loading"}
            className={[
              "rounded-2xl px-5 py-3 text-sm font-semibold transition",
              status === "loading"
                ? "cursor-not-allowed bg-white/10 text-white/60"
                : "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white hover:opacity-95"
            ].join(" ")}
          >
            {status === "loading" ? "Running…" : "Run SEO Audit"}
          </button>
        </div>

        {status === "idle" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/70">
            Enter a URL above to run an audit.
          </div>
        )}

        {status === "loading" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/80">
            Analyzing… this may take up to 20 seconds.
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-100">
            {error}
          </div>
        )}

        {status === "success" && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">SEO Score</div>
              <div className="mt-2 text-4xl font-semibold">
                {typeof result?.score === "number" ? result.score : 0}
              </div>
              <button
                onClick={() => setPricingOpen(true)}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.10]"
              >
                Unlock Full Fix Plan
              </button>
            </div>

            <ActionPlan result={result} />

            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">Quick Wins</div>
              <div className="mt-3">
                {Array.isArray(result?.quick_wins) && result.quick_wins.length > 0 ? (
                  <ul className="list-disc space-y-2 pl-5 text-white/85">
                    {result.quick_wins.slice(0, 10).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-white/60">No major quick wins returned.</div>
                )}
              </div>
            </div>

            <div className="md:col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">Content Brief</div>
              <div className="mt-3 whitespace-pre-wrap text-white/85">
                {result?.content_brief || "No brief returned."}
              </div>
            </div>
          </div>
        )}
      </div>
          <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        onSelectPlan={() => {
          setPricingOpen(false);
          navigate("/pricing");
        }}
      />
    </AppShell>
  );
}
