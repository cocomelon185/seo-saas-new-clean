function normalizeItem(text) {
  if (!text) return "";
  return text
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+[\).\s]+/, "")
    .trim();
}

function parseContentBrief(raw) {
  const data = {
    primaryTopic: "",
    outline: [],
    faqs: [],
    keywords: []
  };

  if (!raw || typeof raw !== "string") {
    return { ...data, hasContent: false };
  }

  const headingPattern = /^(primary topic|suggested outline|faqs?|keywords to cover)\s*[:\-]?\s*(.*)$/i;
  let current = null;

  const addKeywords = (value) => {
    const cleaned = normalizeItem(value);
    if (!cleaned) return;
    cleaned.split(",").forEach((entry) => {
      const token = entry.trim();
      if (token) data.keywords.push(token);
    });
  };

  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const match = trimmed.match(headingPattern);
    if (match) {
      const heading = match[1].toLowerCase();
      if (heading === "primary topic") current = "primaryTopic";
      else if (heading === "suggested outline") current = "outline";
      else if (heading.startsWith("faq")) current = "faqs";
      else current = "keywords";

      const rest = match[2] ? match[2].trim() : "";
      if (rest) {
        if (current === "primaryTopic" && !data.primaryTopic) {
          data.primaryTopic = normalizeItem(rest);
        } else if (current === "keywords") {
          addKeywords(rest);
        } else {
          const item = normalizeItem(rest);
          if (item) data[current].push(item);
        }
      }
      return;
    }

    if (!current) return;

    if (current === "primaryTopic") {
      if (!data.primaryTopic) {
        data.primaryTopic = normalizeItem(trimmed);
      }
      return;
    }

    if (current === "keywords") {
      addKeywords(trimmed);
      return;
    }

    const item = normalizeItem(trimmed);
    if (item) data[current].push(item);
  });

  const keywordSet = new Set();
  const keywords = [];
  data.keywords.forEach((kw) => {
    if (!keywordSet.has(kw)) {
      keywordSet.add(kw);
      keywords.push(kw);
    }
  });

  const hasContent =
    Boolean(data.primaryTopic) ||
    data.outline.length > 0 ||
    data.faqs.length > 0 ||
    keywords.length > 0;

  return {
    primaryTopic: data.primaryTopic,
    outline: data.outline,
    faqs: data.faqs,
    keywords,
    hasContent
  };
}

export default function ContentBrief({ content }) {
  const raw = typeof content === "string" ? content : "";
  if (!raw.trim()) return null;

  const parsed = parseContentBrief(raw);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-sm font-semibold text-white/80">Content Brief</div>

      {parsed.hasContent ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {parsed.primaryTopic ? (
            <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Primary topic</div>
              <div className="mt-2 text-lg font-semibold text-white/90">{parsed.primaryTopic}</div>
            </div>
          ) : null}

          {parsed.outline.length > 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Suggested outline</div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/85">
                {parsed.outline.map((item, index) => (
                  <li key={`outline-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {parsed.faqs.length > 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-white/50">FAQs</div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/85">
                {parsed.faqs.map((item, index) => (
                  <li key={`faq-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {parsed.keywords.length > 0 ? (
            <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Keywords to cover</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {parsed.keywords.map((keyword, index) => (
                  <span
                    key={`keyword-${index}`}
                    className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/80"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
          {raw}
        </pre>
      )}
    </div>
  );
}
