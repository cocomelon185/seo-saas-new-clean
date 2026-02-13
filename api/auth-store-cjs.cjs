const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

let _db = null;
function getDb() {
  if (_db) return _db;
  const dbPath = path.join(process.cwd(), "database.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      name TEXT,
      password_hash TEXT,
      verified INTEGER,
      role TEXT,
      team_id TEXT,
      active INTEGER,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS team_settings (
      team_id TEXT PRIMARY KEY,
      require_verified INTEGER
    )
  `).run();
  try { db.prepare("ALTER TABLE team_settings ADD COLUMN allow_audit INTEGER").run(); } catch {}
  try { db.prepare("ALTER TABLE team_settings ADD COLUMN allow_rank INTEGER").run(); } catch {}
  try { db.prepare("ALTER TABLE team_settings ADD COLUMN allow_improve INTEGER").run(); } catch {}
  _db = db;
  return db;
}

function getUserByEmail(email) {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ? LIMIT 1").get(email);
}

function getUserByIdentity(identity) {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM users WHERE lower(email) = lower(?) OR lower(name) = lower(?) OR lower(substr(email, 1, instr(email, '@') - 1)) = lower(?) LIMIT 1"
    )
    .get(identity, identity, identity);
}

function ensureUserColumns() {
  const db = getDb();
  try { db.prepare("ALTER TABLE users ADD COLUMN role TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE users ADD COLUMN team_id TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE users ADD COLUMN active INTEGER").run(); } catch {}
}

function ensureTeamSettings(team_id) {
  const db = getDb();
  const existing = db.prepare("SELECT team_id FROM team_settings WHERE team_id = ?").get(team_id);
  if (!existing) {
    db.prepare("INSERT INTO team_settings (team_id, require_verified, allow_audit, allow_rank, allow_improve) VALUES (?, ?, ?, ?, ?)")
      .run(team_id, 0, 1, 1, 1);
  }
}

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

function createUser({ email, name, password_hash, team_id: incomingTeam, role: incomingRole }) {
  const db = getDb();
  ensureUserColumns();
  const now = new Date().toISOString();
  const team_id = incomingTeam || getDefaultTeamId(email);
  const existingTeamUser = db.prepare("SELECT id FROM users WHERE team_id = ? LIMIT 1").get(team_id);
  const role = incomingRole || (existingTeamUser ? "member" : "admin");
  db.prepare(
    "INSERT INTO users (email, name, password_hash, verified, role, team_id, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(email, name, password_hash, 0, role, team_id, 1, now, now);
  ensureTeamSettings(team_id);
  return getUserByEmail(email);
}

function setVerified(email) {
  const db = getDb();
  ensureUserColumns();
  db.prepare("UPDATE users SET verified = 1, updated_at = ? WHERE email = ?").run(new Date().toISOString(), email);
  return getUserByEmail(email);
}

function updatePassword(email, password_hash) {
  const db = getDb();
  ensureUserColumns();
  db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?").run(password_hash, new Date().toISOString(), email);
  return getUserByEmail(email);
}

function ensureAccountSettingsColumns() {
  const db = getDb();
  try { db.prepare("ALTER TABLE users ADD COLUMN require_verified INTEGER").run(); } catch {}
}

function updateRequireVerified(email, value) {
  ensureAccountSettingsColumns();
  const db = getDb();
  const user = getUserByEmail(email);
  if (!user) return null;
  ensureTeamSettings(user.team_id || "default");
  db.prepare("UPDATE team_settings SET require_verified = ? WHERE team_id = ?")
    .run(value ? 1 : 0, user.team_id || "default");
  return getUserByEmail(email);
}

function updateToolAccess(email, updates = {}) {
  const db = getDb();
  const user = getUserByEmail(email);
  if (!user) return null;
  ensureTeamSettings(user.team_id || "default");
  const fields = [];
  const values = [];
  if (updates.allow_audit !== undefined) {
    fields.push("allow_audit = ?");
    values.push(updates.allow_audit ? 1 : 0);
  }
  if (updates.allow_rank !== undefined) {
    fields.push("allow_rank = ?");
    values.push(updates.allow_rank ? 1 : 0);
  }
  if (updates.allow_improve !== undefined) {
    fields.push("allow_improve = ?");
    values.push(updates.allow_improve ? 1 : 0);
  }
  if (!fields.length) return getUserByEmail(email);
  values.push(user.team_id || "default");
  db.prepare(`UPDATE team_settings SET ${fields.join(", ")} WHERE team_id = ?`).run(...values);
  return getUserByEmail(email);
}

function getAccountSettings(email) {
  ensureAccountSettingsColumns();
  const user = getUserByEmail(email);
  if (!user) return null;
  ensureTeamSettings(user.team_id || "default");
  const db = getDb();
  const team = db.prepare("SELECT require_verified FROM team_settings WHERE team_id = ?").get(user.team_id || "default");
  return {
    email: user.email,
    name: user.name,
    verified: !!user.verified,
    require_verified: !!team?.require_verified,
    allow_audit: team?.allow_audit !== 0,
    allow_rank: team?.allow_rank !== 0,
    allow_improve: team?.allow_improve !== 0,
    role: user.role || "member",
    team_id: user.team_id || "default",
    active: user.active !== 0
  };
}

function listTeamUsers(team_id) {
  const db = getDb();
  ensureUserColumns();
  return db.prepare("SELECT email, name, role, verified, active FROM users WHERE team_id = ? ORDER BY email").all(team_id);
}

function getTeamAdmin(team_id) {
  const db = getDb();
  ensureUserColumns();
  return db.prepare("SELECT email, name FROM users WHERE team_id = ? AND role = 'admin' LIMIT 1").get(team_id);
}

function updateUserRole(team_id, email, role) {
  const db = getDb();
  ensureUserColumns();
  db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE team_id = ? AND email = ?")
    .run(role, new Date().toISOString(), team_id, email);
  return getUserByEmail(email);
}

function updateUserTeam(email, team_id, role) {
  const db = getDb();
  ensureUserColumns();
  db.prepare("UPDATE users SET team_id = ?, role = ?, updated_at = ? WHERE email = ?")
    .run(team_id, role, new Date().toISOString(), email);
  ensureTeamSettings(team_id);
  return getUserByEmail(email);
}

function updateUserActive(team_id, email, active) {
  const db = getDb();
  ensureUserColumns();
  db.prepare("UPDATE users SET active = ?, updated_at = ? WHERE team_id = ? AND email = ?")
    .run(active ? 1 : 0, new Date().toISOString(), team_id, email);
  return getUserByEmail(email);
}

function ensureInviteTable() {
  const db = getDb();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS team_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      team_id TEXT,
      role TEXT,
      token TEXT,
      status TEXT,
      created_at TEXT
    )
  `).run();
}

