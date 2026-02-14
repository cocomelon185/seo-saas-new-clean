import React from "react";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Separator } from "components/ui/separator";
import { getToken } from "../lib/api";

function authHeaders() {
  const t = getToken?.();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function tryRequest(candidates) {
  let lastErr;
  for (const c of candidates) {
    try {
      const res = await fetch(c.url, c.init);
      const ct = res.headers.get("content-type") || "";
      const body = ct.includes("application/json") ? await res.json() : await res.text();
      if (res.ok) return { ok: true, status: res.status, data: body, used: c.url };
      lastErr = { ok: false, status: res.status, data: body, used: c.url };
    } catch (e) {
      lastErr = { ok: false, error: String(e), used: c.url };
    }
  }
  return lastErr || { ok: false, error: "No candidates provided" };
}

function normalizeAudit(payload) {
  const p = payload?.audit || payload?.data || payload || {};

  const summary =
    p.summary ||
    {
      pagesCrawled: p.pagesCrawled ?? p.pages_crawled ?? 0,
      issuesFound: p.issuesFound ?? p.issues_found ?? 0,
      score: p.score ?? p.seoScore ?? p.seo_score ?? 0,
      lastScan: p.lastScan ?? p.last_scan ?? null,
    };

  let issues = p.issues || p.findings || p.problems || [];
  if (!Array.isArray(issues)) issues = [];

  issues = issues.map((it, idx) => ({
    id: it.id ?? idx + 1,
    type: it.type ?? it.category ?? "Issue",
    severity: it.severity ?? it.level ?? "medium",
    url: it.url ?? it.page ?? it.path ?? "",
    message: it.message ?? it.title ?? it.description ?? "",
    fix: it.fix ?? it.recommendation ?? "",
  }));

  const pages = p.pages || p.crawledPages || p.pagesCrawledList || [];
  const https = p.https || p.httpsReport || null;
  const cwv = p.cwv || p.coreWebVitals || null;

  return { summary, issues, pages, https, cwv };
}

const tones = {
  red: "bg-red-100 text-red-700 border-red-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  green: "bg-green-100 text-green-800 border-green-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

function Badge({ tone = "slate", children }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
}


function statusTone(code) {
  const n = Number(code || 0);
  if (n >= 200 && n < 300) return "green";
  if (n >= 300 && n < 400) return "amber";
  if (n >= 400) return "red";
  return "slate";
}

function shortText(x, maxLen) {
  const t = String(x || "");
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 1) + "…";
}

function hostPath(u) {
  try {
    const x = new URL(String(u || ""));
    return x.host + x.pathname;
  } catch {
    return String(u || "");
  }
}

function sevTone(sev) {
  const s = String(sev || "").toLowerCase();
  if (s.includes("high") || s.includes("critical") || s.includes("error")) return "red";
  if (s.includes("med") || s.includes("warn")) return "amber";
  if (s.includes("low") || s.includes("info") || s.includes("ok")) return "green";
  return "slate";
}


function SeverityBadge({ severity }) {
  const tone = sevTone(severity);
  const dot =
    tone === "red" ? "bg-red-500" :
    tone === "amber" ? "bg-amber-500" :
    tone === "green" ? "bg-emerald-500" :
    "bg-slate-400";

  const pill =
    tone === "red" ? "bg-red-50 text-red-700 border-red-200" :
    tone === "amber" ? "bg-amber-50 text-amber-800 border-amber-200" :
    tone === "green" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
    "bg-slate-50 text-slate-700 border-slate-200";

  const label = String(severity || "unknown");

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${pill}`}>
        {label}
      </span>
    </span>
  );
}

export default function Audit() {
  const q = encodeURIComponent(targetUrl.trim());

  const [tab, setTab] = React.useState("overview");

  const [sevFilter, setSevFilter] = React.useState("All");
    
  const [q, setQ] = React.useState("");
  const [targetUrl, setTargetUrl] = React.useState("https://example.com");
  const [loading, setLoading] = React.useState(false);
  const [lastUsedEndpoint, setLastUsedEndpoint] = React.useState("");
  const [error, setError] = React.useState("");
  const [audit, setAudit] = React.useState(() =>
    normalizeAudit({
      summary: { pagesCrawled: 0, issuesFound: 0, score: 0, lastScan: null },
      issues: [],
    })
  );


  
  const isDemo = Boolean(audit?.demo);
const visibleIssues = React.useMemo(() => {
    const list = audit?.issues || [];
    const qq = q.trim().toLowerCase();

    return list.filter((it) => {
      const sev = String(it?.severity || "").toLowerCase();
      const tone = sevTone(sev);

      const passSev =
        sevFilter === "All" ||
        (sevFilter === "High" && tone === "red") ||
        (sevFilter === "Medium" && tone === "amber") ||
        (sevFilter === "Low" && tone === "green");

      if (!qq) return passSev;

      const hay = `${it?.type || ""} ${it?.url || ""} ${it?.message || ""}`.toLowerCase();
      return passSev && hay.includes(qq);
    });
  }, [audit, sevFilter, q]);


  async function runAudit() {
    setLoading(true);
    setError("");

    const candidates = [
      { url: apiUrl(`/api/audit/run`), init: { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ url: targetUrl.trim() }) } },
      { url: apiUrl(`/api/site-audit/run`), init: { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ url: targetUrl.trim() }) } },
      { url: apiUrl(`/api/audit?url=${q}`), init: { method: "GET", headers: { ...authHeaders() } } },
      { url: apiUrl(`/api/site-audit?url=${q}`), init: { method: "GET", headers: { ...authHeaders() } } },
      { url: apiUrl(`/api/audit`), init: { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ url: targetUrl.trim() }) } },
    ];

    const r = await tryRequest(candidates);
    setLastUsedEndpoint(r?.used || "");
    if (!r?.ok) {
      const msg =
        r?.data?.error?.message ||
        r?.data?.message ||
        r?.data?.error ||
        r?.error ||
        `Request failed`;
      setError(`${msg}${r?.status ? ` (HTTP ${r.status})` : ""} ${r?.used ? `via ${r.used}` : ""}`.trim());
      setLoading(false);
      return;
    }

    const normalized = normalizeAudit(r.data);
    setAudit(normalized);
    setLoading(false);
    setTab("issues");
  }

  const summary = audit.summary || {};
  const issues = audit.issues || [];

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">Site Audit</div>
                <div className="text-sm text-slate-500">Run a crawl and review issues</div>
              </div>
              <div className="flex w-full gap-2 md:w-[520px]">
                <Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://your-site.com" />
                <Button onClick={runAudit} disabled={loading || !targetUrl.trim()}>
                  {loading ? "Running..." : "Run audit"}
                </Button>
            
<span className="ml-3 inline-flex items-center">
  {audit ? (
    <>
      <span
        title={isDemo ? "Demo data preview. Upgrade to run a live crawl." : "Live crawl of the website"}
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
          isDemo ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
        }`}
      >
        {isDemo ? "Demo Data" : "Live Audit"}
      </span>
      {isDemo ? (
        <a
          href="/upgrade"
          className="ml-3 text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
        >
          Upgrade to run live audits
        </a>
      ) : null}
    </>
  ) : null}
