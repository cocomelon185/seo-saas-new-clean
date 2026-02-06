import { createRequire } from "module";
const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken");
const {
  getAccountSettings,
  listTeamUsers,
  updateUserRole,
  updateUserTeam,
  updateUserActive,
  createInvite,
  listInvites,
  acceptInvite,
  getInvite
} = require("./auth-store");
const { sendTeamInviteEmail } = require("../lib/emailService.js");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-12345";

function getToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return "";
  return auth.split(" ")[1];
}

function auth(req) {
  const token = getToken(req);
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function teamMembers(req, res) {
  const payload = auth(req);
  if (!payload?.email) return res.status(401).json({ error: "Unauthorized" });
  const settings = getAccountSettings(payload.email);
  if (!settings) return res.status(404).json({ error: "User not found" });

  if (req.method === "GET") {
    const members = listTeamUsers(settings.team_id);
    return res.json({ ok: true, members, role: settings.role, team_id: settings.team_id });
  }

  if (req.method === "POST") {
    if (settings.role !== "admin") return res.status(403).json({ error: "Admin only" });
    const { email, role, action } = req.body || {};
    if (!email) return res.status(400).json({ error: "Missing email" });
    if (action === "deactivate") {
      updateUserActive(settings.team_id, email, false);
    } else if (action === "activate") {
      updateUserActive(settings.team_id, email, true);
    } else {
      if (!role) return res.status(400).json({ error: "Missing role" });
      updateUserRole(settings.team_id, email, role);
    }
    const members = listTeamUsers(settings.team_id);
    return res.json({ ok: true, members });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export async function teamInvites(req, res) {
  const payload = auth(req);
  if (!payload?.email) return res.status(401).json({ error: "Unauthorized" });
  const settings = getAccountSettings(payload.email);
  if (!settings) return res.status(404).json({ error: "User not found" });

  if (req.method === "GET") {
    const invites = listInvites(settings.team_id);
    return res.json({ ok: true, invites });
  }

  if (req.method === "POST") {
    if (settings.role !== "admin") return res.status(403).json({ error: "Admin only" });
    const { email, role } = req.body || {};
    if (!email || !role) return res.status(400).json({ error: "Missing email or role" });
    const token = Math.random().toString(36).slice(2);
    createInvite(settings.team_id, email, role, token);
    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const inviteUrl = `${baseUrl}/auth/signup?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    try {
      await sendTeamInviteEmail(email, { inviteUrl, team_id: settings.team_id, role });
    } catch {}
    const invites = listInvites(settings.team_id);
    return res.json({ ok: true, invites });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export { acceptInvite };

export async function inviteInfo(req, res) {
  const token = String(req.query?.token || "").trim();
  if (!token) return res.status(400).json({ error: "Missing token" });
  const invite = getInvite(token);
  if (!invite) return res.status(404).json({ error: "Invite not found" });
  return res.json({ ok: true, invite });
}

export async function acceptInviteExisting(req, res) {
  const payload = auth(req);
  if (!payload?.email) return res.status(401).json({ error: "Unauthorized" });
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: "Missing token" });
  const invite = acceptInvite(token, payload.email);
  if (!invite) return res.status(400).json({ error: "Invalid invite" });
  if (invite.error) return res.status(400).json({ error: invite.error });
  updateUserTeam(payload.email, invite.team_id, invite.role);
  return res.json({ ok: true });
}
