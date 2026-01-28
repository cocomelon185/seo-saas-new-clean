export function issueKey(issue) {
  if (!issue) return "";
  if (issue.issue_id) return String(issue.issue_id);
  if (issue.id) return String(issue.id);
  if (issue.code) return String(issue.code);
  const t = issue.title || issue.name || issue.summary || "";
  const w = issue.why || "";
  const e = issue.evidence ? JSON.stringify(issue.evidence) : "";
  return (String(t) + "|" + String(w) + "|" + String(e)).slice(0, 220);
}

export function diffIssues(baselineIssues, compareIssues) {
  const a = Array.isArray(baselineIssues) ? baselineIssues : [];
  const b = Array.isArray(compareIssues) ? compareIssues : [];

  const aMap = new Map();
  for (const it of a) {
    const k = issueKey(it);
    if (!k) continue;
    if (!aMap.has(k)) aMap.set(k, it);
  }

  const bMap = new Map();
  for (const it of b) {
    const k = issueKey(it);
    if (!k) continue;
    if (!bMap.has(k)) bMap.set(k, it);
  }

  const fixed = [];
  const fixedKeys = new Set();
  for (const [k, it] of aMap.entries()) {
    if (!bMap.has(k)) {
      fixed.push(it);
      fixedKeys.add(k);
    }
  }

  const added = [];
  const addedKeys = new Set();
  for (const [k, it] of bMap.entries()) {
    if (!aMap.has(k)) {
      added.push(it);
      addedKeys.add(k);
    }
  }

  return {
    fixed,
    added,
    fixedKeys: Array.from(fixedKeys),
    addedKeys: Array.from(addedKeys),
    fixedCount: fixed.length,
    addedCount: added.length
  };
}
