import { Resend } from "resend";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function isEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "method_not_allowed" });

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const email = String(body.email || "").trim();
    const reportUrl = String(body.reportUrl || "").trim();

    if (!isEmail(email)) return json(res, 400, { ok: false, error: "invalid_email" });
    if (!reportUrl || !reportUrl.startsWith("http")) return json(res, 400, { ok: false, error: "invalid_report_url" });

    const apiKey = process.env.RESEND_API_KEY || "";
    if (!apiKey) return json(res, 500, { ok: false, error: "resend_not_configured" });

    const from = process.env.LEADS_FROM_EMAIL || "RankyPulse <noreply@rankypulse.com>";

    console.log(JSON.stringify({
      kind: "lead_capture",
      ts: new Date().toISOString(),
      email,
      reportUrl,
      ua: req.headers["user-agent"] || "",
      ip: req.headers["x-forwarded-for"] || ""
    }));

    const resend = new Resend(apiKey);

    const subject = "Your RankyPulse SEO report";
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.4">
        <h2>Your SEO report is ready</h2>
        <p>Here’s your report link:</p>
        <p><a href="${reportUrl}">${reportUrl}</a></p>
        <hr/>
        <p>Want weekly monitoring and alerts when rankings change?</p>
        <p><a href="https://rankypulse.com/pricing">Enable weekly monitoring</a></p>
      </div>
    `;

    await resend.emails.send({ from, to: email, subject, html });

    return json(res, 200, { ok: true });
  } catch (e) {
    console.error("lead_api_error", e?.message || String(e));
    return json(res, 500, { ok: false, error: "server_error" });
  }
}
