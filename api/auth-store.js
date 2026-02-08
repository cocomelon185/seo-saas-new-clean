import crypto from "crypto";

let _pool = null;
let _schemaReady = false;

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "zoho.com"
]);

function getDefaultTeamId(email) {
  const domain = String(email || "").split("@")[1] || "default";
  if (PUBLIC_EMAIL_DOMAINS.has(domain)) {
    return `team_${crypto.randomUUID().slice(0, 8)}`;
  }
  return domain;
}

async function poolRaw() {
  if (_pool) return _pool;

  const url = process.env.DATABASE_URL || "";
  if (!url) return null;

  const pg = await import("pg");
  const { Pool } = pg.default || pg;

  _pool = new Pool({
    connectionString: url,
    ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
  });

  return _pool;
}

async function ensureSchema() {
  if (_schemaReady) return;
  const p = await poolRaw();
  if (!p) throw new Error("DATABASE_URL not set");

  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      name TEXT,
      role TEXT,
      team_id TEXT,
      verified BOOLEAN DEFAULT FALSE,
      active INTEGER DEFAULT 1,
      password_hash TEXT
    )
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS account_settings (
      email TEXT PRIMARY KEY,
      require_verified BOOLEAN DEFAULT TRUE,
      tool_access TEXT DEFAULT 'all'
    )
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS team_invites (
      token TEXT PRIMARY KEY,
      team_id TEXT,
      role TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      accepted_at TIMESTAMPTZ,
      accepted_email TEXT
    )
  `);

  _schemaReady = true;
}

async function pool() {
  const p = await poolRaw();
  await ensureSchema();
  return p;
}

async function qOne(sql, params) {
  const p = await pool();
  if (!p) throw new Error("DATABASE_URL not set");
  const r = await p.query(sql, params);
  return r.rows[0] || null;
}

async function q(sql, params) {
  const p = await pool();
  if (!p) throw new Error("DATABASE_URL not set");
  return await p.query(sql, params);
}

export async function getUserByEmail(email) {
  return await qOne(
    `
    select
      email,
      name,
      role,
      team_id,
      verified,
      active,
      password_hash
    from users
    where lower(email) = lower($1)
    limit 1
    `,
    [email]
  );
}

export async function verifyUserPassword(email, passwordPlain) {
  const user = await getUserByEmail(email);
  return user || null;
}

export async function createUser(user) {
  const email = user.email;
  const name = user.name || "";
  const team_id = user.team_id || getDefaultTeamId(email);
  const existingTeamUser = await qOne(
    `select email from users where team_id = $1 limit 1`,
    [team_id]
  );
  const role = user.role || (existingTeamUser ? "member" : "admin");
  const verified = user.verified ? true : false;
  const active = user.active === 0 ? 0 : 1;
  const password_hash = user.password_hash || "";

  const r = await q(
    `
    insert into users (email, name, role, team_id, verified, active, password_hash)
    values (lower($1), $2, $3, $4, $5, $6, $7)
    on conflict (email) do update set
      name = excluded.name,
      role = excluded.role,
      team_id = excluded.team_id,
      verified = excluded.verified,
      active = excluded.active,
      password_hash = excluded.password_hash
    returning email, name, role, team_id, verified, active
    `,
    [email, name, role, team_id, verified, active, password_hash]
  );
  return r.rows[0] || null;
}

export async function setVerified(email, verified) {
  const r = await q(
    `update users set verified = $2 where lower(email) = lower($1) returning email, verified`,
    [email, !!verified]
  );
  return r.rows[0] || null;
}

export async function updatePassword(email, password_hash) {
  const r = await q(
    `update users set password_hash = $2 where lower(email) = lower($1) returning email`,
    [email, password_hash || ""]
  );
  return r.rows[0] || null;
}

export async function getAccountSettings(email) {
  const row = await qOne(
    `
    select email, require_verified, tool_access
    from account_settings
    where lower(email) = lower($1)
    limit 1
    `,
    [email]
  );
  return row || { email, require_verified: true, tool_access: "all" };
}

export async function updateRequireVerified(email, require_verified) {
  const r = await q(
    `
    insert into account_settings (email, require_verified)
    values (lower($1), $2)
    on conflict (email) do update set require_verified = excluded.require_verified
    returning email, require_verified
    `,
    [email, !!require_verified]
  );
  return r.rows[0] || null;
}

export async function updateToolAccess(email, tool_access) {
  const r = await q(
    `
    insert into account_settings (email, tool_access)
    values (lower($1), $2)
    on conflict (email) do update set tool_access = excluded.tool_access
    returning email, tool_access
    `,
    [email, tool_access || "all"]
  );
  return r.rows[0] || null;
}

export async function getTeamAdmin(team_id) {
  return await qOne(
    `
    select email, name, role, team_id
    from users
    where team_id = $1 and role = 'admin'
    limit 1
    `,
    [team_id]
  );
}

export async function acceptInvite(invite_token, email) {
  const r = await q(
    `
    update team_invites
    set accepted_at = now(), accepted_email = lower($2)
    where token = $1 and accepted_at is null
    returning token, team_id, role
    `,
    [invite_token, email]
  );
  return r.rows[0] || null;
}

export default {
  getAccountSettings,
  updateRequireVerified,
  updateToolAccess,
  updatePassword,
  getTeamAdmin,
  setVerified,
  createUser,
  getUserByEmail,
  verifyUserPassword,
  acceptInvite
};
