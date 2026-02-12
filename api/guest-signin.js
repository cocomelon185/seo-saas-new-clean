import jwt from "jsonwebtoken";
import { getUserByEmail } from "./auth-store.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-12345";

export default async function guestSignIn(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const enabled = String(process.env.GUEST_LOGIN_ENABLED || "false").toLowerCase() === "true";
  if (!enabled) return res.status(404).json({ error: "Guest login disabled" });

  const email = process.env.GUEST_EMAIL || "";
  if (!email) return res.status(500).json({ error: "Guest login not configured" });

  try {
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "Guest account missing" });
    if (user.active === 0) return res.status(403).json({ error: "Account inactive" });
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
    const detail = String(error?.message || error);
    console.error("guest_signin_error", detail);
    return res.status(500).json({ error: "Failed to sign in", detail });
  }
}
