import path from "path";
import jwt from "jsonwebtoken";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-12345";
const DEFAULT_LIMIT = Math.max(1, Number(process.env.FREE_SCAN_LIMIT || 1));
const SCOPED_LIMITS = {
  rank: Math.max(1, Number(process.env.FREE_RANK_CHECK_LIMIT || DEFAULT_LIMIT)),
  audit: Math.max(1, Number(process.env.FREE_AUDIT_LIMIT || DEFAULT_LIMIT)),
  default: DEFAULT_LIMIT
};

let usageDb;

function getUsageDb() {
  if (!usageDb) {
    usageDb = new Database(path.join(process.cwd(), "database.db"));
    usageDb.pragma("journal_mode = WAL");
    usageDb.exec(`
      CREATE TABLE IF NOT EXISTS free_scan_usage (
        principal TEXT NOT NULL,
        scope TEXT NOT NULL,
        used_count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (principal, scope)
      );
    `);
  }
  return usageDb;
}

function decodeAuthUser(req) {
  const header = String(req?.headers?.authorization || "");
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    return jwt.verify(match[1], JWT_SECRET);
  } catch {
    return null;
  }
}

function getClientIp(req) {
  const xf = req?.headers?.["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) return xf.split(",")[0].trim();
  return req?.socket?.remoteAddress || "unknown";
}

function getUsagePrincipal(req, authUser) {
  if (String(authUser?.role || "").toLowerCase() === "admin") {
    return { isAdmin: true, key: "admin" };
  }
  const email = String(authUser?.email || "").trim().toLowerCase();
  if (email) return { isAdmin: false, key: `user:${email}` };
  const anonId = String(req?.headers?.["x-rp-anon-id"] || "").trim();
  if (anonId) return { isAdmin: false, key: `anon:${anonId}` };
  return { isAdmin: false, key: `ip:${getClientIp(req)}` };
}

function getUsedCount(principal, scope) {
  const row = getUsageDb()
    .prepare(
      "SELECT used_count FROM free_scan_usage WHERE principal = ? AND scope = ? LIMIT 1"
    )
    .get(principal, scope);
  return Number(row?.used_count || 0);
}

function incrementUsedCount(principal, scope) {
  getUsageDb()
    .prepare(
      `INSERT INTO free_scan_usage (principal, scope, used_count, updated_at)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(principal, scope) DO UPDATE
       SET used_count = free_scan_usage.used_count + 1,
           updated_at = excluded.updated_at`
    )
    .run(principal, scope, new Date().toISOString());
}

function getScope(scope) {
  const normalized = String(scope || "").trim().toLowerCase();
  return normalized || "default";
}

function getLimitForScope(scope) {
  return SCOPED_LIMITS[scope] || SCOPED_LIMITS.default;
}

export function consumeFreeScanCreditForRequest(req, scope = "default") {
  const normalizedScope = getScope(scope);
  const authUser = decodeAuthUser(req);
  const principal = getUsagePrincipal(req, authUser);
  const limit = getLimitForScope(normalizedScope);

  if (principal.isAdmin) {
    return {
      allowed: true,
      limit,
      used: 0,
      remaining: limit
    };
  }

  const used = getUsedCount(principal.key, normalizedScope);
  if (used >= limit) {
    return {
      allowed: false,
      status: 402,
      code: "FREE_CREDIT_EXHAUSTED",
      message: "Your free credit is used. Upgrade to continue.",
      limit,
      used,
      remaining: Math.max(0, limit - used)
    };
  }

  incrementUsedCount(principal.key, normalizedScope);
  const usedAfter = used + 1;
  return {
    allowed: true,
    limit,
    used: usedAfter,
    remaining: Math.max(0, limit - usedAfter)
  };
}

