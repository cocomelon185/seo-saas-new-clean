import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import RankHistoryPanel from "../components/RankHistoryPanel.jsx";
import { saveRankCheck } from "../utils/rankHistory.js";
import { exportRankSummary } from "../utils/exportRankSummary.js";

export default function RankPage() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const canRun = useMemo(() => keyword.trim().length > 0 && domain.trim().length > 0, [keyword, domain]);

  function rankExplain(r) {
    if (!Number.isFinite(Number(r))) return "";
    const x = Number(r);
    if (x <= 10) return "First page (Top 10). Strong visibility.";
    if (x <= 20) return "Second page (11–20). Close to page one.";
    if (x <= 50) return "Pages 3–5 (21–50). Needs improvement.";
    return "Beyond 50. Big opportunity.";
  }

  async function checkRank() {
    setError("");
    setResult(null);

    if (!canRun) {
      setStatus("error");
      setError("Enter both a keyword and a domain.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/rank-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), domain: domain.trim() })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const normalized = { ...data, rank: data.rank ?? data.position };
      setResult(normalized);
      try { saveRankCheck(normalized); } catch {}
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(String(e?.message || "Request failed."));
    }
  }

  const shownRank = result?.rank ?? result?.position ?? null;

  return (
    <AppShell
      title="Rank Checker"
      subtitle="Check where your domain ranks for a keyword. Keep it fast and simple — history comes later."
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <button
            onClick={() => result && exportRankSummary(result)}
            disabled={!result}
            className={"h-9 rounded-lg border border-white/10 px-3 text-sm font-semibold " + (result ? "text-white/80 hover:bg-white/[0.04]" : "cursor-not-allowed text-white/35")}
            title={result ? "Download a .txt summary" : "Run a check first"}
          >
            Export result
          </button>
        </div>

        <RankHistoryPanel onPick={({ keyword, domain }) => { setKeyword(keyword); setDomain(domain); }} />

        <div className="grid gap-3 md:grid-cols-3 md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Keyword</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="seo audit tool"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-white/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Domain</label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="rankypulse.com"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-white/20"
            />
          </div>

          <button
            onClick={checkRank}
            disabled={status === "loading"}
            className={[
              "rounded-2xl px-5 py-3 text-sm font-semibold transition",
              status === "loading"
                ? "cursor-not-allowed bg-white/10 text-white/60"
                : "bg-gradient-to-r from-cyan-400 to-indigo-500 text-[#070A12] hover:opacity-95"
            ].join(" ")}
          >
            {status === "loading" ? "Checking…" : "Check Rank"}
          </button>
        </div>

        {status === "idle" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/70">
            Enter a keyword and domain above to check rank.
          </div>
        )}

        {status === "loading" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/80">
            Checking rank…
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-100">
            {error}
          </div>
        )}

        {status === "success" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-sm font-semibold text-white/80">Result</div>

            <div className="mt-3 grid gap-2 text-white/90">
              <div><span className="text-white/60">Keyword:</span> {result?.keyword || keyword}</div>
              <div><span className="text-white/60">Domain:</span> {result?.domain || domain}</div>

              <div className="text-2xl font-semibold">
                <span className="text-white/60 text-base font-medium">Rank:</span> {shownRank ?? "—"}
              </div>

              <div className="text-sm text-white/60">
                {rankExplain(shownRank)}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => navigate(`/audit?url=${encodeURIComponent(`https://${(result?.domain || domain).trim()}`)}`)}
                  className="h-9 rounded-lg bg-white text-[#070A12] px-3 text-sm font-semibold hover:opacity-95"
                >
                  Run SEO Audit for this domain
                </button>
                <button
                  onClick={() => exportRankSummary(result)}
                  className="h-9 rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/80 hover:bg-white/[0.04]"
                >
                  Export result
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-white/45">
          This page calls <span className="text-white/65">POST /api/rank-check</span>.
        </div>
      </div>
    </AppShell>
  );
}
