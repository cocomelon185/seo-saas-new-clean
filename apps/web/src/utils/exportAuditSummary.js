export function exportAuditSummary(result) {
  if (!result) return;

  const lines = [];

  lines.push("Audit Summary");
  lines.push("==============");
  lines.push("");
  lines.push(`URL: ${result.url || "N/A"}`);
  lines.push(`Score: ${result.score ?? "N/A"}`);
  lines.push("");

  const issues = Array.isArray(result.issues) ? result.issues : [];
  const fixNow = issues.filter(i => i && i.priority === "fix_now");
  const fixNext = issues.filter(i => i && i.priority === "fix_next");
  const fixLater = issues.filter(i => i && i.priority === "fix_later");

  lines.push(`Fix now issues: ${fixNow.length}`);
  lines.push(`Fix next issues: ${fixNext.length}`);
  lines.push(`Fix later issues: ${fixLater.length}`);
  lines.push(`Total issues: ${issues.length}`);
  lines.push("");

  if (fixNow.length) {
    lines.push("Fix now details:");
    fixNow.forEach((i, idx) => {
      lines.push(`${idx + 1}. ${i.title || i.issue_id || "Issue"}`);
    });
    lines.push("");
  }

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "audit-summary.txt";
  a.click();

  URL.revokeObjectURL(url);
}
