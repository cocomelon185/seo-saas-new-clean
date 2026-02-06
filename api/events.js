import fs from "fs";
import path from "path";

export default async function events(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  try {
    const body = req.body || {};
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "events.jsonl");
    const line = JSON.stringify({
      event: body.event,
      payload: body.payload || {},
      ts: body.ts || Date.now(),
      url: body.url || "",
      ua: body.ua || ""
    }) + "\n";
    fs.appendFileSync(file, line, "utf8");
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
