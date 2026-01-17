export function runAudit(finalUrl, html) {
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "").trim();
  const h1 = (html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    url: finalUrl,
    title,
    h1,
    htmlBytes: html.length,
  };
}
