const { getIssueDef } = require("./issuesCatalog");

function mkIssue(issue_id, evidence = {}, extra = {}) {
  const def = getIssueDef(issue_id) || {};
  return {
    issue_id,
    title: def.title || extra.title || issue_id,
    priority: def.priority || extra.priority || "fix_later",
    why: def.why || extra.why || "",
    what: def.what || extra.what || "",
    example_fix: def.example_fix || extra.example_fix || "",
    evidence: evidence || {},
  };
}

module.exports = { mkIssue };
