export function auditErrorResponse(err, url, extra = {}) {
  const msg = String(err && err.message ? err.message : err);

  const lower = msg.toLowerCase();

  const code =
    lower.includes("timeout") || lower.includes("aborterror") ? "TIMEOUT" :
    lower.includes("enotfound") ? "DNS" :
    lower.includes("econnrefused") ? "CONNECTION_REFUSED" :
    lower.includes("certificate") ? "TLS" :
    lower.includes("fetch failed") || lower.includes("undici") || lower.includes("network") ? "NETWORK" :
    "FAILED";

  const friendly =
    code === "TIMEOUT"
      ? "Audit timed out. Please try again (we’ll retry automatically on slow sites)."
      : code === "DNS"
      ? "We couldn’t resolve this domain (DNS). Please double-check the URL and try again."
      : code === "TLS"
      ? "TLS/SSL handshake failed for this URL. Please confirm the site supports HTTPS and try again."
      : code === "NETWORK"
      ? "Network error while auditing this page. Please try again in a moment."
      : "Audit failed. Please try again in a moment.";

  return {
    ok: false,
    url,
    final_url: null,
    status: null,
    score: null,
    quick_wins: [],
    content_brief: "",
    keyword_ideas: [],
    issues: [],
    priorities: [],
    saas_page_type: null,
    saas_page_advice: null,
    page_type: null,
    page_type_advice: [],
    rewrite_examples: [],
    warning: friendly,
    error: {
      code,
      message: friendly,
      raw: msg.slice(0, 500),
      ...extra
    }
  };
}
