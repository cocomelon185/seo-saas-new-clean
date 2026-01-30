import { useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";

export default function ImprovePage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [includeAi, setIncludeAi] = useState(false);
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
        headers: { "Content-Type": "application/json",
        ...(includeAi && import.meta.env.VITE_INTERNAL_AI_TOKEN ? { "x-internal-ai": import.meta.env.VITE_INTERNAL_AI_TOKEN } : {}),
},
        body: JSON.stringify({ url: url.trim(), include_ai: includeAi })
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

  const contentBrief = typeof result?.content_brief === "string" ? result.content_brief : "";
  const keywordIdeas = Array.isArray(result?.keyword_ideas) ? result.keyword_ideas : [];
  const quickWins = Array.isArray(result?.quick_wins) ? result.quick_wins : [];

  return (
    <AppShell
      title="Improve Existing Page"
      subtitle="Turn one URL into an actionable plan: content brief, keyword ideas, and practical next steps."
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Page URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/blog/post"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-white/20"
            />
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              onClick={run}
              disabled={status === "loading"}
              className={[
                "rounded-2xl px-5 py-3 text-sm font-semibold transition",
                status === "loading"
                  ? "cursor-not-allowed bg-white/10 text-white/60"
                  : "bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white hover:opacity-95"
              ].join(" ")}
            >
              {status === "loading" ? "Generating…" : "Generate Plan"}
            </button>
            <label className="flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={includeAi}
                onChange={(e) => setIncludeAi(e.target.checked)}
                className="h-4 w-4 rounded border border-white/20 bg-white/10 text-indigo-400"
              />
              Include AI
            </label>
          </div>
        </div>

        {status === "idle" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/70">
            Enter a URL above to generate an improvement plan.
          </div>
        )}

        {status === "loading" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/80">
            Analyzing and generating suggestions… this may take up to 20 seconds.
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-100">
            {String(error || "")}
          </div>
        )}

        {status === "success" && (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">Content Brief</div>
              <div className="mt-3 whitespace-pre-wrap text-white/85">
                {contentBrief || "No brief returned."}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">Keyword Ideas</div>
              {keywordIdeas.length > 0 ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-white/85">
                  {keywordIdeas.slice(0, 24).map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 text-white/60">No keyword ideas returned.</div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">Quick Wins</div>
              {quickWins.length > 0 ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-white/85">
                  {quickWins.slice(0, 12).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 text-white/60">No quick wins returned.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
