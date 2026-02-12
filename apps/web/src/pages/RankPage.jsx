import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { IconArrowRight, IconCompass, IconChart, IconReport } from "../components/Icons.jsx";
import ShareRankButton from "../components/ShareRankButton.jsx";
import DeferredRender from "../components/DeferredRender.jsx";
import { saveRankCheck } from "../utils/rankHistory.js";
import { decodeSharePayload } from "../utils/shareRank.js";
import { listSnapshots } from "../utils/auditSnapshots.js";
import { listRankChecks } from "../utils/rankHistory.js";
import { getAuthToken, getAuthUser } from "../lib/authClient.js";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";
import ApexSparkline from "../components/charts/ApexSparkline.jsx";
import SafeApexChart from "../components/charts/SafeApexChart.jsx";

const PricingModal = lazy(() => import("../components/PricingModal.jsx"));
const RankHistoryPanel = lazy(() => import("../components/RankHistoryPanel.jsx"));
const RankUpsellBanner = lazy(() => import("../components/RankUpsellBanner.jsx"));

const EXAMPLE_KEYWORDS = [
  "seo audit tool",
  "technical seo audit",
  "rank tracker for agencies"
];

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

function isLikelyDomain(value) {
  const clean = domainFromInput(value);
  if (!clean) return false;
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(clean);
}

function estimateCtr(rank) {
  const r = Number(rank);
  if (!Number.isFinite(r)) return 0;
  if (r <= 1) return 0.28;
  if (r <= 3) return 0.18;
  if (r <= 5) return 0.1;
  if (r <= 10) return 0.05;
  if (r <= 20) return 0.02;
  return 0.008;
}

