import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "./auth-store.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-12345";

export default async function signIn(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.active === 0) return res.status(403).json({ error: "Account inactive" });
    const ok = await bcrypt.compare(password, user.password_hash || "");
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.verified) return res.status(403).json({ error: "Email not verified" });
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
    return res.status(500).json({ error: "Failed to sign in" });
  }
}
