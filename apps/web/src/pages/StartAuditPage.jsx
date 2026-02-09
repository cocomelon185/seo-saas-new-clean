import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { track } from "../lib/eventsClient.js";
import { IconPlay } from "../components/Icons.jsx";
import DeferredRender from "../components/DeferredRender.jsx";

const StartAuditExtras = lazy(() => import("../components/StartAuditExtras.jsx"));

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
    <main className="rp-page rp-premium-bg flex items-center justify-center px-4" role="main">
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
            <p className="text-xs text-center">
              <a className="text-[var(--rp-indigo-700)] hover:underline" href="/shared">
                View a sample results report
              </a>
            </p>
          </form>

          <DeferredRender>
            <Suspense fallback={null}>
              <StartAuditExtras />
            </Suspense>
          </DeferredRender>
        </div>
      </div>
    </main>
  );
}
