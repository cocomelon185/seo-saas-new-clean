export function getAuditPathWithUrl(rawUrl = "") {
  const url = String(rawUrl || "").trim();
  if (!url) return "/audit";
  return `/audit?url=${encodeURIComponent(url)}`;
}

export function getSignupAuditHref(rawUrl = "") {
  const next = getAuditPathWithUrl(rawUrl);
  return `/auth/signup?next=${encodeURIComponent(next)}`;
}

