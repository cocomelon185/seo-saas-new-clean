import { useEffect, useMemo, useState } from "react";
import { IconBolt, IconReport, IconShield, IconCompass, IconArrowRight, IconClock, IconPlay } from "./Icons.jsx";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";

  function bucketLabel(p) {
    if (p === "fix_now") return "Fix now";
    if (p === "fix_next") return "Fix next";
    return "Fix later";
  }

function bucketIcon(p) {
  if (p === "fix_now") return <IconBolt size={12} />;
  if (p === "fix_next") return <IconReport size={12} />;
  return <IconShield size={12} />;
}

function bucketClass(p) {
  if (p === "fix_now") return "bg-rose-100 text-rose-700 border-rose-200";
  if (p === "fix_next") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function sevClass(sev) {
  if (sev === "High") return "bg-rose-100 text-rose-700 border-rose-200";
  if (sev === "Medium") return "bg-amber-100 text-amber-700 border-amber-200";
  if (sev === "Low") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function roiTag(issue) {
  const id = String(issue?.issue_id || "").toLowerCase();
  const title = String(issue?.title || "").toLowerCase();
  const key = `${id} ${title}`;
  if (key.includes("meta") || key.includes("title") || key.includes("h1") || key.includes("canonical") || key.includes("alt")) {
    return { label: "Low effort · High ROI", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  }
  if (key.includes("broken") || key.includes("links")) {
    return { label: "Medium effort · Solid ROI", cls: "bg-cyan-100 text-cyan-700 border-cyan-200" };
  }
  if (key.includes("word count") || key.includes("content") || key.includes("speed") || key.includes("performance")) {
    return { label: "Strategic play", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  }
  return { label: "Quick win", cls: "bg-slate-100 text-slate-700 border-slate-200" };
}

const ISSUE_GUIDE = {
  missing_meta_description: {
    title: "Missing meta description",
    why: "Search engines use this snippet under your title. Without it, you lose control of the preview.",
    fix: "Write a 150-160 character summary that explains the page and includes a key phrase."
  },
  missing_h1: {
    title: "Missing H1 heading",
    why: "The H1 tells visitors and Google the main topic of the page.",
    fix: "Add one clear H1 near the top that matches the page intent."
  },
  missing_title: {
    title: "Missing page title",
    why: "The page title is what appears in search results and browser tabs.",
    fix: "Add a concise title that names the page and its value."
  },
  title_too_long: {
    title: "Title is too long",
    why: "Long titles get cut off in search results, reducing clarity.",
    fix: "Keep the title under 60 characters and lead with the main keyword."
  },
  no_canonical: {
    title: "Missing canonical URL",
    why: "Canonical tags tell search engines which URL is the main version.",
    fix: "Add a canonical tag pointing to the preferred URL."
  },
  low_word_count: {
    title: "Low word count",
    why: "Thin content makes it harder to rank for relevant queries.",
    fix: "Add helpful detail: benefits, FAQs, and proof points."
  },
  missing_alt: {
    title: "Images missing alt text",
    why: "Alt text improves accessibility and helps search engines understand images.",
    fix: "Add short, descriptive alt text for key images."
  },
  broken_links: {
    title: "Broken links found",
    why: "Broken links frustrate users and can hurt crawlability.",
    fix: "Update or remove links that return errors."
  }
};

function norm(s) {
  return String(s || "").trim();
}

function asArray(x) {
  if (Array.isArray(x)) return x.filter(Boolean).map(String);
  if (!x) return [];
  return [String(x)];
}

function matchesSearch(issue, q) {
  const needle = norm(q).toLowerCase();
  if (!needle) return true;

  const parts = [];
  parts.push(issue?.title);
  parts.push(issue?.issue_id);
  parts.push(issue?.priority);
  parts.push(issue?.severity);
  parts.push(asArray(issue?.impact).join(" "));
  parts.push(issue?.why);
  parts.push(issue?.example_fix);

  const ev = issue?.evidence;
  if (ev && typeof ev === "object") {
    try {
      parts.push(JSON.stringify(ev));
    } catch {}
  }

  const hay = parts.filter(Boolean).join(" ").toLowerCase();
  return hay.includes(needle);
}

function buildSummaryText(allIssues, shownIssues) {
  const cAll = allIssues?.counts || null;
  const highAll = Array.isArray(allIssues?.issues)
    ? allIssues.issues.filter((x) => x?.severity === "High").length
    : 0;

  const totalAll =
    cAll && typeof cAll.total === "number"
      ? cAll.total
      : Array.isArray(allIssues?.issues)
      ? allIssues.issues.length
      : 0;

  const score = typeof allIssues?.score === "number" ? allIssues.score : null;

  const lines = [];
  lines.push(`RankyPulse Audit Summary`);
  if (score !== null) lines.push(`Score: ${score}`);
  lines.push(`Total issues: ${totalAll}`);
  if (cAll) {
    lines.push(`Fix now: ${cAll.fix_now ?? 0}`);
    lines.push(`Fix next: ${cAll.fix_next ?? 0}`);
    lines.push(`Fix later: ${cAll.fix_later ?? 0}`);
  }
  lines.push(`High severity: ${highAll}`);
  lines.push("");
  lines.push("Top issues shown (filtered):");
  for (const it of shownIssues.slice(0, 12)) {
    const p = bucketLabel(it?.priority);
    const sev = it?.severity ? ` - ${it.severity}` : "";
    const imp = asArray(it?.impact);
    const impTxt = imp.length ? ` - ${imp.join(", ")}` : "";
    lines.push(`- ${it?.title || it?.issue_id || "Issue"} (${p}${sev}${impTxt})`);
  }
  return lines.join("\n");
}

function toTitleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function humanIssue(issue) {
  const id = String(issue?.issue_id || "").trim();
  if (id && ISSUE_GUIDE[id]) return ISSUE_GUIDE[id];
  const title = issue?.title || toTitleCase(id || "Issue");
  return {
    title,
    why: String(issue?.why || "").trim(),
    fix: String(issue?.example_fix || "").trim()
  };
}

function evidenceSummary(evidence) {
  if (!evidence || typeof evidence !== "object") return [];
  const lines = [];
  if (evidence.final_url) lines.push(`Final URL: ${evidence.final_url}`);
  if (evidence.status) lines.push(`HTTP status: ${evidence.status}`);
  if (evidence.title) lines.push(`Title: ${evidence.title}`);
  if (evidence.h1) lines.push(`H1: ${evidence.h1}`);
  if (evidence.canonical) lines.push(`Canonical: ${evidence.canonical}`);
  if (typeof evidence.word_count === "number") lines.push(`Word count: ${evidence.word_count}`);
  if (typeof evidence.internal_links_count === "number" || typeof evidence.external_links_count === "number") {
    lines.push(`Links: internal ${evidence.internal_links_count ?? 0}, external ${evidence.external_links_count ?? 0}`);
  }
  return lines;
}

function readQuery() {
  try {
    const sp = new URLSearchParams(window.location.search || "");
    return {
      p: sp.get("p") || "all",
      sev: sp.get("sev") || "all",
      impact: sp.get("impact") || "all",
      q: sp.get("q") || "",
    };
  } catch {
    return { p: "all", sev: "all", impact: "all", q: "" };
  }
}

function writeQuery(next) {
  try {
    const sp = new URLSearchParams(window.location.search || "");
    if (next.p && next.p !== "all") sp.set("p", next.p); else sp.delete("p");
    if (next.sev && next.sev !== "all") sp.set("sev", next.sev); else sp.delete("sev");
    if (next.impact && next.impact !== "all") sp.set("impact", next.impact); else sp.delete("impact");
    if (next.q && String(next.q).trim()) sp.set("q", String(next.q).trim()); else sp.delete("q");
    const qs = sp.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  } catch {}
}

export default function IssuesPanel({ issues: rawIssues = [], advanced = false, fixWebhookUrl = "", wpWebhookUrl = "", shopifyWebhookUrl = "", finalUrl = "", ownerId = "" }) {
  const init = useMemo(() => readQuery(), []);
  const [q, setQ] = useState(init.q);
  const [priority, setPriority] = useState(init.p);
  const [severity, setSeverity] = useState(init.sev);
  const [impact, setImpact] = useState(init.impact);
  const [aiFixes, setAiFixes] = useState({});
  const [aiStatus, setAiStatus] = useState({});
  const [toast, setToast] = useState("");
  const [lastPushed, setLastPushed] = useState({});

  useEffect(() => {
    const onPop = () => {
      const v = readQuery();
      setPriority(v.p);
      setSeverity(v.sev);
      setImpact(v.impact);
      setQ(v.q);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    writeQuery({ p: priority, sev: severity, impact, q });
  }, [priority, severity, impact, q]);

  const impactOptions = useMemo(() => {
    const set = new Set();
    for (const it of rawIssues || []) for (const tag of asArray(it?.impact)) set.add(tag);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rawIssues]);

  const filtered = useMemo(() => {
    const out = [];
    for (const it of rawIssues || []) {
      if (priority !== "all" && String(it?.priority || "") !== priority) continue;
      if (severity !== "all" && String(it?.severity || "") !== severity) continue;
      if (impact !== "all") {
        const tags = asArray(it?.impact);
        if (!tags.includes(impact)) continue;
      }
      if (!matchesSearch(it, q)) continue;
      out.push(it);
    }
    return out;
  }, [rawIssues, q, priority, severity, impact]);

  const summary = useMemo(() => {
    const out = { fix_now: 0, fix_next: 0, fix_later: 0, high_sev: 0 };
    for (const it of filtered) {
      if (it?.priority === "fix_now") out.fix_now += 1;
      else if (it?.priority === "fix_next") out.fix_next += 1;
      else out.fix_later += 1;
      if (it?.severity === "High") out.high_sev += 1;
    }
    return out;
  }, [filtered]);

  const nextActions = useMemo(() => {
    const important = filtered.filter((it) => it?.priority === "fix_now" || it?.severity === "High");
    const byImpact = {};
    for (const it of important) {
      for (const tag of asArray(it?.impact)) {
        byImpact[tag] = (byImpact[tag] || 0) + 1;
      }
    }
    return Object.entries(byImpact)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([impactName, count]) => ({ impact: impactName, count }));
  }, [filtered]);

  const grouped = useMemo(() => {
    const order = ["fix_now", "fix_next", "fix_later"];
    const buckets = new Map(order.map((k) => [k, []]));
    for (const it of filtered) {
      const p = String(it?.priority || "fix_later");
      if (!buckets.has(p)) buckets.set(p, []);
      buckets.get(p).push(it);
    }
    return order.map((k) => ({ key: k, label: bucketLabel(k), items: buckets.get(k) || [] }));
  }, [filtered]);

  function supportsAIFix(issue) {
    const id = String(issue?.issue_id || "").toLowerCase();
    return [
      "missing_meta_description",
      "missing_title",
      "missing_h1",
      "title_too_long"
    ].includes(id);
  }

  async function generateFix(issue, key) {
    setAiStatus((prev) => ({ ...prev, [key]: "loading" }));
    try {
      const res = await fetch(apiUrl("/api/ai-fix"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_id: issue?.issue_id,
          title: issue?.title,
          evidence: issue?.evidence || {}
        })
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.fix) throw new Error(data?.error || "Failed to generate");
      setAiFixes((prev) => ({ ...prev, [key]: data.fix }));
      setAiStatus((prev) => ({ ...prev, [key]: "ready" }));
    } catch (e) {
      setAiStatus((prev) => ({ ...prev, [key]: "error" }));
    }
  }

  if (!rawIssues || rawIssues.length === 0) {
    return (
      <div className="mt-6 rp-card p-5">
        <div className="text-sm font-semibold text-[var(--rp-text-700)]">Issues</div>
        <div className="mt-2 text-sm text-[var(--rp-text-500)]">No issues yet. Run an audit.</div>
      </div>
    );
  }

  return (
    <div className="mt-6 rp-card p-5 rp-fade-in">
      {toast && (
        <div className={`mb-4 rounded-full border px-4 py-2 text-xs font-semibold ${toast.toLowerCase().includes("failed") ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {toast}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <div className="rp-section-title">Issues</div>
        <div className="text-xs text-[var(--rp-text-500)]">{filtered.length} shown - {rawIssues.length} total</div>
        <div className="hidden items-center gap-4 text-[11px] text-[var(--rp-text-500)] md:flex">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-400"></span>
            <span>High</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
            <span>Medium</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Low</span>
          </span>
          <span className="text-[var(--rp-text-400)]">Timeline color follows severity</span>
        </div>
        <details className="md:hidden text-[11px] text-[var(--rp-text-500)]">
          <summary className="cursor-pointer select-none text-[var(--rp-text-600)]">
            <span className="rp-chip rp-chip-neutral">Legend</span>
          </summary>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-rose-400"></span>
              <span>High</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
              <span>Medium</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>Low</span>
            </span>
          </div>
          <div className="mt-1 text-[var(--rp-text-400)]">Timeline color follows severity</div>
        </details>
        <div className="ml-auto flex flex-wrap items-center gap-4">
          <button
            className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
            disabled
            title="Export summary (coming soon)"
            type="button"
          >
              <IconArrowRight size={12} />
              Export summary
            </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rp-gray-50)] text-[var(--rp-text-500)]">
              <IconReport size={12} />
            </span>
            <input
              className="rp-input h-9 w-48 text-sm md:w-64"
              aria-label="Search issues"
              placeholder="Search issues"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rp-gray-50)] text-[var(--rp-text-500)]">
              <IconBolt size={12} />
            </span>
            <select
              className="rp-input h-9 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="all">All priorities</option>
              <option value="fix_now">Fix now</option>
              <option value="fix_next">Fix next</option>
              <option value="fix_later">Fix later</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rp-gray-50)] text-[var(--rp-text-500)]">
              <IconShield size={12} />
            </span>
            <select
              className="rp-input h-9 text-sm"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="all">All severities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rp-gray-50)] text-[var(--rp-text-500)]">
              <IconCompass size={12} />
            </span>
            <select
              className="rp-input h-9 text-sm"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
            >
              <option value="all">All impacts</option>
              {impactOptions.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <button
          type="button"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-left hover:bg-rose-100"
          onClick={() => { setPriority("fix_now"); setSeverity("all"); setImpact("all"); setQ(""); }}
        >
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-rose-700">
            <IconBolt size={12} />
            Fix now
          </div>
          <div className="mt-1 text-2xl font-bold text-rose-700">{summary.fix_now}</div>
        </button>

        <button
          type="button"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left hover:bg-amber-100"
          onClick={() => { setPriority("fix_next"); setSeverity("all"); setImpact("all"); setQ(""); }}
        >
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-amber-700">
            <IconReport size={12} />
            Fix next
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{summary.fix_next}</div>
        </button>

        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
          onClick={() => { setPriority("fix_later"); setSeverity("all"); setImpact("all"); setQ(""); }}
        >
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-700">
            <IconShield size={12} />
            Fix later
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-700">{summary.fix_later}</div>
        </button>

        <button
          type="button"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-left hover:bg-rose-100"
          onClick={() => { setSeverity("High"); setPriority("all"); setImpact("all"); setQ(""); }}
        >
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-rose-700">
            <IconPlay size={12} />
            High severity
          </div>
          <div className="mt-1 text-2xl font-bold text-rose-700">{summary.high_sev}</div>
        </button>
      </div>

      {nextActions.length > 0 && (
        <div className="mb-4 mt-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rp-section-title">Recommended next actions</div>
            <div className="text-xs text-[var(--rp-text-500)]">Click an action to filter</div>
            <div className="ml-auto">
              <button
                type="button"
                className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                disabled
                title="Export summary (coming soon)"
              >
                <IconArrowRight size={12} />
                Export summary
              </button>
            </div>
          </div>

          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-[var(--rp-text-600)]">
            {nextActions.map((x, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="font-semibold text-[var(--rp-indigo-700)] underline decoration-[var(--rp-indigo-700)]/30 underline-offset-2 hover:decoration-[var(--rp-indigo-700)]/60"
                  onClick={() => { setImpact(x.impact); setPriority("fix_now"); setSeverity("all"); setQ(""); }}
                  title={`Filter to impact: ${x.impact} (Fix now)`}
                >
                  Fix {x.count} {x.impact} issue{x.count > 1 ? "s" : ""}
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
              onClick={() => { setPriority("all"); setSeverity("all"); setImpact("all"); setQ(""); }}
            >
              <IconClock size={12} />
              Clear filters
            </button>

            <button
              type="button"
              className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
              onClick={async () => {
                const text = buildSummaryText({ issues: rawIssues, score: null, counts: null }, filtered);
                try { await navigator.clipboard.writeText(text); } catch {}
              }}
            >
              <IconArrowRight size={12} />
              Copy summary (text)
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-6">
        {grouped.map((g) => {
          if (!g.items.length) return null;
          return (
            <div key={g.key} className="rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold " + bucketClass(g.key)}>
                  {bucketIcon(g.key)}
                  {g.label}
                </span>
                <span className="text-xs text-[var(--rp-text-500)]">{g.items.length}</span>
              </div>

              <div className="mt-3 space-y-3">
                {g.items.map((issue, idx) => {
                  const evidence = (issue && issue.evidence && typeof issue.evidence === "object") ? issue.evidence : {};
                  const impacts = asArray(issue?.impact);
                  const sev = String(issue?.severity || "");
                  const human = humanIssue(issue);
                  const why = human.why;
                  const fix = human.fix;
                  const summary = evidenceSummary(evidence);

                  const timelineClass =
                    issue?.severity === "High"
                      ? "from-rose-400/70 border-rose-400/40 bg-rose-400/20"
                      : issue?.severity === "Medium"
                      ? "from-amber-400/70 border-amber-400/40 bg-amber-400/20"
                      : issue?.severity === "Low"
                      ? "from-emerald-400/70 border-emerald-400/40 bg-emerald-400/20"
                      : issue?.priority === "fix_now"
                      ? "from-rose-400/70 border-rose-400/40 bg-rose-400/20"
                      : issue?.priority === "fix_next"
                      ? "from-amber-400/70 border-amber-400/40 bg-amber-400/20"
                      : "from-emerald-400/70 border-emerald-400/40 bg-emerald-400/20";

                  return (
                    <div key={(issue.issue_id || "issue") + "-" + idx} className="relative rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm rp-card-hover">
                      <div className={`absolute left-2 top-4 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b ${timelineClass} via-transparent to-transparent`}></div>
                      <div className={`absolute left-1.5 top-5 h-3 w-3 rounded-full border ${timelineClass}`}></div>
                      <div className="flex flex-wrap items-center gap-2">
                        {issue?.priority && (
                          <button
                            type="button"
                            className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold hover:opacity-90 " + bucketClass(issue.priority)}
                            onClick={() => { setPriority(issue.priority); setSeverity("all"); setImpact("all"); }}
                            title={`Filter by priority: ${bucketLabel(issue.priority)}`}
                          >
                            {bucketIcon(issue.priority)}
                            {bucketLabel(issue.priority)}
                          </button>
                        )}

                        {sev && (
                          <button
                            type="button"
                            className={"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold hover:opacity-90 " + sevClass(sev)}
                            onClick={() => { setSeverity(sev); setPriority("all"); setImpact("all"); }}
                            title={`Filter by severity: ${sev}`}
                          >
                            {sev}
                          </button>
                        )}

                        <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold " + roiTag(issue).cls}>
                          {roiTag(issue).label}
                        </span>

                        {impacts.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className="rp-chip rp-chip-neutral inline-flex items-center gap-1"
                            onClick={() => { setImpact(t); setPriority("all"); setSeverity("all"); }}
                            title={`Filter by impact: ${t}`}
                          >
                            <IconCompass size={10} />
                            {t}
                          </button>
                        ))}

                        <div className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--rp-text-800)]">
                          {human.title}
                        </div>

                        {advanced && issue?.issue_id && (
                          <span className="text-xs text-[var(--rp-text-500)]">{issue.issue_id}</span>
                        )}
                      </div>

                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                          <div className="text-xs font-semibold text-[var(--rp-text-600)]">Why this matters</div>
                          <p className="mt-2 rp-body-small">
                            {why || "This issue can reduce clarity for visitors and search engines."}
                          </p>
                        </div>
                        <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                          <div className="text-xs font-semibold text-[var(--rp-text-600)]">How to fix it</div>
                          <p className="mt-2 rp-body-small">
                            {fix || "Make the page intent clear and add the missing element."}
                          </p>
                        </div>
                      </div>

                      {supportsAIFix(issue) && (
                        <div className="mt-3 rounded-xl border border-[var(--rp-border)] bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs font-semibold text-[var(--rp-text-600)]">AI fix assistant</div>
                            <div className="text-[11px] text-[var(--rp-text-400)]">Copy or push to your webhook</div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs"
                              disabled={aiStatus[(issue.issue_id || issue.title || idx)] === "loading"}
                              onClick={() => generateFix(issue, (issue.issue_id || issue.title || idx))}
                            >
                              {aiStatus[(issue.issue_id || issue.title || idx)] === "loading" ? "Generating…" : "Generate AI fix"}
                            </button>
                            <button
                              type="button"
                              className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs"
                              disabled={!aiFixes[(issue.issue_id || issue.title || idx)]}
                              onClick={async () => {
                                const text = aiFixes[(issue.issue_id || issue.title || idx)];
                                if (!text) return;
                                try { await navigator.clipboard.writeText(text); } catch {}
                              }}
                            >
                              Copy fix
                            </button>
                            <button
                              type="button"
                              className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs"
                              disabled={!aiFixes[(issue.issue_id || issue.title || idx)] || !fixWebhookUrl}
                              onClick={async () => {
                                const text = aiFixes[(issue.issue_id || issue.title || idx)];
                                if (!text || !fixWebhookUrl) return;
                                try {
                                  await fetch(fixWebhookUrl, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      issue_id: issue?.issue_id,
                                      title: issue?.title,
                                      fix: text,
                                      source: "rankypulse-ai-fix"
                                    })
                                  });
                                } catch {}
                              }}
                            >
                              Push to webhook
                            </button>
                            <button
                              type="button"
                              className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs"
                              disabled={!aiFixes[(issue.issue_id || issue.title || idx)] || !wpWebhookUrl || !finalUrl}
                              onClick={async () => {
                                const text = aiFixes[(issue.issue_id || issue.title || idx)];
                                if (!text || !wpWebhookUrl || !finalUrl) return;
                                try {
                                  const resp = await fetch(apiUrl("/api/wp/push-fix"), {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      ...(ownerId ? { "x-rp-anon-id": ownerId } : {})
                                    },
                                    body: JSON.stringify({
                                      url: finalUrl,
                                      issue_id: issue?.issue_id,
                                      title: issue?.title,
                                      fix: text
                                    })
                                  });
                                  const data = await safeJson(resp);
                                  if (!resp.ok || data?.ok === false) {
                                    setToast(`WP push failed: ${data?.error || "Request failed"}`);
                                  } else {
                                    setLastPushed((prev) => ({
                                      ...prev,
                                      [String(issue.issue_id || issue.title || idx)]: new Date().toISOString()
                                    }));
                                    setToast("Pushed to WordPress.");
                                  }
                                  setTimeout(() => setToast(""), 2500);
                                } catch {}
                              }}
                            >
                              Push to WordPress
                            </button>
                            <button
                              type="button"
                              className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs"
                              disabled={!aiFixes[(issue.issue_id || issue.title || idx)] || !shopifyWebhookUrl || !finalUrl}
                              onClick={async () => {
                                const text = aiFixes[(issue.issue_id || issue.title || idx)];
                                if (!text || !shopifyWebhookUrl || !finalUrl) return;
                                try {
                                  const resp = await fetch(apiUrl("/api/shopify/push-fix"), {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      ...(ownerId ? { "x-rp-anon-id": ownerId } : {})
                                    },
                                    body: JSON.stringify({
                                      url: finalUrl,
                                      issue_id: issue?.issue_id,
                                      title: issue?.title,
                                      fix: text
                                    })
                                  });
                                  const data = await safeJson(resp);
                                  if (!resp.ok || data?.ok === false) {
                                    setToast(`Shopify push failed: ${data?.error || "Request failed"}`);
                                  } else {
                                    setLastPushed((prev) => ({
                                      ...prev,
                                      [String(issue.issue_id || issue.title || idx)]: new Date().toISOString()
                                    }));
                                    setToast("Pushed to Shopify.");
                                  }
                                  setTimeout(() => setToast(""), 2500);
                                } catch {}
                              }}
                            >
                              Push to Shopify
                            </button>
                          </div>
                          {lastPushed[String(issue.issue_id || issue.title || idx)] && (
                            <div className="mt-2 text-[11px] text-[var(--rp-text-400)]">
                              Last pushed: {new Date(lastPushed[String(issue.issue_id || issue.title || idx)]).toLocaleString()}
                            </div>
                          )}
                          {aiFixes[(issue.issue_id || issue.title || idx)] && (
                            <div className="mt-3 rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3 text-xs text-[var(--rp-text-600)] whitespace-pre-wrap">
                              {aiFixes[(issue.issue_id || issue.title || idx)]}
                            </div>
                          )}
                          {aiStatus[(issue.issue_id || issue.title || idx)] === "error" && (
                            <div className="mt-2 text-xs text-rose-600">AI fix failed. Try again.</div>
                          )}
                        </div>
                      )}

                      {Object.keys(evidence).length > 0 && (
                        <div className="mt-3 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                          <div className="text-xs font-semibold text-[var(--rp-text-600)]">What we found</div>
                          {summary.length ? (
                            <ul className="mt-2 list-disc space-y-1 pl-5 rp-body-small">
                              {summary.map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 rp-body-small">We captured the page response details for this issue.</p>
                          )}
                          {advanced && (
                            <details className="mt-3 text-xs text-[var(--rp-text-500)]">
                              <summary className="cursor-pointer select-none text-[var(--rp-text-600)]">Show technical details</summary>
                              <pre className="mt-2 overflow-auto text-xs text-[var(--rp-text-600)]">{JSON.stringify(evidence, null, 2)}</pre>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
