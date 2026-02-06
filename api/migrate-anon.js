import fs from "fs";
import path from "path";

export default async function migrateAnon(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { anon_id, user_id } = req.body || {};
  if (!anon_id || !user_id) {
    return res.status(400).json({ error: "Missing anon_id or user_id" });
  }

  try {
    const dbPath = path.join(process.cwd(), "database.db");
    if (!fs.existsSync(dbPath)) {
      return res.status(200).json({ ok: true, migrated: [] });
    }
    const Database = require("better-sqlite3");
    const db = new Database(dbPath);
    const tables = ["embed_leads", "weekly_subscriptions", "wp_connections", "shopify_connections"];
    const migrated = [];
    tables.forEach((table) => {
      try {
        const col = table === "weekly_subscriptions" ? "email" : "owner_id";
        db.prepare(`UPDATE ${table} SET ${col} = ? WHERE ${col} = ?`).run(user_id, anon_id);
        migrated.push(table);
      } catch {}
    });
    return res.json({ ok: true, migrated });
  } catch (e) {
    return res.status(500).json({ error: "Migration failed" });
  }
}
