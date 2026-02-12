import { getUserByEmail } from "./auth-store.js";
import { sendUsernameReminder } from "../lib/emailService.js";

export default async function forgotUsername(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const user = await getUserByEmail(email);
    // Privacy-safe: always return ok so users cannot enumerate accounts.
    if (user?.email) {
      const username = String(user.email).split("@")[0];
      try {
        await sendUsernameReminder(user.email, { username });
      } catch {}
    }
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Failed to process request" });
  }
}

