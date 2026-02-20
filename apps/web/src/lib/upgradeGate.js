export function isFreeCreditExhaustedResponse(status, payload) {
  const code = String(payload?.error?.code || payload?.code || "").toUpperCase();
  if (code === "FREE_CREDIT_EXHAUSTED") return true;
  if (payload?.upgrade_required === true) return true;
  return Number(status) === 402;
}

export function extractApiErrorMessage(payload, fallback = "Request failed.") {
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  const nested = payload?.error?.message || payload?.error || payload?.message;
  if (typeof nested === "string" && nested.trim()) return nested.trim();
  return fallback;
}

export function pricingRedirectPath(source = "audit") {
  return `/account/pricing?reason=free_credit_exhausted&source=${encodeURIComponent(source)}`;
}