function estimateMonthlyClicksGain(rank, targetRank = 10, monthlyVolume = 1200) {
  const r = Number(rank);
  if (!Number.isFinite(r)) return 0;
  const currentCtr = estimateCtr(r);
  const targetCtr = estimateCtr(targetRank);
  return Math.max(0, Math.round((targetCtr - currentCtr) * monthlyVolume));
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
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [inlineErrors, setInlineErrors] = useState({ keyword: "", domain: "" });
  const [waitlistMessage, setWaitlistMessage] = useState("");
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

  const canRun = useMemo(() => {
    return keyword.trim().length > 0 && domain.trim().length > 0 && !inlineErrors.keyword && !inlineErrors.domain;
  }, [keyword, domain, inlineErrors]);

  useEffect(() => {
    const next = { keyword: "", domain: "" };
    if (keyword.trim() && keyword.trim().length < 2) next.keyword = "Use at least 2 characters.";
    if (domain.trim() && !isLikelyDomain(domain)) next.domain = "Use a real domain like example.com (no https).";
    setInlineErrors(next);
  }, [keyword, domain]);

  useEffect(() => {
    if (status !== "loading") {
      setLoadingStep(0);
      return;
    }
    const id = setInterval(() => {
      setLoadingStep((prev) => (prev >= 2 ? 2 : prev + 1));
    }, 850);
    return () => clearInterval(id);
  }, [status]);

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
    setWaitlistMessage("");

    if (!allowRank) {
      setStatus("error");
      setError("Rank Tracker disabled for your team.");
      return;
    }
    if (!keyword.trim() || !domain.trim()) {
      setStatus("error");
      setError("Enter both a keyword and a domain.");
      return;
    }
    if (inlineErrors.keyword || inlineErrors.domain) {
      setStatus("error");
      setError("Please fix the highlighted fields before running the check.");
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
      setLastCheckedAt(normalized?.checked_at || new Date().toISOString());
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

  const trendValues = useMemo(() => {
    return history
      .map((x) => Number(x.rank))
      .filter((x) => Number.isFinite(x))
      .slice(0, 8)
      .reverse();
  }, [history]);

  const previousRank = useMemo(() => {
    if (!history.length || !Number.isFinite(Number(shownRank))) return null;
    const previous = history
      .map((x) => Number(x.rank))
      .filter((x) => Number.isFinite(x))
      .find((x) => x !== Number(shownRank));
    return Number.isFinite(previous) ? previous : null;
  }, [history, shownRank]);

  const rankDelta = useMemo(() => {
    if (!Number.isFinite(Number(shownRank)) || !Number.isFinite(Number(previousRank))) return null;
    return Number(previousRank) - Number(shownRank);
  }, [shownRank, previousRank]);

  const inferredCompetitor = useMemo(() => {
    if (Number(shownRank) <= 1) return "You are currently leading";
    const known = String(result?.top_competitor || result?.competitor || "").trim();
    if (known) return known;
    return "Higher-ranked competitor in this SERP";
  }, [shownRank, result?.top_competitor, result?.competitor]);

  const estimatedClicksGain = useMemo(() => {
    return estimateMonthlyClicksGain(shownRank, 10, 1200);
  }, [shownRank]);

  const bestRank = useMemo(() => {
    const ranks = history.map((x) => Number(x.rank)).filter((x) => Number.isFinite(x));
    if (!ranks.length) return null;
    return Math.min(...ranks);
  }, [history]);

  return (
    <AppShell
      title="Rank Checker"
      subtitle="Track where your keyword ranks and what to fix next."
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

      <div className="mb-4 grid gap-3 md:gap-4 md:grid-cols-3">
        {[
          {
            label: "Tracked keywords",
            value: String(
              new Set(listRankChecks().map((x) => String(x.keyword || "").trim()).filter(Boolean)).size || 0
            ),
            tone: "text-[var(--rp-indigo-700)]"
          },
          {
            label: "Avg. position",
            value: history.length
              ? (history.reduce((sum, row) => sum + Number(row.rank || 0), 0) / history.length).toFixed(1)
              : "—",
            tone: "text-amber-600"
          },
          {
            label: "Visibility lift",
            value: rankDelta === null ? "—" : `${rankDelta > 0 ? "+" : ""}${rankDelta}`,
            tone: rankDelta !== null && rankDelta > 0 ? "text-emerald-600" : "text-[var(--rp-text-700)]"
          }
        ].map((item) => (
          <div key={item.label} className="rp-kpi-card rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
            <div className="text-xs font-medium text-[var(--rp-text-600)]">{item.label}</div>
            <div className={`mt-2 text-2xl font-semibold tracking-tight ${item.tone}`}>{item.value}</div>
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
      <div className="flex flex-col gap-4 md:gap-5">
        <div className="flex flex-wrap justify-stretch gap-2 md:justify-end">
          <div className="min-w-[140px] flex-1 md:min-w-0 md:flex-none">
            <ShareRankButton result={result} />
          </div>
          <button
            onClick={async () => {
              if (!result) return;
              const mod = await import("../utils/exportRankSummary.js");
              mod.exportRankSummary(result);
            }}
            disabled={!result}
            className={"rp-btn-secondary rp-btn-sm h-9 w-full px-3 text-xs md:w-auto " + (result ? "" : "cursor-not-allowed opacity-50")}
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
            <RankUpsellBanner
              onOpen={() => setPricingOpen(true)}
              email={waitlistEmail}
              onEmailChange={setWaitlistEmail}
              onJoinWaitlist={() => {
                const clean = String(waitlistEmail || "").trim().toLowerCase();
                if (!clean || !clean.includes("@")) {
                  setWaitlistMessage("Enter a valid email.");
                  setTimeout(() => setWaitlistMessage(""), 2200);
                  return;
                }
                try {
                  const key = "rp_rank_waitlist";
                  const existing = JSON.parse(localStorage.getItem(key) || "[]");
                  const next = Array.isArray(existing) ? existing : [];
                  if (!next.includes(clean)) next.push(clean);
                  localStorage.setItem(key, JSON.stringify(next));
                } catch {}
                setWaitlistMessage("You are on the waitlist. Weekly alerts coming soon.");
                setTimeout(() => setWaitlistMessage(""), 2600);
              }}
              message={waitlistMessage}
            />
          </Suspense>
        </DeferredRender>

        <div className="rp-card border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--rp-text-500)]">
            Try a keyword
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLE_KEYWORDS.map((sample) => (
              <button
                key={sample}
                onClick={() => setKeyword(sample)}
                className="rp-chip rp-chip-neutral"
                title="Use this example keyword"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        <div className="rp-card border border-[var(--rp-border)] bg-white p-4 md:p-5">
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
              className={"rp-input " + (inlineErrors.keyword ? "border-rose-300 focus:border-rose-400" : "")}
            />
            <div className="mt-1 text-xs text-[var(--rp-text-600)]">One query at a time for the cleanest signal.</div>
            {inlineErrors.keyword ? <div className="mt-1 text-xs text-rose-600">{inlineErrors.keyword}</div> : null}
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
              className={"rp-input " + (inlineErrors.domain ? "border-rose-300 focus:border-rose-400" : "")}
            />
            <div className="mt-1 text-xs text-[var(--rp-text-600)]">Use root domain only (example.com), no https or path.</div>
            {inlineErrors.domain ? <div className="mt-1 text-xs text-rose-600">{inlineErrors.domain}</div> : null}
          </div>

          <button
            onClick={checkRank}
            disabled={status === "loading" || !allowRank}
            className={[
              "rp-btn-primary h-11 w-full text-sm md:h-10 md:w-auto",
              status === "loading" || !allowRank ? "opacity-50 cursor-not-allowed" : ""
            ].join(" ")}
          >
            <IconCompass size={14} />
            {status === "loading" ? "Checking..." : "Check Rank"}
          </button>
        </div>
        </div>

        {status === "idle" && (
          <div className="rp-card p-4 md:p-5 text-[var(--rp-text-600)]">
            Enter a keyword and domain above to check rank.
          </div>
        )}

        {status === "loading" && (
          <div className="rp-card p-4 md:p-5 text-[var(--rp-text-700)]">
            <div className="text-sm font-semibold text-[var(--rp-text-800)]">Checking rank…</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Fetching SERP", "Comparing domains", "Calculating visibility"].map((step, index) => (
                <span
                  key={step}
                  className={[
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                    loadingStep >= index
                      ? "border-[var(--rp-indigo-300)] bg-[var(--rp-indigo-100)] text-[var(--rp-indigo-800)]"
                      : "border-[var(--rp-border)] bg-white text-[var(--rp-text-500)]"
                  ].join(" ")}
                >
                  {index + 1}. {step}
                </span>
              ))}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-rose-300/60 bg-rose-100/70 p-4 md:p-5 text-rose-700">
            {String(error || "")}
          </div>
        )}

        {status === "success" && (
          <div className="grid gap-4 md:gap-5">
            <div className="rp-card p-4 md:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="rp-section-title">Rank result</div>
                {badge && (
                  <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold " + badge.cls}>
                    {badge.label}
                  </span>
                )}
              </div>

              <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                Last checked: {lastCheckedAt ? new Date(lastCheckedAt).toLocaleString() : "Just now"}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs text-[var(--rp-text-500)]">Current position</div>
                  <div className="mt-1 text-2xl font-semibold text-[var(--rp-text-900)]">{shownRank ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs text-[var(--rp-text-500)]">Change vs last check</div>
                  <div className={"mt-1 text-2xl font-semibold " + (rankDelta && rankDelta > 0 ? "text-emerald-600" : "text-[var(--rp-text-900)]")}>
                    {rankDelta === null ? "—" : `${rankDelta > 0 ? "+" : ""}${rankDelta}`}
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs text-[var(--rp-text-500)]">Top competitor</div>
                  <div className="mt-1 text-sm font-semibold leading-snug text-[var(--rp-text-900)]">{inferredCompetitor}</div>
                </div>
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                  <div className="text-xs text-[var(--rp-text-500)]">Estimated clicks opportunity</div>
                  <div className="mt-1 text-2xl font-semibold text-[var(--rp-indigo-700)]">+{estimatedClicksGain}/mo</div>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-[var(--rp-text-800)]">
                <div><span className="text-[var(--rp-text-500)]">Keyword:</span> {safeKeyword || "-"}</div>
                <div><span className="text-[var(--rp-text-500)]">Domain:</span> {safeDomain || "-"}</div>

                <div className="text-2xl font-semibold text-[var(--rp-text-900)]">
                  <span className="text-[var(--rp-text-500)] text-base font-medium">Rank:</span> {shownRank ?? "-"}
                </div>

                <div className="text-sm text-[var(--rp-text-700)]">
                  {rankExplain(shownRank)}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => navigate(`/audit?url=${encodeURIComponent(`https://${domainFromInput(result?.domain || domain)}`)}`)}
                    className="rp-btn-primary h-10 w-full text-sm sm:w-auto"
                  >
                    Run SEO Audit for this domain
                  </button>

                  <button
                    onClick={async () => {
                      if (!result) return;
                      const mod = await import("../utils/exportRankSummary.js");
                      mod.exportRankSummary(result);
                    }}
                    className="rp-btn-secondary rp-btn-sm h-9 w-full px-3 text-xs sm:w-auto"
                  >
                    Export result
                  </button>

                  <button
                    onClick={() => setPricingOpen(true)}
                    className="rp-btn-secondary rp-btn-sm h-9 w-full px-3 text-xs sm:w-auto"
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
                  {trendValues.length ? (
                    <ApexSparkline values={trendValues} inverted />
                  ) : (
                    <div className="text-xs text-[var(--rp-text-500)]">No trend data yet.</div>
                  )}
                </div>
                <div className="mt-2 rp-body-xsmall text-[var(--rp-text-500)]">
                  Lower numbers are better.
                </div>
              </div>
            </div>

            {trendValues.length ? (
              <div className="rp-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-[var(--rp-text-800)]">Position trend (recent checks)</div>
                  <div className="text-xs text-[var(--rp-text-500)]">Rank 1 is best</div>
                </div>
                <div className="mt-3 h-48 rounded-xl border border-[var(--rp-border)] bg-white p-2">
                  <SafeApexChart
                    type="line"
                    height={176}
                    options={{
                      chart: { toolbar: { show: false }, animations: { enabled: true } },
                      stroke: { curve: "smooth", width: 3 },
                      colors: ["#7c3aed"],
                      grid: { borderColor: "#ede9fe" },
                      yaxis: {
                        reversed: true,
                        min: 1,
                        forceNiceScale: true,
                        labels: { style: { colors: "#6b5b95" } }
                      },
                      xaxis: {
                        categories: trendValues.map((_, i) => `Check ${i + 1}`),
                        labels: { style: { colors: "#6b5b95" } }
                      },
                      tooltip: { y: { formatter: (v) => `Position ${Math.round(v)}` } }
                    }}
                    series={[{ name: "Position", data: trendValues }]}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="text-xs text-[var(--rp-text-500)]">
          This page calls <span className="text-[var(--rp-text-700)]">POST /api/rank-check</span>.
        </div>
      </div>
    </AppShell>
  );
}
