export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "method_not_allowed" });
      return;
    }

    const maxBytes = 50_000;
    const raw = typeof req.body === "string" ? req.body : null;

    let body = req.body;
    if (raw && raw.length > maxBytes) {
      res.status(413).json({ ok: false, error: "payload_too_large" });
      return;
    }

    if (raw) {
      try { body = JSON.parse(raw); } catch { body = { raw }; }
    }

    const evt = {
      kind: "client_telemetry",
      ts: new Date().toISOString(),
      ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
      ua: req.headers["user-agent"] || "",
      referer: req.headers["referer"] || "",
      ...body
    };

    console.log(JSON.stringify(evt));

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("telemetry_handler_error", e?.message || String(e));
    res.status(200).json({ ok: true });
  }
}
