import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { IconArrowRight, IconLink } from "../components/Icons.jsx";
import { getAnonId } from "../utils/anonId.js";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";
import ApexSemiDonutScore from "../components/charts/ApexSemiDonutScore.jsx";
import ApexMetricBars from "../components/charts/ApexMetricBars.jsx";
import { Link } from "react-router-dom";

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
  const [setupStatus, setSetupStatus] = useState("");
  const [recentLeads, setRecentLeads] = useState([]);
  const [leadsStatus, setLeadsStatus] = useState("idle");
  const [metrics, setMetrics] = useState({ sent: 0, failed: 0, total: 0, successRate: 0 });
  const [snippetInstalled, setSnippetInstalled] = useState(false);

  const sent = Number(metrics.sent || 0);
  const failed = Number(metrics.failed || 0);
  const totalDeliveries = sent + failed;
  const successRate = totalDeliveries > 0 ? Math.round((sent / totalDeliveries) * 100) : 0;
  const failureRate = totalDeliveries > 0 ? Math.max(0, 100 - successRate) : 0;
  const leadTotal = Number(metrics.total || 0) > 0 ? Number(metrics.total || 0) : recentLeads.length;

  useEffect(() => {
    let active = true;
    const loadMetrics = async () => {
      if (!anonId) return;
      let data = null;
      try {
        const res = await fetch(apiUrl("/api/embed/webhook-metrics"), {
          headers: { "x-rp-anon-id": anonId }
        });
        data = await safeJson(res);
      } catch {}
      if (!active) return;
      if (data?.metrics) setMetrics(data.metrics);
    };
    loadMetrics();
    return () => {
      active = false;
    };
  }, [anonId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#setup") return;
    const el = document.getElementById("setup");
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `rp_embed_snippet_installed_${anonId}`;
    setSnippetInstalled(localStorage.getItem(key) === "1");
  }, [anonId]);

  useEffect(() => {
    let active = true;
    const loadRecentLeads = async () => {
      if (!anonId) return;
      setLeadsStatus("loading");
      try {
        const res = await fetch(apiUrl("/api/embed/leads"), {
          headers: { "x-rp-anon-id": anonId }
        });
        const data = await safeJson(res);
        if (!active) return;
        if (res.ok && data?.ok && Array.isArray(data.leads)) {
          setRecentLeads(data.leads.slice(0, 5));
          setLeadsStatus("success");
          return;
        }
        setRecentLeads([]);
        setLeadsStatus("error");
      } catch {
        if (!active) return;
        setRecentLeads([]);
        setLeadsStatus("error");
      }
    };
    loadRecentLeads();
    return () => {
      active = false;
    };
  }, [anonId, setupStatus]);

  async function sendTestLead() {
    setSetupStatus("Creating test lead...");
    try {
      const res = await fetch(apiUrl("/api/embed/lead"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: anonId,
          url: "https://example.com/pricing",
          email: `widget-test+${Date.now()}@example.com`,
          name: "Widget Test Lead"
        })
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to create test lead.");
      setSetupStatus("Test lead created. Open Leads Inbox to verify.");
      setTimeout(() => setSetupStatus(""), 2500);
    } catch (e) {
      setSetupStatus(String(e?.message || "Failed to create test lead."));
      setTimeout(() => setSetupStatus(""), 2500);
    }
  }

  const testLeadReceived = recentLeads.some((lead) => {
    const email = String(lead?.email || "").toLowerCase();
    const name = String(lead?.name || "").toLowerCase();
    return email.includes("widget-test+") || name.includes("widget test lead");
  });
  const leadsInboxConnected = leadsStatus === "success";
  const verificationChecks = [
    { key: "snippet", label: "Snippet installed", ok: snippetInstalled },
    { key: "test", label: "Test lead received", ok: testLeadReceived },
    { key: "inbox", label: "Leads inbox connected", ok: leadsInboxConnected }
  ];

  return (
    <AppShell
      title="Embeddable Audit Widget"
      subtitle="Capture SEO audit leads directly on your site. Setup in minutes, test instantly, and push leads to your sales workflow."
      seoTitle="Embeddable Audit Widget | RankyPulse"
      seoDescription="Capture leads on your site with a lightweight audit form."
      seoCanonical={`${base}/embed`}
      seoRobots="noindex,nofollow"
    >
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        {[
          { label: "Webhook sent", value: sent, tone: "text-[var(--rp-indigo-700)]" },
          { label: "Failures", value: failed, tone: "text-rose-600" },
          { label: "Success rate", value: `${successRate}%`, tone: "text-emerald-600" },
          { label: "Total leads", value: leadTotal, tone: "text-[var(--rp-text-900)]" }
        ].map((item) => (
          <div key={item.label} className="rp-kpi-card rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
            <div className="text-xs text-[var(--rp-text-500)]">{item.label}</div>
            <div className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>
      <div className="mb-4 rp-card border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
        <div className="text-sm font-semibold text-[var(--rp-text-900)]">Quick setup flow</div>
        <div className="mt-2 grid gap-2 text-xs text-[var(--rp-text-600)] md:grid-cols-3">
          <div className="rounded-xl border border-[var(--rp-border)] bg-white p-3">1. Set your brand + theme + destination webhook.</div>
          <div className="rounded-xl border border-[var(--rp-border)] bg-white p-3">2. Copy snippet and place it on your pricing or contact page.</div>
          <div className="rounded-xl border border-[var(--rp-border)] bg-white p-3">3. Send a test lead and confirm capture in Leads Inbox.</div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {verificationChecks.map((item) => (
            <span
              key={item.key}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                item.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-[var(--rp-border)] bg-white text-[var(--rp-text-500)]"
              ].join(" ")}
              title={item.ok ? "Verified" : "Pending"}
            >
              <span className={["h-1.5 w-1.5 rounded-full", item.ok ? "bg-emerald-500" : "bg-[var(--rp-text-400)]"].join(" ")} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div id="setup" className="rp-card p-6">
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
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rp-btn-secondary text-xs"
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
              <button className="rp-btn-secondary text-xs" onClick={sendTestLead}>Send test lead</button>
              <a className="rp-btn-secondary text-xs" href={embedUrl} target="_blank" rel="noreferrer">Open form</a>
              <Link to="/leads" className="rp-btn-secondary text-xs">Open Leads Inbox</Link>
            </div>
            {webhookStatus && (
              <div className="mt-2 text-xs text-[var(--rp-text-500)]">{webhookStatus}</div>
            )}
            {setupStatus ? <div className="mt-1 text-xs text-[var(--rp-text-500)]">{setupStatus}</div> : null}
          </div>
          <div className="mt-4 text-xs text-[var(--rp-text-500)]">
            The form posts to RankyPulse and forwards to your webhook if provided.
          </div>
          <div className="mt-6 rounded-2xl border border-[var(--rp-border)] bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--rp-text-500)]">Recent captured leads</div>
              <div className="text-xs text-[var(--rp-text-500)]">
                Delivery success: <span className="font-semibold text-[var(--rp-text-700)]">{successRate}%</span>
              </div>
              <button
                className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs"
                onClick={async () => {
                  setLeadsStatus("loading");
                  const res = await fetch(apiUrl("/api/embed/leads"), {
                    headers: anonId ? { "x-rp-anon-id": anonId } : {}
                  });
                  const data = await safeJson(res);
                  setRecentLeads(Array.isArray(data?.leads) ? data.leads.slice(0, 5) : []);
                  setLeadsStatus("success");
                }}
              >
                Refresh
              </button>
            </div>
            {leadsStatus === "loading" && (
              <div className="mt-2 text-xs text-[var(--rp-text-500)]">Loading recent leads…</div>
            )}
            {leadsStatus !== "loading" && recentLeads.length === 0 && (
              <div className="mt-2 text-xs text-[var(--rp-text-500)]">No leads captured yet. Use “Send test lead” to validate your setup.</div>
            )}
            {recentLeads.length > 0 && (
              <div className="mt-3 space-y-2 text-xs text-[var(--rp-text-600)]">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                    <div className="flex items-center justify-between">
                      <div className="truncate font-medium text-[var(--rp-text-700)]">{lead.email || "Lead"}</div>
                      <span className="rp-chip rp-chip-neutral capitalize">{lead.status || "new"}</span>
                    </div>
                    <div className="mt-1 truncate">{lead.url || "-"}</div>
                    <div className="mt-1 text-[var(--rp-text-500)]">{lead.created_at ? new Date(lead.created_at).toLocaleString() : "-"}</div>
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
                  { label: "Success rate", value: successRate },
                  {
                    label: "Failure rate",
                    value: failureRate
                  },
                  {
                    label: "Delivery volume",
                    value: Math.min(100, Math.round((leadTotal / Math.max(1, leadTotal + 10)) * 100))
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
          <div className="mt-2 text-xs text-[var(--rp-text-500)]">If preview is blocked by browser policy, use “Open form” from setup actions.</div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
            <IconLink size={12} />
            Leads go to your webhook + RankyPulse monitoring.
          </div>
          <button
            className="rp-btn-primary mt-4 w-full text-sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(iframeSnippet);
                if (typeof window !== "undefined") {
                  localStorage.setItem(`rp_embed_snippet_installed_${anonId}`, "1");
                }
                setSnippetInstalled(true);
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
