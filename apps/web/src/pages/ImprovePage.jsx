import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { getAuthToken, getAuthUser } from "../lib/authClient.js";
import { IconArrowRight, IconBolt, IconCompass, IconDoc } from "../components/Icons.jsx";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";
import { getAnonId } from "../utils/anonId.js";
import { extractApiErrorMessage, isFreeCreditExhaustedResponse, pricingRedirectPath } from "../lib/upgradeGate.js";

function normalizeImproveInputUrl(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return "";

  let candidate = raw.replace(/\s+/g, "");
  if (candidate.startsWith("//")) candidate = `https:${candidate}`;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) return "";
    if (!parsed.hostname) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function toTopFixes({ issues, quickWins }) {
  const priorityRank = { fix_now: 0, fix_next: 1, fix_later: 2 };
  const normalizedIssues = (Array.isArray(issues) ? issues : [])
    .map((item, idx) => ({
      id: String(item?.issue_id || `issue_${idx}`),
      title: String(item?.title || "SEO issue to fix"),
      why: String(item?.why || "This issue can weaken rankings or clarity."),
      fix: String(item?.example_fix || "Apply the recommended change and re-check."),
      priority: String(item?.priority || "fix_next")
    }))
    .sort((a, b) => (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99));

  if (normalizedIssues.length > 0) return normalizedIssues.slice(0, 3);

  return (Array.isArray(quickWins) ? quickWins : []).slice(0, 3).map((item, idx) => ({
    id: `quick_${idx}`,
    title: String(item || "Quick win"),
    why: "Small change, fast SEO impact.",
    fix: String(item || "Apply this quick win and re-check."),
    priority: "fix_next"
  }));
}

function normalizeBrandCopy(value) {
  return String(value || "").replace(/rankypulse/gi, "RankyPulse");
}

