import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { getAuthToken, getAuthUser } from "../lib/authClient.js";
import { IconBolt, IconDoc, IconReport, IconCompass } from "../components/Icons.jsx";
import { safeJson } from "../lib/safeJson.js";

export default function ImprovePage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const authUser = getAuthUser();
  const [requestStatus, setRequestStatus] = useState("");
  const [allowImprove, setAllowImprove] = useState(true);

  const [includeAi, setIncludeAi] = useState(false);
  const canRun = useMemo(() => {
    try {
      const u = new URL(url.trim());
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, [url]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch("/api/account-settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => safeJson(r))
      .then((data) => {
        if (data?.ok && data?.settings) setAllowImprove(data.settings.allow_improve !== false);
      })
      .catch(() => {});
  }, []);

  async function run() {
    setError("");
    setResult(null);

    if (!allowImprove) {
      setStatus("error");
      setError("Improve Page disabled for your team.");
      return;
    }

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
        body: JSON.stringify({ url: url.trim() })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await safeJson(res);
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
  const pageType = result?.page_type || "landing";
  const pageTypeAdvice = Array.isArray(result?.page_type_advice) ? result.page_type_advice : [];
  const rewriteExamples = Array.isArray(result?.rewrite_examples) ? result.rewrite_examples : [];
  const briefLength = useMemo(() => contentBrief.trim().length, [contentBrief]);
  const keywordCount = useMemo(() => keywordIdeas.length, [keywordIdeas]);
  const quickWinCount = useMemo(() => quickWins.length, [quickWins]);
  const planScore = useMemo(() => {
    const base = 40;
    const briefBoost = Math.min(30, Math.round(briefLength / 30));
    const kwBoost = Math.min(20, keywordCount * 2);
    const winBoost = Math.min(10, quickWinCount);
    return Math.min(100, base + briefBoost + kwBoost + winBoost);
  }, [briefLength, keywordCount, quickWinCount]);

  return (
    <AppShell
      title="Improve Existing Page"
      subtitle="Turn one URL into an actionable plan: content brief, keyword ideas, and practical next steps."
    >
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        {[
          { label: "Content gaps", value: "7", tone: "text-rose-600" },
          { label: "Keyword ideas", value: "24", tone: "text-[var(--rp-indigo-700)]" },
          { label: "Impact score", value: "86", tone: "text-emerald-600" }
        ].map((item) => (
          <div key={item.label} className="rp-kpi-card rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
            <div className="text-xs text-[var(--rp-text-500)]">{item.label}</div>
            <div className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>
      {allowImprove === false && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Improve Page is disabled for your team. Ask an admin to enable it.
        </div>
      )}
      {authUser?.role === "member" && (
        <div className="mb-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-sm text-[var(--rp-text-600)]">
          You’re in a member role. Ask your admin to unlock AI briefs and full improvement plans.
          <div className="mt-3 flex gap-2">
            <button
              className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
              onClick={async () => {
                try {
                  const token = getAuthToken();
                  await fetch("/api/request-upgrade", {
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
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--rp-text-600)]">Page URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/blog/post"
              className="rp-input"
            />
          </div>

          <button
            onClick={run}
            disabled={status === "loading" || !allowImprove}
            className={[
              "rp-btn-primary text-sm",
              status === "loading" || !allowImprove ? "opacity-50 cursor-not-allowed" : ""
            ].join(" ")}
          >
            <IconBolt size={14} />
            {status === "loading" ? "Generating..." : "Generate Plan"}
          </button>
        </div>

        {status === "idle" && (
          <div className="rp-card p-5 text-[var(--rp-text-500)]">
            Enter a URL above to generate an improvement plan.
          </div>
        )}

        {status === "loading" && (
          <div className="rp-card p-5 text-[var(--rp-text-600)]">
            Analyzing and generating suggestions... this may take up to 20 seconds.
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-rose-300/60 bg-rose-100/70 p-5 text-rose-700">
            {String(error || "")}
          </div>
        )}

        {status === "success" && (
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rp-card rp-kpi-card p-4">
                <div className="flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                  <IconDoc size={14} />
                  Brief depth
                </div>
                <div className="mt-2 text-2xl font-semibold text-[var(--rp-text-900)]">
                  {briefLength ? `${briefLength} chars` : "—"}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--rp-gray-100)]">
                  <div className="rp-bar h-1.5 rounded-full bg-emerald-400" style={{ width: `${Math.min(100, Math.round(briefLength / 8))}%` }} />
                </div>
              </div>
              <div className="rp-card rp-kpi-card p-4">
                <div className="flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                  <IconCompass size={14} />
                  Keyword ideas
                </div>
                <div className="mt-2 text-2xl font-semibold text-[var(--rp-text-900)]">
                  {keywordCount || "—"}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--rp-gray-100)]">
                  <div className="rp-bar h-1.5 rounded-full bg-cyan-400" style={{ width: `${Math.min(100, keywordCount * 8)}%` }} />
                </div>
              </div>
              <div className="rp-card rp-kpi-card p-4">
                <div className="flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                  <IconBolt size={14} />
                  Quick wins
                </div>
                <div className="mt-2 text-2xl font-semibold text-[var(--rp-text-900)]">
                  {quickWinCount || "—"}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--rp-gray-100)]">
                  <div className="rp-bar h-1.5 rounded-full bg-amber-400" style={{ width: `${Math.min(100, quickWinCount * 10)}%` }} />
                </div>
              </div>
              <div className="rp-card rp-kpi-card p-4">
                <div className="flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                  <IconReport size={14} />
                  Plan strength
                </div>
                <div className="mt-2 text-2xl font-semibold text-[var(--rp-text-900)]">
                  {planScore}%
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--rp-gray-100)]">
                  <div className="rp-bar h-1.5 rounded-full bg-emerald-400" style={{ width: `${planScore}%` }} />
                </div>
              </div>
            </div>

            <div className="rp-card p-5">
              <div className="rp-section-title">Content Brief</div>
              <div className="mt-3 whitespace-pre-wrap text-[var(--rp-text-700)]">
                {contentBrief || "No brief returned."}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rp-card p-5">
                <div className="flex items-center gap-2 rp-section-title">
                  Page‑type guidance
                  <span className="rp-chip rp-chip-neutral">{pageType}</span>
                </div>
                {pageTypeAdvice.length ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--rp-text-600)]">
                    {pageTypeAdvice.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 text-[var(--rp-text-500)]">No guidance available.</div>
                )}
              </div>
              <div className="md:col-span-2 rp-card p-5">
                <div className="rp-section-title">Rewrite examples</div>
                {rewriteExamples.length ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {rewriteExamples.slice(0, 6).map((ex, idx) => (
                      <div key={idx} className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                        <div className="text-xs font-semibold text-[var(--rp-text-600)]">{ex.label}</div>
                        <div className="mt-2 text-xs text-[var(--rp-text-500)]">Before</div>
                        <div className="text-sm text-[var(--rp-text-700)]">{ex.before || "-"}</div>
                        <div className="mt-2 text-xs text-[var(--rp-text-500)]">After</div>
                        <div className="text-sm font-semibold text-[var(--rp-text-900)]">{ex.after || "-"}</div>
                        {ex.note ? (
                          <div className="mt-2 text-xs text-[var(--rp-text-500)]">{ex.note}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-[var(--rp-text-500)]">No rewrite examples generated.</div>
                )}
              </div>
            </div>

            <div className="rp-card p-5">
              <div className="rp-section-title">Keyword Ideas</div>
              {keywordIdeas.length > 0 ? (
                <ul className="mt-3 grid gap-2 md:grid-cols-2 text-[var(--rp-text-600)]">
                  {keywordIdeas.slice(0, 24).map((k, i) => (
                    <li key={i} className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2 text-sm">
                      {k}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 text-[var(--rp-text-500)]">No keyword ideas returned.</div>
              )}
            </div>

            <div className="rp-card p-5">
              <div className="rp-section-title">Quick Wins</div>
              {quickWins.length > 0 ? (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {quickWins.slice(0, 12).map((x, i) => (
                    <div key={i} className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--rp-text-800)]">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[rgba(66,25,131,0.08)] text-[var(--rp-indigo-700)]">
                          <IconBolt size={14} />
                        </span>
                        {x}
                      </div>
                      <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                        Quick fix with visible impact when applied consistently.
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-[var(--rp-text-500)]">No quick wins returned.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
