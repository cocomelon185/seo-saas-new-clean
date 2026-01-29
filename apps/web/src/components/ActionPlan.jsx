import { useMemo } from "react";

function normalizeText(value) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function firstSentence(text) {
  const cleaned = normalizeText(text).replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const match = cleaned.match(/[^.!?]+[.!?]/);
  return match ? match[0].trim() : cleaned;
}

function truncate(text, maxLen) {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + "…";
}

function impactFromText(text) {
  const hay = normalizeText(text).toLowerCase();
  if (/(index|crawl|robots|sitemap|canonical|redirect|status|http|https)/.test(hay)) {
    return "Indexing";
  }
  if (/(title|meta|snippet|ctr|click|description)/.test(hay)) {
    return "CTR";
  }
  if (/(pricing|conversion|cta|trust|checkout|signup|trial|billing)/.test(hay)) {
    return "Conversion";
  }
  return "Traffic";
}

function impactFromIssue(issue, title, explanation) {
  const combined = [
    title,
    explanation,
    issue?.category,
    issue?.type,
    issue?.impact,
    issue?.severity
  ]
    .map((x) => normalizeText(x))
    .join(" ");
  return impactFromText(combined);
}

function priorityFromIssue(issue, index) {
  const hay = `${normalizeText(issue?.impact)} ${normalizeText(issue?.severity)} ${normalizeText(issue?.type)}`.toLowerCase();
  if (/(high|critical|error)/.test(hay)) return "Fix now";
  return index < 2 ? "Fix now" : "Fix next";
}

function buildActions(result) {
  const actions = [];
  const seen = new Set();

  const issuesSource =
    Array.isArray(result?.priorities) && result.priorities.length > 0
      ? result.priorities
      : Array.isArray(result?.issues)
        ? result.issues
        : [];

  issuesSource.forEach((issue, index) => {
    if (actions.length >= 5) return;

    const title =
      normalizeText(issue?.title) ||
      normalizeText(issue?.message) ||
      normalizeText(issue?.id) ||
      normalizeText(issue?.type);

    const key = title.toLowerCase();
    if (!title || seen.has(key)) return;
    seen.add(key);

    const explanationSource =
      issue?.description ||
      issue?.why_it_matters ||
      issue?.how_to_fix ||
      issue?.fix ||
      issue?.message ||
      title;

    const explanation = truncate(firstSentence(explanationSource) || `${title}.`, 180);

    actions.push({
      title,
      priority: priorityFromIssue(issue, index),
      explanation,
      impact: impactFromIssue(issue, title, explanation),
    });
  });

  if (actions.length < 3 && Array.isArray(result?.quick_wins)) {
    result.quick_wins.forEach((win) => {
      if (actions.length >= 5) return;

      const text = normalizeText(win);
      if (!text) return;

      const rawTitle = firstSentence(text).replace(/[.!?]$/, "");
      const title = rawTitle || `Quick win ${actions.length + 1}`;
      const key = title.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);

      const explanation = truncate(firstSentence(text) || `${title}.`, 180);

      actions.push({
        title,
        priority: actions.length === 0 ? "Fix now" : "Fix next",
        explanation,
        impact: impactFromText(text),
      });
    });
  }

  return actions.slice(0, 5);
}

function priorityClass(priority) {
  if (priority === "Fix now") {
    return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  }
  return "border-amber-300/30 bg-amber-500/10 text-amber-100";
}

export default function ActionPlan({ result }) {
  const actions = useMemo(() => buildActions(result), [result]);

  return (
    <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white/80">Action Plan</div>
        <div className="text-xs text-white/40">
          {actions.length ? `${actions.length} prioritized actions` : "Awaiting audit data"}
        </div>
      </div>

      {actions.length ? (
        <ol className="mt-4 space-y-3">
          {actions.map((action, index) => (
            <li key={`${action.title}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-white">
                  {index + 1}. {action.title}
                </div>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityClass(action.priority)}`}>
                  {action.priority}
                </span>
                <span className="inline-flex items-center rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/70">
                  {action.impact}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/70">{action.explanation}</p>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-3 text-white/60">Run an audit to generate a tailored action plan.</div>
      )}
    </div>
  );
}
