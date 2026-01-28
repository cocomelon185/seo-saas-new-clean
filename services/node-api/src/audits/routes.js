const express = require("express");

function getUserId(req) {
  const h = req.headers["x-user-id"];
  if (typeof h === "string" && h.trim()) return h.trim();
  if (req.user && (req.user.id || req.user.user_id)) return String(req.user.id || req.user.user_id);
  return "anon";
}

function makeAuditRoutes(store) {
  const r = express.Router();

  r.get("/audits", (req, res) => {
    const user_id = getUserId(req);
    const url = typeof req.query.url === "string" ? req.query.url : null;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const items = store.listAudits({ user_id, url, limit });
    res.json({ ok: true, items: items.map(x => ({ id: x.id, created_at: x.created_at, url: x.url, label: x.label, score: x?.result?.score ?? null })) });
  });

  r.get("/audits/:id", (req, res) => {
    const user_id = getUserId(req);
    const rec = store.getAudit({ user_id, id: req.params.id });
    if (!rec) return res.status(404).json({ ok: false, error: "not_found" });
    res.json({ ok: true, item: rec });
  });

  r.post("/audits/save", express.json({ limit: "2mb" }), (req, res) => {
    const user_id = getUserId(req);
    const url = req.body && req.body.url;
    const result = req.body && req.body.result;
    const label = req.body && req.body.label ? String(req.body.label) : null;
    if (!url || !result) return res.status(400).json({ ok: false, error: "missing_url_or_result" });
    const rec = store.saveAudit({ user_id, url, result, label });
    res.json({ ok: true, id: rec.id, created_at: rec.created_at });
  });

  r.get("/audits/compare", (req, res) => {
    const user_id = getUserId(req);
    const before_id = typeof req.query.before === "string" ? req.query.before : null;
    const after_id = typeof req.query.after === "string" ? req.query.after : null;
    if (!before_id || !after_id) return res.status(400).json({ ok: false, error: "missing_before_or_after" });
    const cmp = store.compareAudits({ user_id, before_id, after_id });
    if (!cmp) return res.status(404).json({ ok: false, error: "not_found" });
    res.json({ ok: true, compare: cmp });
  });

  return r;
}

module.exports = { makeAuditRoutes };
