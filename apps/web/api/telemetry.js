export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "method_not_allowed" });
      return;
    }

    const evt = {
      kind: "client_telemetry",
      ts: new Date().toISOString(),
      ip: req.headers["x-forwarded-for"] || "",
      ua: req.headers["user-agent"] || "",
      referer: req.headers["referer"] || "",
      ...(req.body || {})
    };

    console.log(JSON.stringify(evt));
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("telemetry_handler_error", e?.message || String(e));
    res.status(200).json({ ok: true });
  }
}
