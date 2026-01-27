import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import PricingModal from "../components/PricingModal.jsx";
import RankHistoryPanel from "../components/RankHistoryPanel.jsx";
import ShareRankButton from "../components/ShareRankButton.jsx";
import RankUpsellBanner from "../components/RankUpsellBanner.jsx";
import { saveRankCheck } from "../utils/rankHistory.js";
import { exportRankSummary } from "../utils/exportRankSummary.js";
import { decodeSharePayload } from "../utils/shareRank.js";
import { listSnapshots } from "../utils/auditSnapshots.js";

function rankExplain(r) {
  if (!Number.isFinite(Number(r))) return "";
  const x = Number(r);
  if (x <= 10) return "First page (Top 10). Strong visibility.";
  if (x <= 20) return "Second page (11–20). Close to page one.";
  if (x <= 50) return "Pages 3–5 (21–50). Needs improvement.";
  return "Beyond 50. Big opportunity.";
}

function rankBadge(r) {
  if (!Number.isFinite(Number(r))) return null;
  const x = Number(r);
  if (x <= 3) return { label: "Top 3", cls: "bg-emerald-500 text-[#070A12]" };
  if (x <= 10) return { label: "Top 10", cls: "bg-emerald-200 text-[#070A12]" };
  if (x <= 20) return { label: "Page 2", cls: "bg-amber-300 text-[#070A12]" };
  if (x <= 50) return { label: "Page 3–5", cls: "bg-amber-200 text-[#070A12]" };
  return { label: "50+", cls: "bg-white/10 text-white/80 border border-white/10" };
}

function domainFromInput(s) {
  const raw = String(s || "").trim();
  if (!raw) return "";
  return raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
}

function latestKeywordIdeasForDomain(domain) {
  const d = domainFromInput(domain);
  if (!d) return [];
  const snaps = listSnapshots();
  const hit = snaps.find(s => {
    const u = String(s?.url || "");
    return u.includes(d);
  });
  const ideas = Array.isArray(hit?.keyword_ideas) ? hit.keyword_ideas : [];
  return ideas.map(x => String(x || "").trim()).filter(Boolean).slice(0, 8);
}

export default function RankPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pricingOpen, setPricingOpen] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const canRun = useMemo(() => keyword.trim().length > 0 && domain.trim().length > 0, [keyword, domain]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || "");
      const share = (params.get("share") || "").trim();
      const kw = (params.get("keyword") || "").trim();
      const dm = (params.get("domain") || "").trim();

      if (kw) setKeyword(kw);
      if (dm) setDomain(dm);

      if (share) {
        const payload = decodeSharePayload(share);
        if (payload && payload.kind === "rank") {
          const normalized = {
            keyword: payload.keyword || kw || "",
            domain: payload.domain || dm || "",
            rank: payload.rank ?? null,
            checked_at: payload.checked_at || payload.created_at || null
          };
          setResult(normalized);
          setStatus("success");
        }
      }
    } catch {}
  }, [location.search]);

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
        body: JSON.stringify({ keyword: keyword.trim(), domain: domainFromInput(domain) })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const normalized = { ...data, domain: domainFromInput(data?.domain || domain), rank: data.rank ?? data.position };
      setResult(normalized);
      try { saveRankCheck(normalized); } catch {}
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(String(e?.message || "Request failed."));
    }
  }

  const shownRank = result?.rank ?? result?.position ?? null;
  const badge = rankBadge(shownRank);

  const ideas = useMemo(() => {
    if (keyword.trim()) return [];
    return latestKeywordIdeasForDomain(domain);
  }, [domain, keyword]);

  return (
    <AppShell
      title="Rank Checker"
      subtitle="Check where your domain ranks for a keyword. Keep it fast and simple — history comes later."
    >
      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />

      <div className="flex flex-col gap-4">
        <div className="flex justify-end gap-2">
          <ShareRankButton result={result} />
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

        <RankUpsellBanner onOpen={() => setPricingOpen(true)} />

        <div className="grid gap-3 md:grid-cols-3 md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Keyword</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="seo audit tool"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-white/20"
            />
            {!!ideas.length && (
              <div className="mt-2 flex flex-wrap gap-2">
                {ideas.map((x) => (
                  <button
                    key={x}
                    onClick={() => setKeyword(x)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/70 hover:bg-white/[0.06]"
                    title="Suggested from your last audit"
                  >
                    {x}
                  </button>
                ))}
              </div>
            )}
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
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-white/80">Result</div>
              {badge && (
                <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold " + badge.cls}>
                  {badge.label}
                </span>
              )}
            </div>

            <div className="mt-3 grid gap-2 text-white/90">
              <div><span className="text-white/60">Keyword:</span> {result?.keyword || keyword}</div>
              <div><span className="text-white/60">Domain:</span> {result?.domain || domainFromInput(domain)}</div>

              <div className="text-2xl font-semibold">
                <span className="text-white/60 text-base font-medium">Rank:</span> {shownRank ?? "—"}
              </div>

              <div className="text-sm text-white/60">
                {rankExplain(shownRank)}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => navigate(`/audit?url=${encodeURIComponent(`https://${domainFromInput(result?.domain || domain)}`)}`)}
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

                <button
                  onClick={() => setPricingOpen(true)}
                  className="h-9 rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/65 hover:bg-white/[0.04]"
                >
                  Track weekly
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
