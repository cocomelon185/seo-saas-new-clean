import { setTimeout as delay } from "timers/promises";

/**
 * Normalize and validate URLs
 */
export function normalizeUrl(input) {
  if (!input || typeof input !== "string") {
    return { ok: false, code: "BAD_URL", message: "URL is required." };
  }

  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  try {
    const u = new URL(url);
    if (!u.hostname.includes(".")) {
      return { ok: false, code: "BAD_URL", message: "Invalid domain." };
    }
    return { ok: true, normalized: u.toString() };
  } catch {
    return { ok: false, code: "BAD_URL", message: "Invalid URL format." };
  }
}

/**
 * Fetch with timeout + retry (NO streaming yet, safe baseline)
 */
export async function fetchWithTimeout(url, { timeoutMs = 12000, retries = 0 } = {}) {
  let lastErr;

  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "RankyPulseAuditBot/1.0",
          "Accept": "text/html,*/*",
        },
        redirect: "follow",
      });
      clearTimeout(t);
      return res;
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      if (i < retries) await delay(300);
    }
  }

  throw lastErr;
}

/**
 * Small in-memory TTL cache
 */
export class TTLCache {
  constructor({ ttlMs, maxEntries }) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.map = new Map();
  }

  get(key) {
    const v = this.map.get(key);
    if (!v) return null;
    if (Date.now() > v.exp) {
      this.map.delete(key);
      return null;
    }
    return v.val;
  }

  set(key, val) {
    if (this.map.size >= this.maxEntries) {
      const first = this.map.keys().next().value;
      if (first) this.map.delete(first);
    }
    this.map.set(key, { val, exp: Date.now() + this.ttlMs });
  }
}

/**
 * Simple rate limiter (per-IP)
 */
export class RateLimiter {
  constructor({ windowMs, max }) {
    this.windowMs = windowMs;
    this.max = max;
    this.hits = new Map();
  }

  hit(key) {
    const now = Date.now();
    const rec = this.hits.get(key) || { count: 0, resetAt: now + this.windowMs };

    if (now > rec.resetAt) {
      rec.count = 0;
      rec.resetAt = now + this.windowMs;
    }

    rec.count++;
    this.hits.set(key, rec);

    return {
      allowed: rec.count <= this.max,
      resetAt: rec.resetAt,
    };
  }
}

/**
 * Consistent error response helper
 */
export function jsonError(res, status, code, message, extra = {}) {
  return res.status(status).json({
    ok: false,
    error: { code, message, ...extra },
  });
}

/**
 * Error shape for workers
 */
export function jsonErrorShape(code, message, detail) {
  const e = { code, message };
  if (detail) e.detail = detail;
  return e;
}
