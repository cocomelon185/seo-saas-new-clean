import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { track } from "../lib/eventsClient.js";
import { IconPlay } from "../components/Icons.jsx";

export default function StartAuditPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const isValidUrl = useMemo(() => {
    if (!url.trim()) return false;
    try {
      let urlToCheck = url.trim();
      if (!/^https?:\/\//i.test(urlToCheck)) {
        urlToCheck = "https://" + urlToCheck;
      }
      const u = new URL(urlToCheck);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, [url]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidUrl) return;

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    track("landing_audit_started", {
      scope: "",
      meta: { source: "start_page" }
    });

    const encodedUrl = encodeURIComponent(normalizedUrl);
    navigate(`/audit?url=${encodedUrl}`);
  };

  return (
    <div className="rp-page rp-premium-bg flex items-center justify-center px-4">
      <div className="relative w-full max-w-2xl">
        <div className="rp-surface p-6 md:p-10">
          <p className="rp-kicker text-center">Instant Audit</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-center text-[var(--rp-text-900)] md:text-4xl">
            Run a free SEO audit in 30 seconds
          </h1>
          <p className="mt-2 text-center rp-body-small">
            Get your score, quick wins, and a clear fix plan.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div>
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="rp-input"
              />
            </div>

            <button
              type="submit"
              disabled={!isValidUrl}
              title={!isValidUrl ? "Enter a valid URL to enable the audit button." : "Run a free audit"}
              className={[
                "rp-btn-primary w-full",
                !isValidUrl ? "opacity-50 cursor-not-allowed" : ""
              ].join(" ")}
            >
              <IconPlay size={16} />
              Run Free Audit
            </button>
            {!isValidUrl && (
              <div className="text-center text-xs text-[var(--rp-text-500)]">
                Enter a valid URL to run the audit.
              </div>
            )}

            <p className="text-xs text-[var(--rp-text-500)] text-center">
              No signup required
            </p>
          </form>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              { label: "SEO Health", value: "92", tone: "bg-emerald-50 text-emerald-700" },
              { label: "Fix-now issues", value: "14", tone: "bg-amber-50 text-amber-700" },
              { label: "Impact potential", value: "+28%", tone: "bg-purple-50 text-purple-700" }
            ].map((item) => (
              <div key={item.label} className="rp-kpi-card rounded-2xl border border-[var(--rp-border)] bg-white p-3 shadow-sm">
                <div className="text-[11px] font-semibold text-[var(--rp-text-500)]">{item.label}</div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${item.tone}`}>{item.value}</span>
                  <span className="text-[10px] text-[var(--rp-text-500)]">Last 30 days</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-[var(--rp-border)] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[var(--rp-text-500)]">
                <span>Score trend</span>
                <span className="rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-2 py-1">Last 7 audits</span>
              </div>
              <div className="mt-3 text-sm font-semibold text-[var(--rp-text-900)]">SEO score + visibility lift</div>
              <svg viewBox="0 0 300 120" className="mt-4 h-28 w-full" aria-label="Score trend chart">
                <defs>
                  <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  stroke="url(#trendLine)"
                  strokeWidth="4"
                  points="10,90 50,80 90,86 130,60 170,68 210,48 250,52 290,36"
                />
                <polyline
                  fill="url(#trendLine)"
                  opacity="0.12"
                  points="10,110 10,90 50,80 90,86 130,60 170,68 210,48 250,52 290,36 290,110"
                />
              </svg>
              <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                Trend reflects improvements after fixing top-priority issues.
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--rp-border)] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold text-[var(--rp-text-500)]">Priority queue</div>
              <div className="mt-3 space-y-2 text-sm text-[var(--rp-text-700)]">
                {[
                  "Missing H1 on homepage",
                  "Compress hero PNG assets",
                  "Fix 12 redirect chains",
                  "Improve LCP on pricing page"
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-[var(--rp-orange-500)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--rp-border)] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold text-[var(--rp-text-500)]">Fix impact panel</div>
                <div className="mt-2 text-lg font-semibold text-[var(--rp-text-900)]">Estimated impact after top 3 fixes</div>
                <p className="mt-2 text-sm text-[var(--rp-text-600)]">
                  Prioritize the items below to unlock faster rankings and conversions.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-4 py-3 text-sm font-semibold text-[var(--rp-text-700)]">
                Potential uplift: +1,240 visits/mo
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                { label: "Core Web Vitals", value: "High", tone: "text-rose-600" },
                { label: "On-page gaps", value: "Medium", tone: "text-amber-600" },
                { label: "Internal linking", value: "Quick win", tone: "text-emerald-600" }
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[var(--rp-border)] bg-white p-4">
                  <div className="text-xs text-[var(--rp-text-500)]">{item.label}</div>
                  <div className={`mt-2 text-sm font-semibold ${item.tone}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
