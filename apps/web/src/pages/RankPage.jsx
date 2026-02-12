import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { IconCompass, IconChart, IconReport } from "../components/Icons.jsx";
import ShareRankButton from "../components/ShareRankButton.jsx";
import DeferredRender from "../components/DeferredRender.jsx";
import { saveRankCheck } from "../utils/rankHistory.js";
import { decodeSharePayload } from "../utils/shareRank.js";
import { listSnapshots } from "../utils/auditSnapshots.js";
import { listRankChecks } from "../utils/rankHistory.js";
import { getAuthToken, getAuthUser } from "../lib/authClient.js";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";

const PricingModal = lazy(() => import("../components/PricingModal.jsx"));
const RankHistoryPanel = lazy(() => import("../components/RankHistoryPanel.jsx"));
const RankUpsellBanner = lazy(() => import("../components/RankUpsellBanner.jsx"));

function rankExplain(r) {
  if (!Number.isFinite(Number(r))) return "";
  const x = Number(r);
  if (x <= 10) return "First page (Top 10). Strong visibility.";
  if (x <= 20) return "Second page (11-20). Close to page one.";
  if (x <= 50) return "Pages 3-5 (21-50). Needs improvement.";
  return "Beyond 50. Big opportunity.";
}

function rankBadge(r) {
  if (!Number.isFinite(Number(r))) return null;
  const x = Number(r);
  if (x <= 3) return { label: "Top 3", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
  if (x <= 10) return { label: "Top 10", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
  if (x <= 20) return { label: "Page 2", cls: "bg-amber-100 text-amber-700 border border-amber-200" };
  if (x <= 50) return { label: "Page 3-5", cls: "bg-amber-50 text-amber-700 border border-amber-200" };
  return { label: "50+", cls: "bg-[var(--rp-gray-50)] text-[var(--rp-text-600)] border border-[var(--rp-border)]" };
}

function domainFromInput(s) {
  const raw = String(s || "").trim();
  if (!raw) return "";
  return raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
}

function latestKeywordIdeasForDomain(domain) {
  const d = domainFromInput(domain);
  if (!d) return [];
  const snaps = Array.isArray(listSnapshots()) ? listSnapshots() : [];
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
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  const [pricingOpen, setPricingOpen] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const authUser = getAuthUser();
  const [requestStatus, setRequestStatus] = useState("");
  const [allowRank, setAllowRank] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch(apiUrl("/api/account-settings"), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => safeJson(r))
      .then((data) => {
        if (data?.ok && data?.settings) setAllowRank(data.settings.allow_rank !== false);
      })
      .catch(() => {});
  }, []);

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

    if (!allowRank) {
      setStatus("error");
      setError("Rank Tracker disabled for your team.");
      return;
    }
    if (!canRun) {
      setStatus("error");
      setError("Enter both a keyword and a domain.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(apiUrl("/api/rank-check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), domain: domainFromInput(domain) })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await safeJson(res);
      if (!data || typeof data !== "object") {
        throw new Error("Unexpected response.");
      }
      const normalized = {
        ...data,
        keyword: String(data?.keyword ?? keyword ?? "").trim(),
        domain: domainFromInput(data?.domain || domain),
        rank: data.rank ?? data.position
      };
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

  const safeKeyword = String(result?.keyword || keyword || "");
  const safeDomain = String(result?.domain || domainFromInput(domain) || "");

  const history = useMemo(() => {
    const all = listRankChecks();
    if (!safeKeyword && !safeDomain) return all.slice(0, 12);
    return all.filter((x) => {
      const kwMatch = safeKeyword ? String(x.keyword || "").toLowerCase() === safeKeyword.toLowerCase() : true;
      const dmMatch = safeDomain ? String(x.domain || "").toLowerCase().includes(safeDomain.toLowerCase()) : true;
      return kwMatch && dmMatch;
    }).slice(0, 12);
  }, [safeKeyword, safeDomain]);

  const sparkline = useMemo(() => {
    const points = history
      .map((x) => Number(x.rank))
      .filter((x) => Number.isFinite(x))
      .slice(0, 8)
      .reverse();
    if (!points.length) return "";
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = Math.max(1, max - min);
    const xs = points.map((_, i) => 10 + i * 18);
    const ys = points.map((v) => 50 - ((v - min) / range) * 30);
    return xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  }, [history]);

  const bestRank = useMemo(() => {
    const ranks = history.map((x) => Number(x.rank)).filter((x) => Number.isFinite(x));
    if (!ranks.length) return null;
    return Math.min(...ranks);
  }, [history]);

  return (
    <AppShell
      title="Rank Checker"
      subtitle="Check where your domain ranks for a keyword. Keep it fast and simple - history comes later."
      seoTitle="Rank Checker | RankyPulse"
      seoDescription="Check where your domain ranks for a keyword."
      seoCanonical={`${base}/rank`}
      seoRobots="noindex,nofollow"
    >
      {pricingOpen ? (
        <Suspense fallback={null}>
          <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
        </Suspense>
      ) : null}

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        {[
          { label: "Tracked keywords", value: "128", tone: "text-[var(--rp-indigo-700)]" },
          { label: "Avg. position", value: "18.4", tone: "text-amber-600" },
          { label: "Visibility lift", value: "+12%", tone: "text-emerald-600" }
        ].map((item) => (
          <div key={item.label} className="rp-kpi-card rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
            <div className="text-xs text-[var(--rp-text-500)]">{item.label}</div>
            <div className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {authUser?.role === "member" && (
        <div className="mb-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-sm text-[var(--rp-text-600)]">
          You’re in a member role. Ask your admin to unlock full tracking history and exports.
          <div className="mt-3 flex gap-2">
            <button
              className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
              onClick={async () => {
                try {
                  const token = getAuthToken();
                  await fetch(apiUrl("/api/request-upgrade"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
                  });
                  setRequestStatus("Request sent.");
                  setTimeout(() => setRequestStatus(""), 2000);
                } catch {}
              }}
            >
              Request upgrade
            </button>
            {requestStatus && <span className="text-xs text-emerald-600">{requestStatus}</span>}
          </div>
        </div>
      )}

      {!allowRank && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          The Rank Tracker is disabled for your team. Ask an admin to enable it.
        </div>
      )}
      <div className="flex flex-col gap-4">
        <div className="flex justify-end gap-2">
          <ShareRankButton result={result} />
          <button
            onClick={async () => {
              if (!result) return;
              const mod = await import("../utils/exportRankSummary.js");
              mod.exportRankSummary(result);
            }}
            disabled={!result}
            className={"rp-btn-secondary rp-btn-sm h-9 px-3 text-xs " + (result ? "" : "cursor-not-allowed opacity-50")}
            title={result ? "Download a .txt summary" : "Run a check first"}
          >
            Export result
          </button>
        </div>

        <DeferredRender>
          <Suspense fallback={null}>
            <RankHistoryPanel onPick={({ keyword, domain }) => { setKeyword(keyword); setDomain(domain); }} />
          </Suspense>
        </DeferredRender>

        <DeferredRender>
          <Suspense fallback={null}>
            <RankUpsellBanner onOpen={() => setPricingOpen(true)} />
          </Suspense>
        </DeferredRender>

        <div className="grid gap-4 md:grid-cols-3 md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--rp-text-600)]" htmlFor="rank-keyword">
              Keyword
            </label>
            <input
              id="rank-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="seo audit tool"
              className="rp-input"
            />
            {!!ideas.length && (
              <div className="mt-2 flex flex-wrap gap-2">
                {ideas.map((x) => (
                  <button
                    key={x}
                    onClick={() => setKeyword(x)}
                    className="rp-chip rp-chip-neutral"
                    title="Suggested from your last audit"
                  >
                    {x}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--rp-text-600)]" htmlFor="rank-domain">
              Domain
            </label>
            <input
              id="rank-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="rankypulse.com"
              className="rp-input"
            />
          </div>

          <button
            onClick={checkRank}
            disabled={status === "loading" || !allowRank}
            className={[
              "rp-btn-primary text-sm",
              status === "loading" || !allowRank ? "opacity-50 cursor-not-allowed" : ""
            ].join(" ")}
          >
            <IconCompass size={14} />
            {status === "loading" ? "Checking..." : "Check Rank"}
          </button>
        </div>

        {status === "idle" && (
          <div className="rp-card p-5 text-[var(--rp-text-500)]">
            Enter a keyword and domain above to check rank.
          </div>
        )}

        {status === "loading" && (
          <div className="rp-card p-5 text-[var(--rp-text-600)]">
            Checking rank...
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-rose-300/60 bg-rose-100/70 p-5 text-rose-700">
            {String(error || "")}
          </div>
        )}

        {status === "success" && (
          <div className="grid gap-4">
            <div className="rp-card p-5">
              <div className="flex items-center gap-2">
                <div className="rp-section-title">Result</div>
                {badge && (
                  <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold " + badge.cls}>
                    {badge.label}
                  </span>
                )}
              </div>

              <div className="mt-3 grid gap-2 text-[var(--rp-text-700)]">
                <div><span className="text-[var(--rp-text-500)]">Keyword:</span> {safeKeyword || "-"}</div>
                <div><span className="text-[var(--rp-text-500)]">Domain:</span> {safeDomain || "-"}</div>

                <div className="text-2xl font-semibold text-[var(--rp-text-900)]">
                  <span className="text-[var(--rp-text-500)] text-base font-medium">Rank:</span> {shownRank ?? "-"}
                </div>

                <div className="text-sm text-[var(--rp-text-500)]">
                  {rankExplain(shownRank)}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => navigate(`/audit?url=${encodeURIComponent(`https://${domainFromInput(result?.domain || domain)}`)}`)}
                    className="rp-btn-primary text-sm"
                  >
                    Run SEO Audit for this domain
                  </button>

                  <button
                    onClick={async () => {
                      if (!result) return;
                      const mod = await import("../utils/exportRankSummary.js");
                      mod.exportRankSummary(result);
                    }}
                    className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                  >
                    Export result
                  </button>

                  <button
                    onClick={() => setPricingOpen(true)}
                    className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                  >
                    Track weekly
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rp-card rp-kpi-card p-4">
                <div className="flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                  <IconChart size={14} />
                  Current rank
                </div>
                <div className="mt-2 text-3xl font-semibold text-[var(--rp-text-900)]">{shownRank ?? "—"}</div>
                <div className="mt-2 rp-body-xsmall text-[var(--rp-text-500)]">
                  {rankExplain(shownRank) || "Run a check to see your visibility."}
                </div>
              </div>
              <div className="rp-card rp-kpi-card p-4">
                <div className="flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                  <IconReport size={14} />
                  Best in history
                </div>
                <div className="mt-2 text-3xl font-semibold text-[var(--rp-text-900)]">
                  {bestRank ?? "—"}
                </div>
                <div className="mt-2 rp-body-xsmall text-[var(--rp-text-500)]">
                  Based on the last {history.length || 0} checks.
                </div>
              </div>
              <div className="rp-card rp-kpi-card p-4">
                <div className="flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                  <IconChart size={14} />
                  Trend
                </div>
                <div className="rp-chart-card mt-3 h-14 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-2">
                  {sparkline ? (
                    <svg viewBox="0 0 150 60" className="h-full w-full">
                      <polyline
                        fill="none"
                        stroke="url(#rankTrend)"
                        strokeWidth="3"
                        points={sparkline}
                      />
                      <defs>
                        <linearGradient id="rankTrend" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                    </svg>
                  ) : (
                    <div className="text-xs text-[var(--rp-text-500)]">No trend data yet.</div>
                  )}
                </div>
                <div className="mt-2 rp-body-xsmall text-[var(--rp-text-500)]">
                  Lower numbers are better.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-[var(--rp-text-500)]">
          This page calls <span className="text-[var(--rp-text-700)]">POST /api/rank-check</span>.
        </div>
      </div>
    </AppShell>
  );
}
