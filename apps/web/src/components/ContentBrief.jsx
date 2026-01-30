import { useEffect, useRef, useState } from "react";

function normalizeItem(text) {
  if (!text) return "";
  return text
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+[\).\s]+/, "")
    .trim();
}

function parseContentBrief(raw) {
  const MAX_OUTLINE = 20;
  const MAX_FAQS = 20;
  const MAX_KEYWORDS = 30;
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
  const keywordSet = new Set();

  const addListItem = (target, value, maxItems) => {
    if (target.length >= maxItems) return;
    const item = normalizeItem(value);
    if (item) target.push(item);
  };

  const addKeywords = (value) => {
    const cleaned = normalizeItem(value);
    if (!cleaned) return;
    cleaned.split(/[;,]/).forEach((entry) => {
      const token = entry.trim();
      if (!token) return;
      const tokenKey = token.toLowerCase();
      if (keywordSet.has(tokenKey)) return;
      if (data.keywords.length >= MAX_KEYWORDS) return;
      keywordSet.add(tokenKey);
      data.keywords.push(token);
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
          addListItem(
            data[current],
            rest,
            current === "outline" ? MAX_OUTLINE : MAX_FAQS
          );
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

    addListItem(
      data[current],
      trimmed,
      current === "outline" ? MAX_OUTLINE : MAX_FAQS
    );
  });

  const hasContent =
    Boolean(data.primaryTopic) ||
    data.outline.length > 0 ||
    data.faqs.length > 0 ||
    data.keywords.length > 0;

  return {
    primaryTopic: data.primaryTopic,
    outline: data.outline,
    faqs: data.faqs,
    keywords: data.keywords,
    hasContent
  };
}

export default function ContentBrief({ content }) {
  const raw = typeof content === "string" ? content : "";
  const [copyState, setCopyState] = useState("idle");
  const [showRaw, setShowRaw] = useState(false);
  const rawOnlyPreRef = useRef(null);
  const rawTogglePreRef = useRef(null);
  const copyTimeout = useRef(null);
  if (!raw.trim()) return null;

  const parsed = parseContentBrief(raw);
  const hasStructured = parsed.hasContent;

  useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
    };
  }, []);

  const flashCopyState = (nextState) => {
    if (copyTimeout.current) {
      clearTimeout(copyTimeout.current);
    }
    setCopyState(nextState);
    copyTimeout.current = setTimeout(() => {
      setCopyState("idle");
    }, 1500);
  };

  const selectRawText = () => {
    const target = rawTogglePreRef.current || rawOnlyPreRef.current;
    if (!target) return false;
    const selection = window.getSelection?.();
    if (!selection) return false;
    const range = document.createRange();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  };

  const handleCopy = async () => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(raw);
      flashCopyState("copied");
    } catch {
      if (!showRaw && hasStructured) {
        setShowRaw(true);
        setTimeout(() => {
          const didSelect = selectRawText();
          flashCopyState("failed");
        }, 0);
        return;
      }
      selectRawText();
      flashCopyState("failed");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-testid="content-brief">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white/80">Content Brief</div>
        <div className="flex items-center gap-3">
          {hasStructured ? (
            <button
              type="button"
              onClick={() => setShowRaw((prev) => !prev)}
              data-testid="content-brief-toggle-raw"
              className="text-xs font-semibold text-white/50 transition hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              {showRaw ? "Hide raw" : "Show raw"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleCopy}
            data-testid="content-brief-copy"
            className="min-w-[96px] rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/70 transition hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy"}
          </button>
        </div>
      </div>

      {hasStructured ? (
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
        <pre
          ref={rawOnlyPreRef}
          className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80"
        >
          {raw}
        </pre>
      )}
      {hasStructured && showRaw ? (
        <pre
          ref={rawTogglePreRef}
          className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80"
        >
          {raw}
        </pre>
      ) : null}
    </div>
  );
}
