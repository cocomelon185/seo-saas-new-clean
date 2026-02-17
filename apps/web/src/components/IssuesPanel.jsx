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
    title: "No main page URL set",
    why: "Search engines may see copies of this page and split ranking power.",
    fix: "Set one main page URL (canonical) so search engines treat this as the main version."
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

function canonicalStatusText(evidence) {
  const canonical = String(evidence?.canonical || "").trim();
  if (!canonical) return "Not set yet";
  return canonical;
}

function httpStatusText(statusCode) {
  const code = Number(statusCode);
  if (!Number.isFinite(code)) return "Unknown";
  if (code >= 200 && code < 300) return `${code} (page loads successfully)`;
  if (code >= 300 && code < 400) return `${code} (redirect)`;
  if (code >= 400 && code < 500) return `${code} (page not found or blocked)`;
  if (code >= 500) return `${code} (server error)`;
  return String(code);
}

async function copyTextSafe(text) {
  const value = String(text || "");
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {}
  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "absolute";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return !!ok;
  } catch {
    return false;
  }
}

function fallbackAIFix(issue, finalUrl = "") {
  const human = humanIssue(issue);
  const simple = simpleFixGuide(issue);
  const id = String(issue?.issue_id || "").toLowerCase();
  const pageUrl = String(issue?.evidence?.final_url || finalUrl || "this page");
  const lines = [];
  lines.push(`Issue: ${human.title}`);
  lines.push(`Goal: ${simple.intro}`);
  lines.push(`Page: ${pageUrl}`);
  lines.push("");
  lines.push("Do this:");
  for (const step of simple.steps) lines.push(`- ${step}`);
  if (simple.snippet) {
    lines.push("");
    lines.push("Code to paste:");
    lines.push(simple.snippet);
  }
  if (id === "no_canonical" || id === "missing_canonical" || id === "missing_canonical_url") {
    lines.push("");
    lines.push("Quick check after update:");
    lines.push("- Re-run audit and confirm 'Main URL setting' is now filled.");
  }
  return lines.join("\n");
}

function simpleFixGuide(issue) {
  const id = String(issue?.issue_id || "").toLowerCase();
  const title = String(issue?.title || "this issue");
  const fallback = {
    intro: "Do these steps exactly. This is written in plain language.",
    steps: [
      "Open the page template where this problem appears.",
      "Add the missing element shown below.",
      "Save, publish, and run the audit again."
    ],
    snippet: ""
  };

  if (id === "missing_h1") {
    return {
      intro: "Add one main heading near the top of the page.",
      steps: [
        "Open your page editor.",
        "Near the top, add one H1 heading that says what the page is about.",
        "Use only one H1 on this page."
      ],
      snippet: "<h1>Affordable Car Leasing Deals in the UK</h1>"
    };
  }
  if (id === "missing_meta_description") {
    return {
      intro: "Add a short search summary so Google shows a better snippet.",
      steps: [
        "Open your page SEO settings.",
        "Paste a clear 140-160 character summary.",
        "Include the main keyword once."
      ],
      snippet: '<meta name="description" content="Get fast car leasing quotes, compare monthly offers, and choose the best personal or business deal in minutes." />'
    };
  }
  if (id === "missing_title" || id === "title_too_long") {
    return {
      intro: "Use a short, clear page title.",
      steps: [
        "Open your page title field.",
        "Keep it around 30-60 characters.",
        "Lead with your main topic."
      ],
      snippet: "<title>Car Leasing Deals | LingsCars UK</title>"
    };
  }
  if (id === "no_canonical") {
    return {
      intro: "Set one main URL so search engines know which page to rank.",
      steps: [
        "Open SEO settings for this page.",
        "Find the field named Canonical URL.",
        "Paste this page's main URL.",
        "Save and republish."
      ],
      snippet: '<link rel="canonical" href="https://www.example.com/your-main-page" />'
    };
  }
  if (id === "missing_alt") {
    return {
      intro: "Add image alt text so users and search engines understand the image.",
      steps: [
        "Open each important image.",
        "Write 5-10 words that describe what is in the image.",
        "Save changes."
      ],
      snippet: '<img src="/hero-car.jpg" alt="Blue SUV parked outside dealership" />'
    };
  }
  if (id === "broken_links") {
    return {
      intro: "Fix links that send users to missing pages.",
      steps: [
        "Open links listed in the issue details.",
        "Replace broken URLs with working pages.",
        "Remove links that are no longer needed."
      ],
      snippet: ""
    };
  }
  return {
    ...fallback,
    intro: `Fix this: ${title}. Keep the wording clear and simple for visitors.`,
  };
}

