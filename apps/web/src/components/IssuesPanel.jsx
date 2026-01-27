import { useEffect, useMemo, useState } from "react";

function bucketLabel(p) {
  if (p === "fix_now") return "Fix now";
  if (p === "fix_next") return "Fix next";
  return "Fix later";
}

function bucketClass(p) {
  if (p === "fix_now") return "bg-red-50 text-red-700 border-red-200";
  if (p === "fix_next") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function sevClass(sev) {
  if (sev === "High") return "bg-red-50 text-red-700 border-red-200";
  if (sev === "Medium") return "bg-amber-50 text-amber-700 border-amber-200";
  if (sev === "Low") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

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
    const sev = it?.severity ? ` • ${it.severity}` : "";
    const imp = asArray(it?.impact);
    const impTxt = imp.length ? ` • ${imp.join(", ")}` : "";
    lines.push(`- ${it?.title || it?.issue_id || "Issue"} (${p}${sev}${impTxt})`);
  }
  return lines.join("\n");
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

export default function IssuesPanel({ issues: rawIssues = [] }) {
  const init = useMemo(() => readQuery(), []);
  const [q, setQ] = useState(init.q);
  const [priority, setPriority] = useState(init.p);
  const [severity, setSeverity] = useState(init.sev);
  const [impact, setImpact] = useState(init.impact);

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

  if (!rawIssues || rawIssues.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Issues</div>
        <div className="mt-2 text-sm text-slate-600">No issues yet. Run an audit.</div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm font-semibold text-slate-900">Issues</div>
        <div className="text-xs text-slate-500">{filtered.length} shown • {rawIssues.length} total</div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-400"
            disabled
            title="Export summary (coming soon)"
            type="button"
          >
            Export summary
          </button>

          <input
            className="h-9 w-64 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Search (title, id, evidence, etc.)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="all">All priorities</option>
            <option value="fix_now">Fix now</option>
            <option value="fix_next">Fix next</option>
            <option value="fix_later">Fix later</option>
          </select>

          <select
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="all">All severities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
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

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-left hover:bg-red-100"
          onClick={() => { setPriority("fix_now"); setSeverity("all"); setImpact("all"); setQ(""); }}
        >
          <div className="text-xs font-semibold text-red-700">Fix now</div>
          <div className="mt-1 text-2xl font-bold text-red-800">{summary.fix_now}</div>
        </button>

        <button
          type="button"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left hover:bg-amber-100"
          onClick={() => { setPriority("fix_next"); setSeverity("all"); setImpact("all"); setQ(""); }}
        >
          <div className="text-xs font-semibold text-amber-700">Fix next</div>
          <div className="mt-1 text-2xl font-bold text-amber-800">{summary.fix_next}</div>
        </button>

        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-slate-100"
          onClick={() => { setPriority("fix_later"); setSeverity("all"); setImpact("all"); setQ(""); }}
        >
          <div className="text-xs font-semibold text-slate-700">Fix later</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">{summary.fix_later}</div>
        </button>

        <button
          type="button"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-left hover:bg-red-100"
          onClick={() => { setSeverity("High"); setPriority("all"); setImpact("all"); setQ(""); }}
        >
          <div className="text-xs font-semibold text-red-700">High severity</div>
          <div className="mt-1 text-2xl font-bold text-red-800">{summary.high_sev}</div>
        </button>
      </div>

      {nextActions.length > 0 && (
        <div className="mb-4 mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">Recommended next actions</div>
            <div className="text-xs text-slate-500">Click an action to filter</div>
            <div className="ml-auto">
              <button
                type="button"
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-400"
                disabled
                title="Export summary (coming soon)"
              >
                Export summary
              </button>
            </div>
          </div>

          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
            {nextActions.map((x, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500"
                  onClick={() => { setImpact(x.impact); setPriority("fix_now"); setSeverity("all"); setQ(""); }}
                  title={`Filter to impact: ${x.impact} (Fix now)`}
                >
                  Fix {x.count} {x.impact} issue{x.count > 1 ? "s" : ""}
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              onClick={() => { setPriority("all"); setSeverity("all"); setImpact("all"); setQ(""); }}
            >
              Clear filters
            </button>

            <button
              type="button"
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              onClick={async () => {
                const text = buildSummaryText({ issues: rawIssues, score: null, counts: null }, filtered);
                try { await navigator.clipboard.writeText(text); } catch {}
              }}
            >
              Copy summary (text)
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-5">
        {grouped.map((g) => {
          if (!g.items.length) return null;
          return (
            <div key={g.key} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold " + bucketClass(g.key)}>
                  {g.label}
                </span>
                <span className="text-xs text-slate-600">{g.items.length}</span>
              </div>

              <div className="mt-3 space-y-3">
                {g.items.map((issue, idx) => {
                  const evidence = (issue && issue.evidence && typeof issue.evidence === "object") ? issue.evidence : {};
                  const impacts = asArray(issue?.impact);
                  const sev = String(issue?.severity || "");
                  const why = String(issue?.why || "");
                  const fix = String(issue?.example_fix || "");

                  return (
                    <div key={(issue.issue_id || "issue") + "-" + idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        {issue?.priority && (
                          <button
                            type="button"
                            className={"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold hover:opacity-90 " + bucketClass(issue.priority)}
                            onClick={() => { setPriority(issue.priority); setSeverity("all"); setImpact("all"); }}
                            title={`Filter by priority: ${bucketLabel(issue.priority)}`}
                          >
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

                        {impacts.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            onClick={() => { setImpact(t); setPriority("all"); setSeverity("all"); }}
                            title={`Filter by impact: ${t}`}
                          >
                            {t}
                          </button>
                        ))}

                        <div className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                          {issue?.title || issue?.issue_id || "Issue"}
                        </div>

                        {issue?.issue_id && (
                          <span className="text-xs text-slate-500">{issue.issue_id}</span>
                        )}
                      </div>

                      {why && <p className="mt-2 text-sm leading-6 text-slate-600">{why}</p>}

                      {fix && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="text-xs font-semibold text-slate-700">Example fix</div>
                          <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-slate-700">{fix}</pre>
                        </div>
                      )}

                      {Object.keys(evidence).length > 0 && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="text-xs font-semibold text-slate-700">Evidence</div>
                          <pre className="mt-2 overflow-auto text-xs text-slate-700">{JSON.stringify(evidence, null, 2)}</pre>
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
