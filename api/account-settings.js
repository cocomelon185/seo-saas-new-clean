import jwt from "jsonwebtoken";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { getAccountSettings, updateRequireVerified, updateToolAccess } = require("./auth-store.js");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-12345";

function getToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return "";
  return auth.split(" ")[1];
}

export default async function accountSettings(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const email = payload?.email;
  if (!email) return res.status(400).json({ error: "Invalid user" });

  if (req.method === "GET") {
    const settings = getAccountSettings(email);
    return res.json({ ok: true, settings });
  }

  if (req.method === "POST") {
    const current = getAccountSettings(email);
    if (!current) return res.status(404).json({ error: "User not found" });
    if (current.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }
    const require_verified = req.body?.require_verified !== undefined ? Boolean(req.body.require_verified) : undefined;
    const allow_audit = req.body?.allow_audit !== undefined ? Boolean(req.body.allow_audit) : undefined;
    const allow_rank = req.body?.allow_rank !== undefined ? Boolean(req.body.allow_rank) : undefined;
    const allow_improve = req.body?.allow_improve !== undefined ? Boolean(req.body.allow_improve) : undefined;
    if (require_verified !== undefined) updateRequireVerified(email, require_verified);
    updateToolAccess(email, { allow_audit, allow_rank, allow_improve });
    const updated = getAccountSettings(email);
    return res.json({
      ok: true,
      settings: {
        email: updated.email,
        name: updated.name,
        verified: !!updated.verified,
        require_verified: !!updated.require_verified,
        allow_audit: !!updated.allow_audit,
        allow_rank: !!updated.allow_rank,
        allow_improve: !!updated.allow_improve,
        role: updated.role,
        team_id: updated.team_id
      }
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
