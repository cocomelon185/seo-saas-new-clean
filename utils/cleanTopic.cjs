function cleanTopic(input) {
  const s = String(input || "")
    .replace(/https?:\/\/(www\.)?/i, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!s) return "";
  return s.length > 80 ? s.slice(0, 80).trim() : s;
}

module.exports = { cleanTopic };