export default function ImprovePage() {
  const navigate = useNavigate();
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const anonId = getAnonId();
  const authUser = getAuthUser();

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [allowImprove, setAllowImprove] = useState(true);
  const [requestStatus, setRequestStatus] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [planStatus, setPlanStatus] = useState("");

  const normalizedImproveUrl = useMemo(() => normalizeImproveInputUrl(url), [url]);
  const canRun = Boolean(normalizedImproveUrl);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch(apiUrl("/api/account-settings"), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => safeJson(r))
      .then((data) => {
        if (data?.ok && data?.settings) setAllowImprove(data.settings.allow_improve !== false);
      })
      .catch(() => {});
  }, []);

  async function copyText(text, message) {
    try {
      await navigator.clipboard.writeText(String(text || ""));
      setCopyStatus(message);
      setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("Could not copy. Please copy manually.");
      setTimeout(() => setCopyStatus(""), 1800);
    }
  }

  async function run() {
    setError("");
    setResult(null);

    if (!allowImprove) {
      setStatus("error");
      setError("Improve Page is disabled for your team.");
      return;
    }

    if (!normalizedImproveUrl) {
      setStatus("error");
      setError("Enter a valid page URL (example.com or https://example.com/page).");
      return;
    }

    if (normalizedImproveUrl !== url) setUrl(normalizedImproveUrl);

    setStatus("loading");
    try {
      const token = getAuthToken();
      const res = await fetch(apiUrl("/api/page-report"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(anonId ? { "x-rp-anon-id": anonId } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url: normalizedImproveUrl })
      });

      if (!res.ok) {
        const payload = await safeJson(res);
        if (isFreeCreditExhaustedResponse(res.status, payload)) {
          setStatus("error");
          setError("Your free credit is used. Upgrade to continue generating plans.");
          navigate(pricingRedirectPath("improve_page"), { replace: true });
          return;
        }
        throw new Error(extractApiErrorMessage(payload, `HTTP ${res.status}`));
      }

      const data = await safeJson(res);
      if (data?.warning) {
        setStatus("error");
        setError(String(data.warning));
        return;
      }
      setResult(data);
      setStatus("success");
      setPlanStatus("Plan ready. Start with Fix 1.");
      setTimeout(() => setPlanStatus(""), 1800);
    } catch (e) {
      setStatus("error");
      setError(String(e?.message || "Could not generate plan."));
    }
  }

  const issues = Array.isArray(result?.issues) ? result.issues : [];
  const quickWins = Array.isArray(result?.quick_wins) ? result.quick_wins : [];
  const rewriteExamples = Array.isArray(result?.rewrite_examples) ? result.rewrite_examples.slice(0, 3) : [];
  const keywordIdeas = Array.isArray(result?.keyword_ideas) ? result.keyword_ideas.slice(0, 8) : [];
  const topFixes = useMemo(() => {
    const real = toTopFixes({ issues, quickWins });
    const filled = [...real];
    while (filled.length < 3) {
      const idx = filled.length + 1;
      filled.push({
        id: `placeholder_${idx}`,
        title: "No major issue detected",
        why: "This slot is clear for now. Move to the next optimization layer.",
        fix: "Run SEO Audit for deeper technical and content opportunities.",
        priority: "fix_later",
        placeholder: true
      });
    }
    return filled.slice(0, 3);
  }, [issues, quickWins]);

  const fixesText = topFixes
    .filter((fix) => !fix.placeholder)
    .map((fix, index) => `${index + 1}. ${fix.title}\nWhy: ${fix.why}\nFix: ${fix.fix}`)
    .join("\n\n");

  return (
    <AppShell
      title="Improve Page"
      subtitle="Paste one URL and get a clear fix plan you can ship immediately."
      seoTitle="Improve Page | RankyPulse"
      seoDescription="Generate a simple, actionable improvement plan with top fixes, rewrites, and keyword additions."
      seoCanonical={`${base}/improve`}
      seoRobots="noindex,nofollow"
    >
      {allowImprove === false && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Improve Page is disabled for your team. Ask an admin to enable it.
        </div>
      )}

      {authUser?.role === "member" && (
        <div className="mb-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-sm text-[var(--rp-text-600)]">
          Need full AI plans and exports? You can ask your admin for upgrade access.
          <div className="mt-3 flex items-center gap-2">
            <button
              className="text-xs font-semibold text-[var(--rp-indigo-700)] underline underline-offset-4 hover:text-[var(--rp-indigo-800)]"
              onClick={async () => {
                try {
                  const token = getAuthToken();
                  await fetch(apiUrl("/api/request-upgrade"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
                  });
                  setRequestStatus("Request sent.");
                  setTimeout(() => setRequestStatus(""), 1800);
                } catch {}
              }}
            >
              Request upgrade
            </button>
            {requestStatus ? <span className="text-xs text-emerald-600">{requestStatus}</span> : null}
          </div>
        </div>
      )}

      <div className="rp-card p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr] md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--rp-text-600)]">
              <span className="rp-chip rp-chip-info">Analyze</span>
              <span className="rp-chip rp-chip-warning">Top 3 fixes</span>
              <span className="rp-chip rp-chip-success">Ship faster</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--rp-text-600)]" htmlFor="improve-page-url">
                  Page URL
                </label>
                <input
                  id="improve-page-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={(e) => {
                    const normalized = normalizeImproveInputUrl(e.target.value);
                    if (normalized) setUrl(normalized);
                  }}
                  placeholder="rankypulse.com/pricing"
                  className="rp-input"
                />
              </div>
              <button
                onClick={run}
                disabled={status === "loading" || !allowImprove}
                className={["rp-btn-primary rp-cta-dominant rp-improve-cta text-sm", status === "loading" || !allowImprove ? "opacity-50 cursor-not-allowed" : ""].join(" ")}
              >
                <IconBolt size={14} />
                {status === "loading" ? "Generating plan..." : "Generate Improvement Plan"}
              </button>
            </div>
            <div className="mt-2 text-xs text-[var(--rp-text-600)]">
              Enter plain domain or full URL. Example: <span className="font-semibold text-[var(--rp-text-700)]">rankypulse.com</span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-2xl border border-[rgba(124,58,237,0.18)] bg-[linear-gradient(160deg,rgba(124,58,237,0.12),rgba(45,212,191,0.08))] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--rp-text-600)]">Workflow preview</div>
              <svg viewBox="0 0 220 80" className="mt-3 h-16 w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="improveFlow" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <polyline fill="none" stroke="url(#improveFlow)" strokeWidth="4" points="10,55 65,42 115,48 165,28 210,20" />
                <circle cx="10" cy="55" r="5" fill="#06b6d4" />
                <circle cx="65" cy="42" r="5" fill="#22d3ee" />
                <circle cx="115" cy="48" r="5" fill="#8b5cf6" />
                <circle cx="165" cy="28" r="5" fill="#a855f7" />
                <circle cx="210" cy="20" r="5" fill="#10b981" />
              </svg>
              <div className="mt-2 text-xs text-[var(--rp-text-600)]">URL scan to top blockers to rewrites to publish</div>
            </div>
          </div>
        </div>
      </div>

      {copyStatus ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{copyStatus}</div>
      ) : null}
      {planStatus ? (
        <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-700">{planStatus}</div>
      ) : null}

      {status === "idle" ? (
        <div className="mt-4 rp-card p-5 text-[var(--rp-text-500)]">Enter a URL and generate your plan.</div>
      ) : null}

      {status === "loading" ? (
        <div className="mt-4 rp-card p-5 text-[var(--rp-text-600)]">Analyzing page and creating focused recommendations...</div>
      ) : null}

      {status === "error" ? (
        <div className="mt-4 rounded-2xl border border-rose-300/60 bg-rose-100/70 p-5 text-rose-700">{error || "Could not generate plan. Try again."}</div>
      ) : null}

      {status === "success" ? (
        <div className="mt-4 grid gap-4 pb-0 -mb-3">
          <section className="rp-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="rp-section-title">Top 3 Fixes</div>
                <div className="text-sm text-[var(--rp-text-500)]">Start here to remove the biggest blockers first.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs" onClick={() => copyText(fixesText, "Top fixes copied")} disabled={!fixesText}>
                  Copy top fixes
                </button>
                <button
                  type="button"
                  className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                  onClick={() => navigate(`/audit?url=${encodeURIComponent(result?.url || normalizedImproveUrl)}`)}
                >
                  <IconArrowRight size={14} />
                  Open SEO Audit
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {topFixes.map((fix, idx) => (
                <article
                  key={fix.id}
                  className={["rp-improve-stagger rounded-xl border p-4", fix.placeholder ? "border-[var(--rp-border)] bg-white" : "border-[var(--rp-border)] bg-[var(--rp-gray-50)]"].join(" ")}
                  style={{ animationDelay: `${110 + idx * 75}ms` }}
                >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-[var(--rp-indigo-700)]">Fix {idx + 1}</div>
                      <span className={`rp-chip text-[10px] ${fix.priority === "fix_now" ? "rp-chip-warning" : "rp-chip-neutral"}`}>
                        {fix.placeholder ? "Optional" : fix.priority === "fix_now" ? "Fix now" : "Fix next"}
                      </span>
                    </div>
                    <div className={fix.placeholder ? "mt-2 text-sm font-semibold text-[var(--rp-text-900)]" : "mt-2 text-sm font-semibold text-[var(--rp-text-900)]"}>{fix.placeholder ? "No blocker detected in this slot" : fix.title}</div>
                    <p className={fix.placeholder ? "mt-1 text-xs text-[var(--rp-text-600)]" : "mt-2 text-xs text-[var(--rp-text-600)]"}>{fix.why}</p>
                    <p className={fix.placeholder ? "mt-1 text-xs text-[var(--rp-text-700)]" : "mt-2 text-xs text-[var(--rp-text-700)]"}>{fix.fix}</p>
                    {fix.placeholder ? (
                      <>
                        <div className="mt-2 text-[11px] text-[var(--rp-text-500)]" title="No high-impact blocker was found for this slot in this pass.">
                          Why empty? No high-impact blocker detected.
                        </div>
                        <button
                          type="button"
                          className="mt-2 text-xs font-semibold text-[var(--rp-indigo-700)] underline underline-offset-4 hover:text-[var(--rp-indigo-800)]"
                          onClick={() => navigate(`/audit?url=${encodeURIComponent(result?.url || normalizedImproveUrl)}`)}
                        >
                          Go to full SEO Audit
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="mt-3 rp-btn-secondary rp-btn-sm h-8 px-3 text-xs"
                        onClick={() => copyText(`${fix.title}\n\nWhy: ${fix.why}\nFix: ${fix.fix}`, "Fix copied")}
                      >
                        Copy fix
                      </button>
                    )}
                </article>
              ))}
            </div>
            <div className="mt-3 text-xs text-[var(--rp-text-500)]">Done with these fixes? Re-run SEO Audit to confirm score lift.</div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 md:items-start">
            <section className="rp-card p-5">
              <div className="flex items-center gap-2 rp-section-title">
                <IconDoc size={14} />
                What to Rewrite
              </div>
              <div className="mt-1 text-sm text-[var(--rp-text-500)]">Use these before/after examples for faster edits.</div>
              {rewriteExamples.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {rewriteExamples.map((ex, idx) => (
                    <article key={idx} className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                      <div className="text-xs font-semibold text-[var(--rp-text-700)]">{ex.label || `Rewrite ${idx + 1}`}</div>
                      <div className="mt-2 text-[11px] uppercase tracking-[0.08em] text-[var(--rp-text-500)]">Before</div>
                      <div className="text-sm text-[var(--rp-text-600)]">{normalizeBrandCopy(ex.before || "-")}</div>
                      <div className="mt-2 text-[11px] uppercase tracking-[0.08em] text-[var(--rp-text-500)]">After</div>
                      <div className="text-sm font-semibold text-[var(--rp-text-900)]">{normalizeBrandCopy(ex.after || "-")}</div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-sm text-[var(--rp-text-500)]">No rewrite examples were generated for this URL.</div>
              )}
            </section>

            <section className="rp-card p-5">
              <div className="flex items-center gap-2 rp-section-title">
                <IconCompass size={14} />
                Keywords to Add
              </div>
              <div className="mt-1 text-sm text-[var(--rp-text-500)]">Add these terms naturally in headings and copy.</div>
              {keywordIdeas.length > 0 ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {keywordIdeas.map((k, idx) => (
                      <button
                        key={`${k}-${idx}`}
                        type="button"
                        onClick={() => copyText(k, "Keyword copied")}
                        className="rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-1.5 text-xs text-[var(--rp-text-700)] hover:border-[var(--rp-indigo-300)]"
                        title="Click to copy"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-3 rp-btn-secondary rp-btn-sm h-8 px-3 text-xs"
                    onClick={() => copyText(keywordIdeas.join("\n"), "Keywords copied")}
                  >
                    Copy keywords
                  </button>
                </>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3 text-sm text-[var(--rp-text-500)]">
                  No keyword ideas were generated for this URL.
                  <div className="mt-1 text-xs text-[var(--rp-text-600)]">Tip: run full audit to discover semantic terms.</div>
                  <div className="mt-2">
                    <button
                      type="button"
                      className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs"
                      onClick={() => navigate(`/audit?url=${encodeURIComponent(result?.url || normalizedImproveUrl)}`)}
                    >
                      Run full SEO Audit
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
