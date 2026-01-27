export function exportRankSummary(result) {
  if (!result) return;

  const keyword = result.keyword || "";
  const domain = result.domain || "";
  const rank = result.rank ?? result.position ?? null;
  const checkedAt = result.checked_at || new Date().toISOString();

  const lines = [];
  lines.push("Rank Check Summary");
  lines.push("==================");
  lines.push("");
  lines.push(`Keyword: ${keyword || "N/A"}`);
  lines.push(`Domain: ${domain || "N/A"}`);
  lines.push(`Rank: ${rank ?? "N/A"}`);
  lines.push(`Checked at: ${checkedAt}`);
  lines.push("");

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rank-check.txt";
  a.click();
  URL.revokeObjectURL(url);
}
