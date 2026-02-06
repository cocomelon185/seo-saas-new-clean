import fs from "fs";
import path from "path";

export default function registerAnalytics(app) {
  app.get("/api/analytics/funnel", (req, res) => {
    try {
      const days = Math.max(1, Math.min(90, Number(req.query.days || 30)));
      const since = Date.now() - days * 24 * 60 * 60 * 1000;
      const file = path.join(process.cwd(), "data", "events.jsonl");
      if (!fs.existsSync(file)) {
        return res.json({
          ok: true,
          window_days: days,
          counts: { signup: 0, audit_run: 0, upgrade_clicked: 0, subscribed: 0 },
          error: null
        });
      }
      const raw = fs.readFileSync(file, "utf8");
      const lines = raw.split("\n").filter(Boolean);
      const counts = { signup: 0, audit_run: 0, upgrade_clicked: 0, subscribed: 0 };
      for (const line of lines) {
        try {
          const evt = JSON.parse(line);
          if (!evt?.event || !evt?.ts) continue;
          if (Number(evt.ts) < since) continue;
          if (evt.event in counts) counts[evt.event] += 1;
        } catch {}
      }
      return res.json({ ok: true, window_days: days, counts, error: null });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });
}
