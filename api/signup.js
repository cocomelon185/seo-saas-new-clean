import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail, acceptInvite } from "./auth-store.js";
import { sendVerifyEmail } from "../lib/emailService.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-12345";

export default async function signUp(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password, name, invite_token } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields required" });
  }
  const strong =
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  if (!strong) {
    return res.status(400).json({ error: "Password too weak" });
  }

  try {
    const exists = getUserByEmail(email);
    if (exists) {
      return res.status(409).json({ error: "Account already exists" });
    }
    const password_hash = await bcrypt.hash(password, 10);
    let team_id;
    let role;
    if (invite_token) {
      const invite = acceptInvite(invite_token, email);
      if (invite?.error) return res.status(400).json({ error: invite.error });
      if (!invite) return res.status(400).json({ error: "Invalid invite" });
      team_id = invite.team_id;
      role = invite.role;
    }
    const created = createUser({ email, name, password_hash, team_id, role });
    const verifyToken = jwt.sign({ email, name }, JWT_SECRET, { expiresIn: "2d" });
    const token = jwt.sign(
      { email, name, verified: false, role: created.role, team_id: created.team_id },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const verifyUrl = `${baseUrl}/auth/verify?token=${encodeURIComponent(verifyToken)}`;
    try {
      await sendVerifyEmail(email, { name, verifyUrl });
    } catch {}
    return res.status(201).json({
      success: true,
      token,
      user: { email, name, verified: false, role: created.role, team_id: created.team_id }
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create account" });
  }
}
