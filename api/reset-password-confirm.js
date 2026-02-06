import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { updatePassword } = require("./auth-store.js");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-12345";

export default async function resetPasswordConfirm(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: "Token and password required" });
  const strong =
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  if (!strong) return res.status(400).json({ error: "Password too weak" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload?.action !== "reset") return res.status(400).json({ error: "Invalid token" });
    const password_hash = await bcrypt.hash(password, 10);
    updatePassword(payload.email, password_hash);
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: "Invalid or expired token" });
  }
}
