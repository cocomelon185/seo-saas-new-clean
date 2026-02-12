import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { IconArrowRight, IconLink } from "../components/Icons.jsx";
import { getAnonId } from "../utils/anonId.js";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";
import ApexSemiDonutScore from "../components/charts/ApexSemiDonutScore.jsx";
import ApexMetricBars from "../components/charts/ApexMetricBars.jsx";

export default function EmbedWidgetPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const anonId = getAnonId();
  const [webhook, setWebhook] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [brand, setBrand] = useState("RankyPulse Audit");
  const [accentColor, setAccentColor] = useState("#FF642D");
  const [logoUrl, setLogoUrl] = useState("");
  const [theme, setTheme] = useState("light");
  const [notifyEmail, setNotifyEmail] = useState("");

  const embedUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = `${window.location.origin}/embed/form`;
    const params = new URLSearchParams();
    params.set("owner", anonId);
    if (brand.trim()) params.set("brand", brand.trim());
    if (webhook.trim()) params.set("webhook", webhook.trim());
    if (redirectUrl.trim()) params.set("redirect", redirectUrl.trim());
    if (accentColor.trim()) params.set("accent", accentColor.trim());
    if (theme.trim()) params.set("theme", theme.trim());
    if (logoUrl.trim()) params.set("logo", logoUrl.trim());
    if (notifyEmail.trim()) params.set("notify", notifyEmail.trim());
    return `${base}?${params.toString()}`;
  }, [anonId, webhook, redirectUrl, brand, accentColor, logoUrl, theme, notifyEmail]);

  const iframeSnippet = embedUrl
    ? `<iframe src="${embedUrl}" style="width:100%;max-width:420px;height:520px;border:0;border-radius:16px;overflow:hidden;" loading="lazy"></iframe>`
    : "";
  const [copied, setCopied] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState("");
  const [history, setHistory] = useState([]);
  const [historyStatus, setHistoryStatus] = useState("idle");
  const [metrics, setMetrics] = useState({ sent: 0, failed: 0, total: 0, successRate: 0 });

  useEffect(() => {
    let active = true;
    const loadMetrics = async () => {
      if (!anonId) return;
      const res = await fetch(apiUrl("/api/embed/webhook-metrics"), {
        headers: { "x-rp-anon-id": anonId }
      });
      const data = await safeJson(res);
      if (!active) return;
      if (data?.metrics) setMetrics(data.metrics);
    };
    loadMetrics();
    return () => {
      active = false;
    };
  }, [anonId]);

  return (
    <AppShell
      title="Embeddable Audit Widget"
      subtitle="Capture leads on your site with a lightweight audit form. Send leads to your webhook in real time."
      seoTitle="Embeddable Audit Widget | RankyPulse"
      seoDescription="Capture leads on your site with a lightweight audit form."
      seoCanonical={`${base}/embed`}
      seoRobots="noindex,nofollow"
    >
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        {[
          { label: "Webhook sent", value: metrics.sent ?? 0, tone: "text-[var(--rp-indigo-700)]" },
          { label: "Failures", value: metrics.failed ?? 0, tone: "text-rose-600" },
          { label: "Success rate", value: `${metrics.successRate ?? 0}%`, tone: "text-emerald-600" },
          { label: "Total leads", value: metrics.total ?? 0, tone: "text-[var(--rp-text-900)]" }
        ].map((item) => (
          <div key={item.label} className="rp-kpi-card rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
            <div className="text-xs text-[var(--rp-text-500)]">{item.label}</div>
            <div className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rp-card p-6">
          <div className="rp-section-title">Widget settings</div>
          <div className="mt-4 grid gap-4">
            <label className="block text-sm text-[var(--rp-text-600)]">
              Brand label
              <input
                className="rp-input mt-2"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="RankyPulse Audit"
              />
            </label>
            <label className="block text-sm text-[var(--rp-text-600)]">
              Accent color
              <input
                className="rp-input mt-2"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#FF642D"
              />
            </label>
            <label className="block text-sm text-[var(--rp-text-600)]">
              Widget theme
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { key: "light", label: "Light" },
                  { key: "soft", label: "Soft" },
                  { key: "minimal", label: "Minimal" }
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTheme(opt.key)}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      theme === opt.key
                        ? "border-[var(--rp-orange-500)]/40 bg-[rgba(255,100,45,0.12)] text-[var(--rp-indigo-900)]"
                        : "border-[var(--rp-border)] text-[var(--rp-text-600)]"
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </label>
            <label className="block text-sm text-[var(--rp-text-600)]">
              Logo URL (optional)
              <input
                className="rp-input mt-2"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://yourcdn.com/logo.png"
              />
            </label>
            <label className="block text-sm text-[var(--rp-text-600)]">
              Notification email (optional)
              <input
                className="rp-input mt-2"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </label>
            <label className="block text-sm text-[var(--rp-text-600)]">
              Webhook URL (optional)
              <input
                className="rp-input mt-2"
                value={webhook}
                onChange={(e) => setWebhook(e.target.value)}
                placeholder="https://hooks.zapier.com/..."
              />
            </label>
            <label className="block text-sm text-[var(--rp-text-600)]">
              Redirect after submit (optional)
              <input
                className="rp-input mt-2"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://rankypulse.com/audit"
              />
            </label>
          </div>
          <div className="mt-6 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
            <div className="text-xs text-[var(--rp-text-500)]">Embed snippet</div>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded-xl border border-[var(--rp-border)] bg-white p-3 text-xs text-[var(--rp-text-600)]">
{iframeSnippet}
            </pre>
            <button
              className="rp-btn-secondary mt-3 text-xs"
              onClick={async () => {
                if (!webhook.trim()) {
                  setWebhookStatus("Add a webhook URL first.");
                  return;
                }
                setWebhookStatus("Sending test...");
                const res = await fetch(apiUrl("/api/embed/test-webhook"), {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ owner_id: anonId, webhook: webhook.trim() })
                });
                const data = await safeJson(res);
                if (data?.ok) {
                  setWebhookStatus("Test delivered.");
                } else {
                  setWebhookStatus(data?.error || "Test failed.");
                }
                setTimeout(() => setWebhookStatus(""), 2500);
              }}
            >
              Test webhook
            </button>
            {webhookStatus && (
              <div className="mt-2 text-xs text-[var(--rp-text-500)]">{webhookStatus}</div>
            )}
          </div>
          <div className="mt-4 text-xs text-[var(--rp-text-500)]">
            The form posts to RankyPulse and forwards to your webhook if provided.
          </div>
          <div className="mt-6 rounded-2xl border border-[var(--rp-border)] bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--rp-text-500)]">Webhook retry history</div>
              <div className="text-xs text-[var(--rp-text-500)]">
                Delivery success: <span className="font-semibold text-[var(--rp-text-700)]">{metrics.successRate}%</span>
              </div>
              <button
                className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs"
                onClick={async () => {
                  setHistoryStatus("loading");
                  const res = await fetch(apiUrl("/api/embed/webhook-history"), {
                    headers: anonId ? { "x-rp-anon-id": anonId } : {}
                  });
                  const data = await safeJson(res);
                  setHistory(Array.isArray(data?.history) ? data.history : []);
                  setHistoryStatus("success");
                  const metricsRes = await fetch(apiUrl("/api/embed/webhook-metrics"), {
                    headers: anonId ? { "x-rp-anon-id": anonId } : {}
                  });
                  const metricsData = await safeJson(metricsRes);
                  if (metricsData?.metrics) setMetrics(metricsData.metrics);
                }}
              >
                Refresh
              </button>
            </div>
            {historyStatus === "loading" && (
              <div className="mt-2 text-xs text-[var(--rp-text-500)]">Loading history…</div>
            )}
            {historyStatus !== "loading" && history.length === 0 && (
              <div className="mt-2 text-xs text-[var(--rp-text-500)]">No retries queued.</div>
            )}
            {history.length > 0 && (
              <div className="mt-3 space-y-2 text-xs text-[var(--rp-text-600)]">
                {history.slice(0, 6).map((h) => (
                  <div key={h.id} className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                    <div className="flex items-center justify-between">
                      <div className="truncate">{h.webhook}</div>
                      <span className="rp-chip rp-chip-neutral">{h.status}</span>
                    </div>
                    <div className="mt-1">Attempts: {h.attempts} · Next: {h.next_attempt_at ? new Date(h.next_attempt_at).toLocaleString() : "—"}</div>
                    {h.last_error && <div className="mt-1 text-[var(--rp-text-500)]">Last error: {h.last_error}</div>}
                    <div className="mt-2">
                      <button
                        className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs"
                        onClick={async () => {
                          await fetch(apiUrl(`/api/embed/webhook-history/${h.id}/retry`), {
                            method: "POST",
                            headers: anonId ? { "x-rp-anon-id": anonId } : {}
                          });
                          setWebhookStatus("Retry scheduled.");
                          setTimeout(() => setWebhookStatus(""), 2000);
                        }}
                      >
                        Retry now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
            <div className="text-xs text-[var(--rp-text-500)]">Delivery success chart</div>
            <div className="mt-3 flex items-center gap-4">
              <div className="w-[120px]">
                <ApexSemiDonutScore value={metrics.successRate || 0} height={120} color="#22c55e" />
              </div>
              <div className="text-xs text-[var(--rp-text-600)] space-y-1">
                <div>Sent: <span className="font-semibold text-[var(--rp-text-800)]">{metrics.sent}</span></div>
                <div>Failed: <span className="font-semibold text-[var(--rp-text-800)]">{metrics.failed}</span></div>
                <div>Total: <span className="font-semibold text-[var(--rp-text-800)]">{metrics.total}</span></div>
              </div>
            </div>
            <div className="mt-3">
              <ApexMetricBars
                height={165}
                metrics={[
                  { label: "Success rate", value: metrics.successRate || 0 },
                  {
                    label: "Failure rate",
                    value: Math.max(0, 100 - Number(metrics.successRate || 0))
                  },
                  {
                    label: "Delivery volume",
                    value: Math.min(100, Math.round(((metrics.total || 0) / Math.max(1, (metrics.total || 0) + 10)) * 100))
                  }
                ]}
              />
            </div>
          </div>
        </div>

        <div className="rp-card p-6">
          <div className="rp-section-title">Live preview</div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
            <iframe
              title="Embed preview"
              src={embedUrl}
              style={{ width: "100%", height: 520, border: "0", borderRadius: "14px" }}
            />
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
            <IconLink size={12} />
            Leads go to your webhook + RankyPulse monitoring.
          </div>
          <button
            className="rp-btn-primary mt-4 w-full text-sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(iframeSnippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {}
            }}
          >
            <IconArrowRight size={14} />
            {copied ? "Copied" : "Copy snippet"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
