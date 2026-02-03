import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PricingModal from "../components/PricingModal.jsx";
import ShareAuditButton from "../components/ShareAuditButton.jsx";
import AppShell from "../components/AppShell.jsx";
import IssuesPanel from "../components/IssuesPanel.jsx";
import { exportAuditSummary } from "../utils/exportAuditSummary.js";
import SavedAuditsPanel from "../components/SavedAuditsPanel.jsx";
import AuditImpactBanner from "../components/AuditImpactBanner.jsx";
import AuditHistoryPanel from "../components/AuditHistoryPanel.jsx";
import { pushAuditHistory } from "../lib/auditHistory.js";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { track } from "../lib/eventsClient.js";

function AuditPageInner() {
  const __rp_markSkipAutoRun = () => {
    try { __rpSkipAutoRunRef.current = true; } catch {}
  };
  const __rpSkipAutoRunRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [pricingOpen, setPricingOpen] = useState(false);

  const [url, setUrl] = useState("");
  const hasUrl = Boolean(url?.trim());
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [hasResumeSnapshot, setHasResumeSnapshot] = useState(false);
  const [debug, setDebug] = useState("");
  const [debugExpanded, setDebugExpanded] = useState(false);
  const autoRunRef = useRef(false);
  
  // Conversion panel state
  const [conversionEmail, setConversionEmail] = useState("");
  const [conversionSubmitted, setConversionSubmitted] = useState(false);
  const [conversionDismissed, setConversionDismissed] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || "");
      const u = (params.get("url") || "").trim();
      if (u) {
        setUrl(u);
        return;
      }
    } catch {}

    // If no query param, restore last audited URL (enables Resume after reload)
    try {
      const last = (localStorage.getItem("rp_last_audit_url") || "").trim();
      if (last) setUrl(last);
    } catch {}
  }, [location.search]);

  useEffect(() => {
    if (__rpSkipAutoRunRef.current) { __rpSkipAutoRunRef.current = false; return; }

    if (hasResumeSnapshot) return;
    if (autoRunRef.current) return;
    if (status !== "idle") return;
    try {
      const u = new URL(url.trim());
      if (!(u.protocol === "http:" || u.protocol === "https:")) return;
    } catch {
      return;
    }
    if (!url.trim()) return;

    const snapshot = __rp_loadSnapshotForUrl(url);
    if (snapshot) {
      autoRunRef.current = true;
      setResult(snapshot);
      setStatus("success");
      setHasResumeSnapshot(true);
      return;
    }

    autoRunRef.current = true;
    run();
  }, [url, status]);

  // Check if conversion panel was dismissed in this session
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("post_audit_conversion_dismissed");
      if (dismissed === "true") {
        setConversionDismissed(true);
      }
    } catch {}
  }, []);

  // Show conversion panel when audit completes successfully
  useEffect(() => {
    if (status === "success" && result && !conversionDismissed && !conversionSubmitted) {
      // Panel will be shown via conditional rendering
    }
  }, [status, result, conversionDismissed, conversionSubmitted]);
  const canRun = useMemo(() => {
    try {
      const u = new URL(url.trim());
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, [url]);

  useEffect(() => {
    if (!url.trim()) return;
    const snap = __rp_loadSnapshotForUrl(url);
    setHasResumeSnapshot(Boolean(snap));
  }, [url]);

  function __rp_loadSnapshotForUrl(snapshotUrl) {
    if (!snapshotUrl) return null;
    try {
      const key = "rp_audit_snapshot::" + snapshotUrl.trim();
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : null;
    } catch {
      return null;
    }
  }

  function __rp_resumeWithoutNetwork() {
    try { __rpSkipAutoRunRef.current = true; } catch {}

    const snap = __rp_loadSnapshotForUrl(url);
    if (!snap) return false;
    try {
      setResult(snap);
      setStatus("success");
      setHasResumeSnapshot(true);
    } catch {}
    return true;
  }



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
      try { setDebug(JSON.stringify(data, null, 2)); } catch {}
      setResult(data);
      try {
        const key = "rp_audit_snapshot::" + (url || "").trim();
        localStorage.setItem(key, JSON.stringify(data));
        try { localStorage.setItem("rp_last_audit_url", (url || "").trim()); } catch {}
      } catch {}
      if (data?.warning) {
        setStatus("error");
        setError(String(data.warning));
        return;
      }
try {
        pushAuditHistory({
          url: data?.url || url,
          score: data?.score,
          issuesCount: Array.isArray(data?.issues) ? data.issues.length : (data?.issues_found ?? data?.issuesFound ?? 0),
          ranAt: Date.now()
        });

      } catch {}

      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(String(e?.message || "Request failed."));
    }
  }

  function handleConversionSubmit(e) {
    e.preventDefault();
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (conversionEmail.trim() && !emailRegex.test(conversionEmail.trim())) {
      return; // Silently ignore invalid email
    }

    // Store email in localStorage
    try {
      if (conversionEmail.trim()) {
        localStorage.setItem("post_audit_email", conversionEmail.trim());
      }
    } catch {}

    // Track event
    track("post_audit_email_opt_in", {
      meta: { source: "audit_page" }
    });

    // Show success state
    setConversionSubmitted(true);
  }

  function handleConversionDismiss() {
    // Store dismissal in sessionStorage
    try {
      sessionStorage.setItem("post_audit_conversion_dismissed", "true");
    } catch {}

    // Track event
    track("post_audit_email_dismissed", {
      meta: { source: "audit_page" }
    });

    // Hide panel
    setConversionDismissed(true);
  }

  const issues = Array.isArray(result?.issues) ? result.issues : [];
  const quickWins = Array.isArray(result?.quick_wins) ? result.quick_wins : [];
  const brief = typeof result?.content_brief === "string" ? result.content_brief : "";

  return (
<AppShell data-testid="audit-page"
      title="SEO Page Audit"
      subtitle="Paste a URL and get a score, quick wins, and a prioritized list of issues. Fast, clear, and usable."
    >

      <div className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Page URL</label>
            <input aria-label="Page URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/pricing"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-white/20"
            />
            <div className="mt-2 text-xs text-white/50">Tip: test with https://example.com</div>
          </div>

          <button
            onClick={run}
            disabled={!hasUrl || status === "loading"}
            title={!hasUrl ? "Runs audit for the URL below" : ""}
            className={[
              "rounded-2xl px-5 py-3 text-sm font-semibold transition",
              !hasUrl || status === "loading"
                ? "cursor-not-allowed bg-white/10 text-white/60"
                : "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white hover:opacity-95"
            ].join(" ")}
          >
            {status === "loading" ? "Running…" : "Run SEO Audit"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {status !== "loading" && hasResumeSnapshot && (
            <button
              onClick={() => {
                try {
                  const raw = localStorage.getItem("rp_audit_snapshot::" + (url || "").trim());
                  if (!raw) return;
                  const snap = JSON.parse(raw);
                  setError("");
                  setResult(snap);
                  setStatus("success");
                } catch {}
              }}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/[0.10]"
            >
              Resume audit
            </button>
          )}

          {status === "success" && (
            <button
              onClick={() => {
                __rp_markSkipAutoRun();
                run();
              }}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/[0.10]"
            >
              Re-run audit
            </button>
          )}
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
            {String(error || "")}
          </div>
        )}

        {status === "success" && result?.ok === false && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {result?.warning || "Audit failed. See debug for details."}
          </div>
        )}

        {status === "success" && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">SEO Score</div>
              <div className="mt-2 text-4xl font-semibold">
                {(result && result.ok === false) ? "—" : (typeof result?.score === "number" ? result.score : "—")}
              </div>
              <button
                onClick={() => setPricingOpen(true)}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.10]"
              >
                Unlock Full Fix Plan
              </button>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">Quick Wins</div>
              <div className="mt-3">
                {quickWins.length > 0 ? (
                  <ul className="list-disc space-y-2 pl-5 text-white/85">
                    {quickWins.slice(0, 10).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-white/60">No major quick wins returned.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Conversion Panel - Show after audit completes, only once per session */}
        {status === "success" && result && !conversionDismissed && !conversionSubmitted && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-sm font-semibold text-white/80 mb-2">Save your audit & track improvements</div>
            <div className="text-sm text-white/70 mb-4">Get notified when your SEO score changes or new issues appear.</div>
            <form onSubmit={handleConversionSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <input
                  type="email"
                  value={conversionEmail}
                  onChange={(e) => setConversionEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20"
                />
                <div className="mt-1 text-xs text-white/50">Optional</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  Email me updates
                </button>
                <button
                  type="button"
                  onClick={handleConversionDismiss}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.10]"
                >
                  Not now
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success state after email submission */}
        {status === "success" && result && conversionSubmitted && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-sm text-white/80">You're all set. We'll notify you when things change.</div>
          </div>
        )}

        {status === "success" && result && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-testid="observed-data">
            <div className="text-sm font-semibold text-white/80 mb-4">Evidence</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs text-white/60 mb-1">Final URL</div>
                <div className="text-sm text-white/85 break-all">
                  {result?.debug?.final_url || result?.final_url || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">HTTP Status</div>
                <div className="text-sm text-white/85">
                  {result?.debug?.final_status ?? result?.debug?.fetch_status ?? result?.status ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">Title</div>
                <div className="text-sm text-white/85">
                  {result?.evidence?.title ? (
                    <>
                      <span className={result.evidence.title === "—" ? "text-white/40" : ""}>
                        {result.evidence.title}
                      </span>
                      {result.evidence.title_char_count !== undefined && (
                        <span className="ml-2 text-xs text-white/50">
                          ({result.evidence.title_char_count} chars)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">Meta Description</div>
                <div className="text-sm text-white/85">
                  {result?.evidence?.meta_description ? (
                    <>
                      <span className={result.evidence.meta_description === "—" ? "text-white/40" : ""}>
                        {result.evidence.meta_description}
                      </span>
                      {result.evidence.meta_description_char_count !== undefined && (
                        <span className="ml-2 text-xs text-white/50">
                          ({result.evidence.meta_description_char_count} chars)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">H1</div>
                <div className="text-sm text-white/85">
                  {result?.evidence?.h1 ? (
                    <>
                      <span className={result.evidence.h1 === "—" ? "text-white/40" : ""}>
                        {result.evidence.h1}
                      </span>
                      {result.evidence.h1_count !== undefined && (
                        <span className="ml-2 text-xs text-white/50">
                          ({result.evidence.h1_count} found)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">Canonical</div>
                <div className="text-sm text-white/85 break-all">
                  {result?.evidence?.canonical ? (
                    <span>{result.evidence.canonical}</span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">Word Count</div>
                <div className="text-sm text-white/85">
                  {result?.evidence?.word_count !== undefined ? (
                    <span>{result.evidence.word_count.toLocaleString()}</span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">Links</div>
                <div className="text-sm text-white/85">
                  {result?.evidence?.internal_links_count !== undefined || result?.evidence?.external_links_count !== undefined ? (
                    <>
                      <span>Internal: {result.evidence.internal_links_count ?? 0}</span>
                      <span className="mx-2 text-white/50">•</span>
                      <span>External: {result.evidence.external_links_count ?? 0}</span>
                    </>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

{status === "success" && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-white/80">Content Brief</div>
              <div className="mt-3 whitespace-pre-wrap text-white/85">
                {brief || "No brief returned."}
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
          <AuditImpactBanner score={result?.score} issues={issues} />
            <div data-testid="key-issues">
              <IssuesPanel
              issues={issues}
              finalUrl={String(result?.debug?.final_url || result?.final_url || "")}
            />
            </div>
      {import.meta.env.DEV && debug && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <button
            onClick={() => setDebugExpanded(!debugExpanded)}
            className="flex w-full items-center justify-between text-sm font-semibold text-white/80 hover:text-white/90"
          >
            <span>Raw response (debug)</span>
            <span className="text-xs text-white/50">{debugExpanded ? "▼" : "▶"}</span>
          </button>
          {debugExpanded && (
            <pre className="mt-3 overflow-auto text-xs text-white/80">{debug}</pre>
          )}
        </div>
      )}
    </AppShell>
  );
}

export default function AuditPage() {
  return <AuditPageInner />;
}
