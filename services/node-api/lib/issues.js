import detectRobotsIndexability from "./detectRobotsIndexability.js";
import httpStatusRedirectHygiene from "../src/detectors/http_status_redirect_hygiene.js";
import detectCanonicalLink from "./detectCanonicalLink.js";
import detectH1CountAndLength from "./detectH1CountAndLength.js";
import detectMetaDescriptionLength from "./detectMetaDescriptionLength.js";
function snippetAround(html, idx, radius = 140) {
  const start = Math.max(0, idx - radius);
  const end = Math.min(html.length, idx + radius);
  return html.slice(start, end).replace(/\s+/g, " ").trim();
}

function buildIssue({ id, title, severity,
    evidence, recommended_fix }) {
  return {
    id,
    title,
    severity,
    evidence: evidence || {},
    recommended_fix: recommended_fix || {},
  };
}

export function detectIssues({ html, url }) {
  const issues = [
  httpStatusRedirectHygiene,
];
  try {
    const extra = detectMetaDescriptionLength({ html, url });
  try {
    const extraH1 = detectH1CountAndLength({ html, url });
  try {
    const extraCanon = detectCanonicalLink({ html, url });
  try {
    const extraRobots = detectRobotsIndexability({ html, url });
    
    const extraHttp = await httpStatusRedirectHygiene.run({ url });
    if (Array.isArray(extraHttp) && extraHttp.length) issues.push(...extraHttp);
if (Array.isArray(extraRobots) && extraRobots.length) issues.push(...extraRobots);
  } catch {}

    if (Array.isArray(extraCanon) && extraCanon.length) issues.push(...extraCanon);
  } catch {}

    if (Array.isArray(extraH1) && extraH1.length) issues.push(...extraH1);
  } catch {}

    if (Array.isArray(extra) && extra.length) issues.push(...extra);
  } catch {}

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleText = (titleMatch?.[1] || "").replace(/\s+/g, " ").trim();
  const titleLen = titleText.length;

  if (!titleText) {
    issues.push(
      buildIssue({
        id: "title_missing",
        title: "Missing <title> tag",
        severity: "high",
        evidence: { url, selector: "head > title", found: false, example: null },
        recommended_fix: {
          summary: "Add a descriptive page title.",
          steps: [
            "Add a <title> in <head> that describes the page and includes the primary keyword naturally.",
            "Keep it unique per page.",
          ],
          example: "<title>RankyPulse – SEO Page Report & Quick Wins</title>",
        },
      })
    );
  }

  if (titleLen > 60) {
    issues.push(
      buildIssue({
        id: "title_too_long",
        title: "Title tag is too long",
        severity: "medium",
        evidence: {
          url,
          selector: "head > title",
          found: true,
          value: titleText,
          length: titleLen,
          excerpt: titleMatch ? snippetAround(html, titleMatch.index ?? 0) : null,
        },
        recommended_fix: {
          summary: "Shorten the title to ~50–60 characters and keep the main keyword near the front.",
          steps: [
            "Move the primary keyword earlier in the title.",
            "Remove filler words and repetition.",
            "Keep the brand at the end if needed.",
          ],
          example: "<title>SEO Page Report – Quick Wins | RankyPulse</title>",
        },
      })
    );
  }

  const metaDescMatch = html.match(
    /<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([\s\S]*?)["'][^>]*>/i
  );

  const metaDesc = (metaDescMatch?.[1] || "").replace(/\s+/g, " ").trim();
  const descLen = metaDesc.length;

  if (!metaDescMatch || !metaDesc) {
    issues.push(
      buildIssue({
        id: "meta_description_missing",
        title: "Missing meta description",
        severity: "high",
        evidence: { url, selector: 'meta[name="description"]', found: false, example: null },
        recommended_fix: {
          summary: "Add a meta description that explains the page value and encourages clicks.",
          steps: [
            "Add <meta name='description' content='...'> to <head>.",
            "Write ~140–160 characters, include the primary keyword once, add a benefit + CTA.",
            "Make it unique per page.",
          ],
          example:
            "<meta name=\"description\" content=\"Get an instant SEO page report with quick wins, content ideas, and keyword suggestions to improve rankings.\" />",
        },
      })
    );
  }

  if (descLen > 170) {
    issues.push(
      buildIssue({
        id: "meta_description_too_long",
        title: "Meta description is too long",
        severity: "low",
        evidence: {
          url,
          selector: 'meta[name="description"]',
          found: true,
          value: metaDesc,
          length: descLen,
          excerpt: metaDescMatch ? snippetAround(html, metaDescMatch.index ?? 0) : null,
        },
        recommended_fix: {
          summary: "Shorten the meta description to ~140–160 characters and keep the benefit upfront.",
          steps: [
            "Start with the core benefit (what the user gets).",
            "Keep one keyword phrase, remove repetition.",
            "End with a simple CTA.",
          ],
          example:
            "<meta name=\"description\" content=\"Instant SEO page report with quick wins, content ideas, and keyword suggestions. Improve rankings in minutes.\" />",
        },
      })
    );
  }


  const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const h1Text = (h1Match?.[1] || "").replace(/\s+/g, " ").trim();

  if (!h1Text) {
    issues.push(
      buildIssue({
        id: "h1_missing",
        title: "Missing H1 heading",
        severity: "high",
        evidence: { url, selector: "h1", found: false, example: null },
        recommended_fix: {
          summary: "Add one clear H1 that matches the page’s primary intent.",
          steps: [
            "Add exactly one <h1> near the top of the page.",
            "Make it descriptive and aligned with the main keyword/topic.",
            "Keep it readable for humans (not keyword-stuffed)."
          ],
          example: "<h1>Example Domain</h1>"
        }
      })
    );
  }

  const seen = new Set();
  const issuesDeduped = [];
  for (const it of issues) {
    const key = [
      it && it.id ? String(it.id) : "",
      it && it.evidence && it.evidence.selector ? String(it.evidence.selector) : "",
      it && it.evidence && it.evidence.url ? String(it.evidence.url) : ""
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    issuesDeduped.push(it);
  }

  return issuesDeduped;

}
