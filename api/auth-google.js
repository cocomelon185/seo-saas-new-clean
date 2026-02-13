import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const store = require("./auth-store-cjs.cjs");

const {
  getUserByEmail,
  createUser,
  setVerified,
  acceptInvite,
  updateUserRole
} = store;

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-12345";
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.GSC_CLIENT_ID ||
  process.env.VITE_GOOGLE_CLIENT_ID ||
  "";

function normalizeEmail(email) {
  const lower = String(email || "").trim().toLowerCase();
  const [localRaw, domainRaw] = lower.split("@");
  const local = localRaw || "";
  const domain = domainRaw || "";
  if (!local || !domain) return lower;
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const gmailLocal = local.split("+")[0].replace(/\./g, "");
    return `${gmailLocal}@gmail.com`;
  }
  return `${local}@${domain}`;
}

const OWNER_EMAILS = new Set(
  String(process.env.OWNER_EMAILS || process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((v) => normalizeEmail(v))
    .filter(Boolean)
);

async function verifyGoogleCredential(credential) {
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const data = await resp.json();
  if (!data?.email) return null;
  if (GOOGLE_CLIENT_ID && data.aud !== GOOGLE_CLIENT_ID) return null;
  if (!(data.email_verified === true || data.email_verified === "true")) return null;
  return data;
}

export default async function googleAuth(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: "Google auth not configured" });

  try {
    const { credential, invite_token } = req.body || {};
    if (!credential) return res.status(400).json({ error: "Missing credential" });

    const profile = await verifyGoogleCredential(credential);
    if (!profile) return res.status(401).json({ error: "Invalid Google token" });

    const email = String(profile.email || "").trim().toLowerCase();
    const name = String(profile.name || profile.given_name || "Google User").trim();
    if (!email) return res.status(400).json({ error: "Missing email" });

    let user = getUserByEmail(email);
    if (user && user.active === 0) return res.status(403).json({ error: "Account inactive" });

    if (!user) {
      let team_id;
      let role;
      if (invite_token) {
        const invite = acceptInvite(invite_token, email);
        if (invite?.error) return res.status(400).json({ error: invite.error });
        if (invite) {
          team_id = invite.team_id;
          role = invite.role;
        }
      }
      const password_hash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
      user = createUser({ email, name, password_hash, team_id, role });
    }

    if (!user.verified) {
      setVerified(email);
    }

    const normalized = normalizeEmail(email);
    const shouldBeAdmin = OWNER_EMAILS.has(normalized);
    if (shouldBeAdmin && user.role !== "admin") {
      updateUserRole(user.team_id, email, "admin");
      user = getUserByEmail(email) || user;
    }

    const token = jwt.sign(
      { email, name: user.name, verified: true, role: user.role, team_id: user.team_id },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        email,
        name: user.name,
        verified: true,
        role: user.role,
        team_id: user.team_id,
        active: user.active !== 0
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to authenticate with Google" });
  }
}
