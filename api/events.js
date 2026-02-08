import fs from "fs";
import path from "path";

export default async function events(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  try {
    const body = req.body || {};
    const primaryDir = process.env.EVENTS_DIR || path.join(process.cwd(), "data");
    let dir = primaryDir;
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
    } catch {
      dir = path.join(process.env.TMPDIR || "/tmp", "rankypulse-events");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    const file = path.join(dir, "events.jsonl");
    const line = JSON.stringify({
      event: body.event,
      payload: body.payload || {},
      ts: body.ts || Date.now(),
      url: body.url || "",
      ua: body.ua || ""
    }) + "\n";
    try {
      fs.appendFileSync(file, line, "utf8");
    } catch (e) {
      console.warn("[events] write_failed", String(e?.message || e));
    }
    return res.json({ ok: true });
  } catch (e) {
    return res.json({ ok: true, warn: String(e?.message || e) });
  }
}