function safeUrl(value) {
  try {
    return new URL(String(value || ""));
  } catch {
    return null;
  }
}

function issueBusinessModel(issue, evidence, finalUrlValue) {
  const id = String(issue?.issue_id || "").toLowerCase();
  const priority = String(issue?.priority || "");
  const severity = String(issue?.severity || "");
  const finalUrl = String(evidence?.final_url || finalUrlValue || "").trim();
  const parsed = safeUrl(finalUrl);
  const basePath = parsed ? `${parsed.origin}${parsed.pathname}` : (finalUrl || "https://example.com/page");
  const utmPath = `${basePath}${basePath.includes("?") ? "&" : "?"}utm_source=newsletter`;
  const slashVariant = basePath.endsWith("/") ? basePath.slice(0, -1) : `${basePath}/`;

  const duplicateIds = new Set(["no_canonical", "missing_canonical", "missing_canonical_url", "canonical_missing"]);
  const rankingIds = new Set([
    "missing_h1",
    "missing_title",
    "title_too_long",
    "missing_meta_description",
    "broken_links",
    "http_status_error"
  ]);
  const boosterIds = new Set(["missing_alt", "low_word_count", "content_thin"]);

  let tierLabel = "Ranking Risk";
  let tierTone = "bg-rose-100 text-rose-700 border-rose-200";
  if (duplicateIds.has(id)) {
    tierLabel = "Duplicate Risk";
    tierTone = "bg-amber-100 text-amber-700 border-amber-200";
  } else if (boosterIds.has(id)) {
    tierLabel = "SEO Strength Booster";
    tierTone = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (!rankingIds.has(id) && severity === "Low") {
    tierLabel = "SEO Strength Booster";
    tierTone = "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  const severityBase =
    severity === "High" ? 85 :
    severity === "Medium" ? 60 :
    severity === "Low" ? 35 : 45;
  const priorityBoost =
    priority === "fix_now" ? 15 :
    priority === "fix_next" ? 8 :
    priority === "fix_later" ? 2 : 0;
  const tierBoost =
    tierLabel === "Ranking Risk" ? 12 :
    tierLabel === "Duplicate Risk" ? 10 :
    -8;
  const urgencyScore = Math.max(0, Math.min(100, severityBase + priorityBoost + tierBoost));

  const urgencyLabel =
    urgencyScore >= 85 ? "Critical urgency" :
    urgencyScore >= 70 ? "High urgency" :
    urgencyScore >= 50 ? "Medium urgency" :
    "Low urgency";
  const urgencyWindow =
    urgencyScore >= 85 ? "Fix today" :
    urgencyScore >= 70 ? "Fix in 48h" :
    urgencyScore >= 50 ? "Fix this week" :
    "Backlog";

  const model = {
    tierLabel,
    tierTone,
    impactLabel: tierLabel,
    impactTone: tierTone,
    businessRisk: "Potential ranking drag",
    urgency: `${urgencyLabel}: ${urgencyWindow}`,
    urgencyScore,
    urgencyLabel,
    urgencyWindow,
    expertDefault: "Search engines can treat multiple URL versions as different pages, which can split authority and weaken stable rankings.",
    beginnerAlt: "Search engines may get mixed signals about which URL is the real page.",
    bullets: [
      "Ranking strength can split across duplicate URLs.",
      "Search engines can spend time crawling duplicate pages.",
      "Backlink value may not combine into one strong page."
    ],
    beginnerBullets: [
      "Google may see similar links as separate pages.",
      "Your ranking power can get split.",
      "One clear main URL helps rankings stay stable."
    ],
    checks: [
      "Canonical URL points to this page's final URL.",
      "HTTP redirects to HTTPS.",
      "www and non-www versions go to one main domain.",
      "Sitemap URLs match the same main URLs."
    ],
    examples: [basePath, utmPath, slashVariant].filter(Boolean),
    aiInsight: "Template-level fix recommended so every page inherits consistent canonical behavior.",
    whyHappensExpert: "This usually happens when page templates do not enforce SEO defaults and publishing runs without a final SEO QA check.",
    whyHappensSimple: "This often happens when the website template does not auto-fill SEO settings."
  };

  if (id === "no_canonical" || id === "missing_canonical" || id === "missing_canonical_url") {
    model.impactLabel = "Duplicate Risk";
    model.impactTone = "bg-amber-100 text-amber-700 border-amber-200";
    model.businessRisk = "Authority dilution";
    model.expertDefault = "Without a canonical URL, search engines can index URL variants (for example path, trailing slash, and tracking-parameter forms) as separate documents, fragmenting link equity and weakening canonical signal consolidation.";
    model.beginnerAlt = "If you do not set one main URL, Google may treat similar links like different pages and split your ranking power.";
    model.beginnerBullets = [
      "Google can get confused by similar links.",
      "Your page can lose some ranking strength.",
      "Setting one main URL keeps signals in one place."
    ];
    model.whyHappensExpert = "CMS templates often leave canonical empty, and campaign links add URL variants that become indexable if canonical is missing.";
    model.whyHappensSimple = "Your site is making multiple versions of the same page URL, but no 'main URL' is set.";
    if (/\/o\//i.test(basePath)) {
      model.aiInsight = "This URL pattern looks CMS-driven. Apply a global canonical template so all pages stay consistent.";
    }
  } else if (id === "missing_h1") {
    model.impactLabel = "Ranking Risk";
    model.impactTone = "bg-rose-100 text-rose-700 border-rose-200";
    model.businessRisk = "Lower topical clarity";
    model.expertDefault = "Missing H1 weakens semantic relevance and can reduce confidence in page intent during indexing and ranking.";
    model.beginnerAlt = "Google may not clearly understand the main topic of this page.";
    model.bullets = [
      "Topic intent is less explicit to crawlers.",
      "Snippet relevance may weaken for target keywords.",
      "Visitors get less immediate page clarity."
    ];
    model.beginnerBullets = [
      "Google cannot quickly see your main topic.",
      "Visitors may feel less clear about the page.",
      "One clear H1 helps both users and search."
    ];
    model.aiInsight = "Set one reusable H1 pattern in your template so future pages ship with consistent topic structure.";
    model.whyHappensExpert = "Reusable page templates often skip semantic heading structure, leaving pages with visual headings but no true H1 node.";
    model.whyHappensSimple = "The page has text that looks like a heading, but it is not set as the main H1 heading.";
  }

  return model;
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

function flowSortWeight(issue) {
  const priority = String(issue?.priority || "");
  const severity = String(issue?.severity || "");
  if (priority === "fix_now") return 0;
  if (severity === "High") return 1;
  if (priority === "fix_next") return 2;
  if (severity === "Medium") return 3;
  return 4;
}

export default function IssuesPanel({
  issues: rawIssues = [],
  advanced = false,
  finalUrl = "",
  simplified = false,
  intent = "",
  intentIssueId = "",
  autoCopy = false,
  intentNonce = 0
}) {
  const init = useMemo(() => readQuery(), []);
  const [q, setQ] = useState(init.q);
  const [priority, setPriority] = useState(init.p);
  const [severity, setSeverity] = useState(init.sev);
  const [impact, setImpact] = useState(init.impact);
  const [aiFixes, setAiFixes] = useState({});
  const [aiStatus, setAiStatus] = useState({});
  const [toast, setToast] = useState("");
  const [issueView, setIssueView] = useState({});
  const [explainMode, setExplainMode] = useState({});
  const [whyOpen, setWhyOpen] = useState({});
  const [actionNote, setActionNote] = useState({});
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

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

  useEffect(() => {
    if (!intent || !intentNonce) return;
    if (!Array.isArray(rawIssues) || rawIssues.length === 0) return;

    const sorted = [...rawIssues].sort((a, b) => flowSortWeight(a) - flowSortWeight(b));
    let target = null;
    if (intentIssueId) {
      target = rawIssues.find((it) => String(it?.issue_id || "") === String(intentIssueId));
    }
    if (!target) target = sorted[0] || rawIssues[0];
    if (!target) return;

    const issueKey = String(target?.issue_id || target?.title || "");
    if (target?.priority) setPriority(String(target.priority));
    if (target?.issue_id) setQ(String(target.issue_id));
    setSeverity("all");
    setImpact("all");

    if (intent === "open_solution_mode") {
      setIssueView((prev) => ({ ...prev, [issueKey]: "fix" }));
      setActionNote((prev) => ({ ...prev, [issueKey]: "Viewing: Fix steps" }));
      if (autoCopy) {
        const simple = simpleFixGuide(target);
        const text = simple.snippet || `${simple.intro}\n- ${simple.steps.join("\n- ")}`;
        copyTextSafe(text).then((ok) => {
          setToast(ok ? "Solution copied." : "Copy blocked. Please allow clipboard access.");
          setTimeout(() => setToast(""), 1800);
        });
      }
    } else {
      setIssueView((prev) => ({ ...prev, [issueKey]: "issue" }));
    }

    setTimeout(() => {
      try {
        const safeKey = issueKey.replace(/"/g, '\\"');
        const el = document.querySelector(`[data-issue-key="${safeKey}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {}
    }, 40);
  }, [intent, intentNonce, intentIssueId, autoCopy, rawIssues]);

  async function exportSummary() {
    const text = buildSummaryText(
      {
        issues: rawIssues,
        score: null,
        counts: {
          fix_now: rawIssues.filter((x) => x?.priority === "fix_now").length,
          fix_next: rawIssues.filter((x) => x?.priority === "fix_next").length,
          fix_later: rawIssues.filter((x) => (x?.priority || "fix_later") === "fix_later").length,
          total: rawIssues.length
        }
      },
      filtered
    );

    try {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.href = href;
      a.download = `rankypulse-issues-summary-${stamp}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
      setToast("Summary exported.");
      setTimeout(() => setToast(""), 1800);
      return;
    } catch {}

    const ok = await copyTextSafe(text);
    setToast(ok ? "Summary copied." : "Export failed. Please try again.");
    setTimeout(() => setToast(""), 1800);
  }

  function tabBtnClass(isActive = false, isPrimary = false) {
    const base = "rp-btn-sm h-8 px-3 text-xs border shadow-sm transition !text-white";
    if (isPrimary || isActive) {
      return `${base} !border-violet-800 !bg-gradient-to-r !from-violet-700 !to-purple-600 !ring-2 !ring-fuchsia-300 !ring-offset-1`;
    }
    return `${base} !border-violet-800 !bg-gradient-to-r !from-violet-800 !to-violet-700 hover:brightness-110`;
  }

  function supportsAIFix(issue) {
    const id = String(issue?.issue_id || "").toLowerCase();
    return [
      "missing_meta_description",
      "missing_title",
      "missing_h1",
      "title_too_long",
      "no_canonical",
      "missing_canonical",
      "missing_canonical_url"
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
      return String(data.fix || "");
    } catch (e) {
      const localFix = fallbackAIFix(issue, finalUrl);
      setAiFixes((prev) => ({ ...prev, [key]: localFix }));
      setAiStatus((prev) => ({ ...prev, [key]: "ready" }));
      return localFix;
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
        {simplified ? (
          <button
            type="button"
            className="ml-auto rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
            onClick={() => setShowAdvancedControls((prev) => !prev)}
          >
            {showAdvancedControls ? "Hide advanced" : "Advanced controls"}
          </button>
        ) : null}
        {(!simplified || showAdvancedControls) && (
          <div className="ml-auto flex flex-wrap items-end gap-3 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-2">
          <button
            className="rp-btn-secondary rp-btn-sm h-10 px-3 text-xs"
            type="button"
            onClick={exportSummary}
          >
              <IconArrowRight size={12} />
              Export summary
            </button>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--rp-text-500)]">Search</label>
            <input
              className="rp-input h-10 w-48 py-0 text-sm leading-[1.25] md:w-64"
              aria-label="Search issues"
              placeholder="Search issues"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--rp-text-500)]">Priority</label>
            <select
              className="rp-input h-10 min-h-[40px] min-w-[170px] py-0 pr-10 text-sm leading-[1.25]"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="all">All priorities</option>
              <option value="fix_now">Fix now</option>
              <option value="fix_next">Fix next</option>
              <option value="fix_later">Fix later</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--rp-text-500)]">Severity</label>
            <select
              className="rp-input h-10 min-h-[40px] min-w-[170px] py-0 pr-10 text-sm leading-[1.25]"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="all">All severities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--rp-text-500)]">Impact</label>
            <select
              className="rp-input h-10 min-h-[40px] min-w-[170px] py-0 pr-10 text-sm leading-[1.25]"
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
        )}
      </div>

      {(!simplified || showAdvancedControls) && (
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
          <div className="mt-1 text-[11px] text-rose-700/80">Do these first</div>
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
          <div className="mt-1 text-[11px] text-amber-700/80">Good next wins</div>
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
          <div className="mt-1 text-[11px] text-slate-600">Lower urgency</div>
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
          <div className="mt-1 text-[11px] text-rose-700/80">Needs attention</div>
        </button>
      </div>
      )}

      {(!simplified || showAdvancedControls) && nextActions.length > 0 && (
        <div className="mb-4 mt-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rp-section-title">Recommended next actions</div>
            <div className="text-xs text-[var(--rp-text-500)]">Click an action to filter</div>
            <div className="ml-auto">
              <button
                type="button"
                className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                onClick={exportSummary}
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
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-sm text-[var(--rp-text-600)]">
            No issues match your search/filter. Try clearing filters.
          </div>
        ) : null}
        {grouped.map((g) => {
          if (!g.items.length) return null;
          return (
            <div key={g.key} className="space-y-3">
              {g.key !== "fix_later" ? (
                <div className="flex items-center gap-2">
                  <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold " + bucketClass(g.key)}>
                    {bucketIcon(g.key)}
                    {g.label}
                  </span>
                  <span className="text-xs text-[var(--rp-text-500)]">{g.items.length}</span>
                </div>
              ) : null}
              <div className="space-y-3">
                  {g.items.map((issue, idx) => {
                  const evidence = (issue && issue.evidence && typeof issue.evidence === "object") ? issue.evidence : {};
                  const impacts = asArray(issue?.impact);
                  const sev = String(issue?.severity || "");
                  const human = humanIssue(issue);
                  const why = human.why;
                  const fix = human.fix;
                  const issueKey = String(issue.issue_id || issue.title || idx);
                  const summary = evidenceSummary(evidence);
                  const simple = simpleFixGuide(issue);
                  const business = issueBusinessModel(issue, evidence, finalUrl);
                  const activeView = issueView[issueKey] || (simplified ? "issue" : "fix");
                  const explanationView = explainMode[issueKey] || "expert";
                  const isBeginnerView = explanationView === "simple";
                  const visualBullets = (isBeginnerView ? business.beginnerBullets : business.bullets) || business.bullets;
                  const visualHealth = Math.max(15, Math.min(90, 100 - Number(business.urgencyScore || 50)));
                  const canonicalNow = canonicalStatusText(evidence);
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
                    <div
                      key={(issue.issue_id || "issue") + "-" + idx}
                      data-issue-key={issueKey}
                      className="relative rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm rp-card-hover"
                    >
                      <div className={`absolute left-2 top-4 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b ${timelineClass} via-transparent to-transparent`}></div>
                      <div className={`absolute left-1.5 top-5 h-3 w-3 rounded-full border ${timelineClass}`}></div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(!simplified || showAdvancedControls) && issue?.priority && issue.priority !== "fix_later" && (
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

                        {(!simplified || showAdvancedControls) && sev && (
                          <button
                            type="button"
                            className={"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold hover:opacity-90 " + sevClass(sev)}
                            onClick={() => { setSeverity(sev); setPriority("all"); setImpact("all"); }}
                            title={`Filter by severity: ${sev}`}
                          >
                            {sev}
                          </button>
                        )}

                        <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold " + business.impactTone}>
                          {business.tierLabel}
                        </span>
                        {(!simplified || showAdvancedControls) ? (
                          <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold " + roiTag(issue).cls}>
                            {roiTag(issue).label}
                          </span>
                        ) : null}

                        {(!simplified || showAdvancedControls) && impacts.map((t) => (
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

                      <div className="mt-3 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-[var(--rp-text-600)]">Business impact and fix flow</div>
                          <div className="flex items-center gap-1 text-[11px] text-[var(--rp-text-500)]">
                            <span className="rounded-full bg-white px-2 py-0.5 border border-[var(--rp-border)]">1. See issue</span>
                            <IconArrowRight size={11} />
                            <span className="rounded-full bg-white px-2 py-0.5 border border-[var(--rp-border)]">2. Copy fix</span>
                            <IconArrowRight size={11} />
                            <span className="rounded-full bg-white px-2 py-0.5 border border-[var(--rp-border)]">3. Publish</span>
                          </div>
                        </div>
                        <div className="mt-2 grid gap-2 md:grid-cols-3">
                          <div className="rounded-lg border border-[var(--rp-border)] bg-white p-2">
                            <div className="text-[10px] uppercase tracking-wide text-[var(--rp-text-500)]">Business risk</div>
                            <div className="mt-1 text-xs font-semibold text-[var(--rp-text-800)]">{business.businessRisk}</div>
                          </div>
                          <div className="rounded-lg border border-[var(--rp-border)] bg-white p-2">
                            <div className="text-[10px] uppercase tracking-wide text-[var(--rp-text-500)]">Urgency</div>
                            <div className="mt-1 text-xs font-semibold text-[var(--rp-text-800)]">{business.urgency}</div>
                            <div className="mt-1 text-[11px] text-[var(--rp-text-500)]">
                              Urgency score: <span className="font-semibold text-[var(--rp-text-700)]">{business.urgencyScore}/100</span>
                            </div>
                          </div>
                          <div className="rounded-lg border border-[var(--rp-border)] bg-white p-2">
                            <div className="text-[10px] uppercase tracking-wide text-[var(--rp-text-500)]">AI insight</div>
                            <div className="mt-1 text-xs font-semibold text-[var(--rp-text-800)]">{business.aiInsight}</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {simplified ? (
                          <>
                            <button
                              type="button"
                              className={tabBtnClass(activeView === "fix", true)}
                              onClick={() => {
                                setIssueView((prev) => ({ ...prev, [issueKey]: "fix" }));
                                setActionNote((prev) => ({ ...prev, [issueKey]: "Viewing: Fix steps" }));
                                if (
                                  supportsAIFix(issue) &&
                                  !aiFixes[issueKey] &&
                                  aiStatus[issueKey] !== "loading"
                                ) {
                                  generateFix(issue, issueKey);
                                }
                              }}
                            >
                              Get my solution
                            </button>
                            {activeView === "fix" ? (
                              <>
                                <button
                                  type="button"
                                  className={tabBtnClass(false)}
                                  onClick={async () => {
                                    const text = `${simple.intro}\n- ${simple.steps.join("\n- ")}`;
                                    const ok = await copyTextSafe(text);
                                    setToast(ok ? "Simple steps copied." : "Copy blocked. Please allow clipboard access.");
                                    setActionNote((prev) => ({ ...prev, [issueKey]: ok ? "Simple steps copied." : "Clipboard blocked. Copy manually from the fix box." }));
                                    setTimeout(() => setToast(""), 1800);
                                    setTimeout(() => setActionNote((prev) => ({ ...prev, [issueKey]: "" })), 2400);
                                  }}
                                >
                                  Copy simple steps
                                </button>
                                {simple.snippet ? (
                                  <button
                                    type="button"
                                    className={tabBtnClass(false)}
                                    onClick={async () => {
                                      const ok = await copyTextSafe(simple.snippet);
                                      setToast(ok ? "Code snippet copied." : "Copy blocked. Please allow clipboard access.");
                                      setActionNote((prev) => ({ ...prev, [issueKey]: ok ? "Code copied." : "Clipboard blocked. Copy manually from Ready-to-paste fix." }));
                                      setTimeout(() => setToast(""), 1800);
                                      setTimeout(() => setActionNote((prev) => ({ ...prev, [issueKey]: "" })), 2400);
                                    }}
                                  >
                                    Copy paste-ready code
                                  </button>
                                ) : null}
                              </>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={tabBtnClass(explanationView === "expert")}
                              onClick={() => {
                                setExplainMode((prev) => ({ ...prev, [issueKey]: "expert" }));
                                setIssueView((prev) => ({ ...prev, [issueKey]: "issue" }));
                              }}
                            >
                              Expert explanation
                            </button>
                            <button
                              type="button"
                              className={tabBtnClass(explanationView === "simple")}
                              onClick={() => {
                                setExplainMode((prev) => ({ ...prev, [issueKey]: "simple" }));
                                setIssueView((prev) => ({ ...prev, [issueKey]: "issue" }));
                              }}
                            >
                              Beginner explanation
                            </button>
                            <button
                              type="button"
                              className={tabBtnClass(activeView === "fix", supportsAIFix(issue))}
                              onClick={() => {
                                setIssueView((prev) => ({ ...prev, [issueKey]: "fix" }));
                                setActionNote((prev) => ({ ...prev, [issueKey]: "Viewing: Fix steps" }));
                                if (
                                  supportsAIFix(issue) &&
                                  !aiFixes[issueKey] &&
                                  aiStatus[issueKey] !== "loading"
                                ) {
                                  generateFix(issue, issueKey);
                                }
                              }}
                            >
                              {supportsAIFix(issue)
                                ? (aiStatus[issueKey] === "loading" ? "Generative AI fix (working...)" : "Generative AI fix")
                                : "Show simple fix"}
                            </button>
                            <button
                              type="button"
                              className={tabBtnClass(false)}
                              onClick={async () => {
                                const text = `${simple.intro}\n- ${simple.steps.join("\n- ")}`;
                                const ok = await copyTextSafe(text);
                                setToast(ok ? "Simple steps copied." : "Copy blocked. Please allow clipboard access.");
                                setActionNote((prev) => ({ ...prev, [issueKey]: ok ? "Simple steps copied." : "Clipboard blocked. Copy manually from the fix box." }));
                                setTimeout(() => setToast(""), 1800);
                                setTimeout(() => setActionNote((prev) => ({ ...prev, [issueKey]: "" })), 2400);
                              }}
                            >
                              Copy simple steps
                            </button>
                            <button
                              type="button"
                              className={tabBtnClass(!!whyOpen[issueKey])}
                              onClick={() => {
                                setIssueView((prev) => ({ ...prev, [issueKey]: "issue" }));
                                setWhyOpen((prev) => ({ ...prev, [issueKey]: !prev[issueKey] }));
                              }}
                            >
                              Why this happens
                            </button>
                            {simple.snippet ? (
                              <button
                                type="button"
                                className={tabBtnClass(false)}
                                onClick={async () => {
                                  const ok = await copyTextSafe(simple.snippet);
                                  setToast(ok ? "Code snippet copied." : "Copy blocked. Please allow clipboard access.");
                                  setActionNote((prev) => ({ ...prev, [issueKey]: ok ? "Code copied." : "Clipboard blocked. Copy manually from Ready-to-paste fix." }));
                                  setTimeout(() => setToast(""), 1800);
                                  setTimeout(() => setActionNote((prev) => ({ ...prev, [issueKey]: "" })), 2400);
                                }}
                              >
                                Copy paste-ready code
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                      {actionNote[issueKey] ? (
                        <div className="mt-2 text-xs text-[var(--rp-text-600)]">{actionNote[issueKey]}</div>
                      ) : null}
                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        {activeView === "issue" ? (
                          <>
                            <div id={`issue-visual-${issueKey}`} className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 transition">
                              <div className="text-xs font-semibold text-[var(--rp-text-600)]">What is wrong (visual)</div>
                              <p className="mt-2 rp-body-small">
                                {explanationView === "expert"
                                  ? business.expertDefault
                                  : business.beginnerAlt}
                              </p>
                              <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                                {explanationView === "expert" ? "Mode: Expert explanation" : "Mode: Beginner explanation"}
                              </div>
                              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                <div className="rounded-md border border-[var(--rp-border)] bg-white px-2 py-2">
                                  <div className="text-[10px] uppercase tracking-wide text-[var(--rp-text-500)]">Main URL</div>
                                  <div className="mt-1 text-xs font-semibold text-[var(--rp-text-800)]">{canonicalNow}</div>
                                </div>
                                <div className="rounded-md border border-[var(--rp-border)] bg-white px-2 py-2">
                                  <div className="text-[10px] uppercase tracking-wide text-[var(--rp-text-500)]">HTTP</div>
                                  <div className="mt-1 text-xs font-semibold text-[var(--rp-text-800)]">{httpStatusText(evidence.status)}</div>
                                </div>
                                <div className="rounded-md border border-[var(--rp-border)] bg-white px-2 py-2">
                                  <div className="text-[10px] uppercase tracking-wide text-[var(--rp-text-500)]">URL versions seen</div>
                                  <div className="mt-1 text-xs font-semibold text-[var(--rp-text-800)]">{business.examples.slice(0, 3).length}</div>
                                </div>
                              </div>
                              <div className="mt-3 h-2 w-full rounded-full bg-white border border-[var(--rp-border)]">
                                <div className="h-2 rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-300" style={{ width: `${visualHealth}%` }} />
                              </div>
                              <div className="mt-1 text-[11px] text-[var(--rp-text-500)]">
                                Visual health: {visualHealth}/100 (higher is better)
                              </div>
                              {whyOpen[issueKey] && (
                                <div className="mt-2 rounded-lg border border-[var(--rp-border)] bg-white p-2 text-xs text-[var(--rp-text-600)]">
                                  <div className="font-semibold text-[var(--rp-text-700)]">Why this happens</div>
                                  <p className="mt-1">
                                    {isBeginnerView ? business.whyHappensSimple : business.whyHappensExpert}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                              <div className="text-xs font-semibold text-[var(--rp-text-600)]">What search engines may do</div>
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--rp-text-700)]">
                                {visualBullets.map((line) => (
                                  <li key={line}>{line}</li>
                                ))}
                              </ul>
                              <div className="mt-3 text-xs font-semibold text-[var(--rp-text-600)]">Show real example</div>
                              <div className="mt-1 space-y-1 text-xs text-[var(--rp-text-600)]">
                                {business.examples.slice(0, 3).map((line) => (
                                  <div key={line} className="rounded-md border border-[var(--rp-border)] bg-white px-2 py-1 break-all">{line}</div>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                              <div className="text-xs font-semibold text-[var(--rp-text-600)]">
                                {supportsAIFix(issue) ? "AI-guided fix (plain English)" : "Simple fix (kid-friendly)"}
                              </div>
                              <p className="mt-2 rp-body-small">{simple.intro}</p>
                              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--rp-text-700)]">
                                {simple.steps.map((stepText) => (
                                  <li key={stepText}>{stepText}</li>
                                ))}
                              </ol>
                            </div>
                            <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                              <div className="text-xs font-semibold text-[var(--rp-text-600)]">Ready-to-paste fix</div>
                              {simple.snippet ? (
                                <pre className="mt-2 overflow-auto rounded-lg border border-[var(--rp-border)] bg-white p-3 text-xs text-[var(--rp-text-700)] whitespace-pre-wrap">
                                  {simple.snippet}
                                </pre>
                              ) : (
                                <p className="mt-2 rp-body-small">This fix is mostly content updates, no code snippet needed.</p>
                              )}
                              <p className="mt-2 text-xs text-[var(--rp-text-500)]">
                                You can paste this in your site settings, or send it to your developer exactly as shown.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      {supportsAIFix(issue) && (
                        <div className="mt-3 rounded-xl border border-[var(--rp-border)] bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs font-semibold text-[var(--rp-text-600)]">AI fix assistant</div>
                            <div className="text-[11px] text-[var(--rp-text-400)]">One click: generate and copy AI fix text.</div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className={tabBtnClass(false)}
                              disabled={aiStatus[issueKey] === "loading"}
                              onClick={async () => {
                                let text = aiFixes[issueKey];
                                if (!text) {
                                  text = await generateFix(issue, issueKey);
                                }
                                if (!text) {
                                  setToast("AI fix generation failed. Please try again.");
                                  setActionNote((prev) => ({ ...prev, [issueKey]: "AI fix failed. Please try again." }));
                                  setTimeout(() => setToast(""), 2200);
                                  setTimeout(() => setActionNote((prev) => ({ ...prev, [issueKey]: "" })), 2400);
                                  return;
                                }
                                const ok = await copyTextSafe(text);
                                setToast(ok ? "AI fix copied." : "Copy blocked. Please allow clipboard access.");
                                setActionNote((prev) => ({ ...prev, [issueKey]: ok ? "AI fix copied." : "Clipboard blocked. Copy manually from AI fix box below." }));
                                setTimeout(() => setToast(""), 1800);
                                setTimeout(() => setActionNote((prev) => ({ ...prev, [issueKey]: "" })), 2400);
                              }}
                            >
                              {aiStatus[issueKey] === "loading" ? "Preparing AI fix..." : "Copy AI fix"}
                            </button>
                          </div>
                          <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                            If your site has integrations, you can publish this copied fix in your CMS right away.
                          </div>
                          {aiFixes[issueKey] && (
                            <div className="mt-3 rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3 text-xs text-[var(--rp-text-600)] whitespace-pre-wrap">
                              {aiFixes[issueKey]}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="mt-3 rounded-xl border border-[var(--rp-border)] bg-white p-4">
                        <div className="text-xs font-semibold text-[var(--rp-text-600)]">Proof we checked this page</div>
                        <p className="mt-1 text-xs text-[var(--rp-text-500)]">
                          This section shows what we verified on your live page so you can trust the recommendation.
                        </p>
                        {Object.keys(evidence).length > 0 ? (
                          <>
                            <div className="mt-3 grid gap-2 md:grid-cols-3">
                              <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                                <div className="text-[10px] uppercase tracking-wide text-[var(--rp-text-500)]">Page checked</div>
                                <div className="mt-1 break-all text-xs font-semibold text-[var(--rp-text-800)]">
                                  {String(evidence.final_url || finalUrl || "Not available")}
                                </div>
                              </div>
                              <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                                <div className="text-[10px] uppercase tracking-wide text-[var(--rp-text-500)]">Page response</div>
                                <div className="mt-1 text-xs font-semibold text-[var(--rp-text-800)]">
                                  {httpStatusText(evidence.status)}
                                </div>
                              </div>
                              <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                                <div className="text-[10px] uppercase tracking-wide text-[var(--rp-text-500)]">Main URL setting</div>
                                <div className="mt-1 break-all text-xs font-semibold text-[var(--rp-text-800)]">
                                  {canonicalStatusText(evidence)}
                                </div>
                              </div>
                            </div>
                            {summary.length ? (
                              <ul className="mt-3 list-disc space-y-1 pl-5 rp-body-small">
                                {summary.map((line) => (
                                  <li key={line}>{line}</li>
                                ))}
                              </ul>
                            ) : null}
                            {advanced && (
                              <details className="mt-3 rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                                <summary className="cursor-pointer text-xs font-semibold text-[var(--rp-text-700)]">
                                  Technical raw data (for developers)
                                </summary>
                                <pre className="mt-2 overflow-auto rounded-lg border border-[var(--rp-border)] bg-white p-3 text-xs text-[var(--rp-text-600)]">
                                  {JSON.stringify(evidence, null, 2)}
                                </pre>
                              </details>
                            )}
                          </>
                        ) : (
                          <p className="mt-2 rp-body-small">No technical evidence captured for this issue.</p>
                        )}
                        <div className="mt-3 rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                          <div className="text-xs font-semibold text-[var(--rp-text-700)]">Advanced check (recommended)</div>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--rp-text-600)]">
                            {business.checks.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
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
