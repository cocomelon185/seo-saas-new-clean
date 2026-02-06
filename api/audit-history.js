import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { add, list } = require("./audit-history-store.cjs");

export default function registerAuditHistory(app) {
  app.get("/api/audit-history", async (req, res) => {
    const limit = Number(req.query.limit || 10) || 10;
    const history = await list(limit);
    res.json({ ok: true, history });
  });

  app.post("/api/audit-history", async (req, res) => {
    const limit = Number(req.query.limit || 10) || 10;
    const history = await add(req.body || {}, limit);
    res.json({ ok: true, history });
  });
}
