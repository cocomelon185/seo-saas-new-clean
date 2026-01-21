const { getIssueDef } = require("./issuesCatalog");

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return { present: false, value: "" };
  const raw = (m[1] || "").replace(/\s+/g, " ").trim();
  return { present: raw.length > 0, value: raw };
}

function detectMetaTitleMissing({ html, final_url }) {
  const def = getIssueDef("META_TITLE_MISSING");
  const title = extractTitle(html || "");
  const pass = title.present;

  const issue = {
    issue_id: def.issue_id,
    category: def.category,
    status: pass ? "ok" : "fail",
    severity: pass ? "low" : def.severity_default,
    priority: pass ? "fix_later" : def.priority_default,
    title: def.title,
    why_it_matters: def.why_it_matters,
    evidence: {
      final_url: final_url || null,
      title_present: title.present,
      title_value: title.value,
      title_length: title.value.length
    },
    recommended_fix: pass
      ? null
      : {
          steps: (def.recommended_fix && def.recommended_fix.steps) || [],
          examples: (def.recommended_fix && def.recommended_fix.examples) || []
        }
  };

  return { issue, title };
}

module.exports = { detectMetaTitleMissing };