</span>


              </div>
            </div>
            {error ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            {lastUsedEndpoint ? (
              <div className="mt-2 text-xs text-slate-400">API: {lastUsedEndpoint}</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap gap-2 p-3">
            <Button variant={tab === "overview" ? "default" : "outline"} onClick={() => setTab("overview")}>Overview</Button>
            <Button variant={tab === "issues" ? "default" : "outline"} onClick={() => setTab("issues")}>Issues</Button>
            <Button variant={tab === "pages" ? "default" : "outline"} onClick={() => setTab("pages")}>Crawled Pages</Button>
            <Button variant={tab === "https" ? "default" : "outline"} onClick={() => setTab("https")}>HTTPS</Button>
            <Button variant={tab === "cwv" ? "default" : "outline"} onClick={() => setTab("cwv")}>Core Web Vitals</Button>
          </div>
          <Separator />
          <div className="p-4">
            {tab === "overview" ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Pages crawled</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">{summary.pagesCrawled ?? 0}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Issues found</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">{summary.issuesFound ?? issues.length}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">SEO score</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">{summary.score ?? 0}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Last scan</div>
                  <div className="mt-2 text-sm text-slate-700">{summary.lastScan ? String(summary.lastScan) : "—"}</div>
                </div>
              </div>
            ) : null}

            {tab === "issues" ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">Issues</div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search issues (type, URL, message)..."
                      className="w-full sm:max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                    <div className="flex flex-wrap gap-2">
                      {["All","High","Medium","Low"].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSevFilter(b)}
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            sevFilter===b ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">{issues.length} total</div>
                </div>
                <div className="overflow-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-2 text-xs font-semibold text-slate-500">Type</th>
                        <th className="px-4 py-2 text-xs font-semibold text-slate-500">Severity</th>
                        <th className="px-4 py-2 text-xs font-semibold text-slate-500">URL</th>
                        <th className="px-4 py-2 text-xs font-semibold text-slate-500">Message</th>
                        <th className="px-4 py-2 text-xs font-semibold text-slate-500">Fix</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.length === 0 ? (
                        <tr>
                          <td className="px-4 py-6 text-slate-500" colSpan={5}>
                            No issues yet. Run an audit.
                          </td>
                        </tr>
                      ) : (
                        visibleIssues.map((it) => (
                          <tr key={it.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-900">{it.type}</td>
                            <td className="px-4 py-3">
                              <SeverityBadge severity={it.severity} />
                            </td>
                            <td className="px-4 py-3 max-w-[320px] truncate text-slate-700">{it.url}</td>
                            <td className="px-4 py-3 max-w-[420px] truncate text-slate-700">{it.message}</td>
                            <td className="px-4 py-3 max-w-[420px] truncate text-slate-700">{it.fix}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {tab === "pages" ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">Crawled Pages</div>
                  <div className="text-xs text-slate-500">{(audit.pages || []).length} total</div>
                </div>
                <div className="overflow-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-2 text-xs font-semibold text-slate-500">Status</th>
                        <th className="px-4 py-2 text-xs font-semibold text-slate-500">URL</th>
                        <th className="px-4 py-2 text-xs font-semibold text-slate-500">Title</th>
                        <th className="px-4 py-2 text-xs font-semibold text-slate-500">Description</th>
                        <th className="px-4 py-2 text-xs font-semibold text-slate-500">Depth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(audit.pages || []).length === 0 ? (
                        <tr><td className="px-4 py-6 text-slate-500" colSpan={5}>No crawled pages yet. Run an audit.</td></tr>
                      ) : (
                        (audit.pages || []).map((pg, idx) => (
                          <tr key={pg?.url || idx} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 align-top">
                                      <Badge tone={statusTone(pg?.status)}>{pg?.status || "—"}</Badge>
                                    </td>

                                    <td className="px-4 py-3 max-w-[520px] align-top">
                                      <a
                                        className="block font-medium text-slate-900 hover:underline break-all"
                                        href={pg?.url || "#"}
                                        target="_blank"
                                        rel="noreferrer"
                                        title={pg?.url || ""}
                                      >
                                        {shortText(hostPath(pg?.url), 72)}
                                      </a>
                                      <div className="mt-1 text-xs text-slate-500">{shortText(pg?.url, 120)}</div>
                                    </td>

                                    <td className="px-4 py-3 max-w-[240px] truncate align-top text-slate-700">{pg?.title || "—"}</td>
                                    <td className="px-4 py-3 max-w-[420px] truncate align-top text-slate-700">{pg?.description || "—"}</td>

                                    <td className="px-4 py-3 align-top">
                                      <Badge tone="slate">depth {Number.isFinite(Number(pg?.depth)) ? pg.depth : 0}</Badge>
                                    </td>
                                  </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {tab === "https" ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">HTTPS enabled</div>
                  <div className="mt-2 text-sm text-slate-900">{audit.https ? String(!!audit.https.httpsEnabled) : "—"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Redirects to HTTPS</div>
                  <div className="mt-2 text-sm text-slate-900">{audit.https ? String(!!audit.https.redirectsToHttps) : "—"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">HSTS</div>
                  <div className="mt-2 text-sm text-slate-900">{audit.https ? String(!!audit.https.hsts) : "—"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">Mixed content</div>
                  <div className="mt-2 text-sm text-slate-900">{audit.https ? String(audit.https.mixedContentCount ?? 0) : "—"}</div>
                </div>
              </div>
            ) : null}

            {tab === "cwv" ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-sm font-semibold text-slate-900">Field data</div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div><div className="text-xs text-slate-500">LCP</div><div className="text-sm text-slate-900">{audit.cwv?.field?.lcp ?? "—"}</div></div>
                    <div><div className="text-xs text-slate-500">INP</div><div className="text-sm text-slate-900">{audit.cwv?.field?.inp ?? "—"}</div></div>
                    <div><div className="text-xs text-slate-500">CLS</div><div className="text-sm text-slate-900">{audit.cwv?.field?.cls ?? "—"}</div></div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-sm font-semibold text-slate-900">Lab data</div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div><div className="text-xs text-slate-500">LCP</div><div className="text-sm text-slate-900">{audit.cwv?.lab?.lcp ?? "—"}</div></div>
                    <div><div className="text-xs text-slate-500">INP</div><div className="text-sm text-slate-900">{audit.cwv?.lab?.inp ?? "—"}</div></div>
                    <div><div className="text-xs text-slate-500">CLS</div><div className="text-sm text-slate-900">{audit.cwv?.lab?.cls ?? "—"}</div></div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
