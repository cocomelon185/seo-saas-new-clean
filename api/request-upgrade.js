import jwt from "jsonwebtoken";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { getAccountSettings, getTeamAdmin } = require("./auth-store.js");
import { sendUpgradeRequest } from "../lib/emailService.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-12345";

function getToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return "";
  return auth.split(" ")[1];
}

export default async function requestUpgrade(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const settings = getAccountSettings(payload.email);
  if (!settings) return res.status(404).json({ error: "User not found" });

  const admin = getTeamAdmin(settings.team_id);
  if (!admin?.email) return res.status(404).json({ error: "No admin found" });

  const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
  const pricingUrl = `${baseUrl}/pricing`;
  try {
    await sendUpgradeRequest(admin.email, {
      requester: payload.email,
      team_id: settings.team_id,
      pricingUrl
    });
  } catch {}

  return res.json({ ok: true });
}