function createInvite(team_id, email, role, token) {
  const db = getDb();
  ensureInviteTable();
  db.prepare("INSERT INTO team_invites (email, team_id, role, token, status, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(email, team_id, role, token, "pending", new Date().toISOString());
}

function listInvites(team_id) {
  const db = getDb();
  ensureInviteTable();
  return db.prepare("SELECT email, role, token, status, created_at FROM team_invites WHERE team_id = ? ORDER BY created_at DESC").all(team_id);
}

function acceptInvite(token, email) {
  const db = getDb();
  ensureInviteTable();
  const invite = db.prepare("SELECT * FROM team_invites WHERE token = ? AND status = 'pending' LIMIT 1").get(token);
  if (!invite) return null;
  if (invite.email !== email) return { error: "Invite email mismatch" };
  db.prepare("UPDATE team_invites SET status = 'accepted' WHERE token = ?").run(token);
  return invite;
}

function getInvite(token) {
  const db = getDb();
  ensureInviteTable();
  return db.prepare("SELECT email, team_id, role, status FROM team_invites WHERE token = ? LIMIT 1").get(token);
}

module.exports = {
  getUserByEmail,
  getUserByIdentity,
  createUser,
  setVerified,
  updatePassword,
  updateRequireVerified,
  updateToolAccess,
  getAccountSettings,
  listTeamUsers,
  updateUserRole,
  updateUserTeam,
  updateUserActive,
  createInvite,
  listInvites,
  acceptInvite,
  getInvite,
  getTeamAdmin
};
