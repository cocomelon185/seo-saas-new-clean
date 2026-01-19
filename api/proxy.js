import https from "https";

export default function handler(req, res) {
  const raw = req.query?.path ?? "/";
  const path = typeof raw === "string" ? raw : String(raw?.[0] ?? "/");

  const target = new URL("https://api.rankypulse.com" + (path.startsWith("/") ? path : "/" + path));
  const method = req.method || "GET";

  const headers = { ...(req.headers || {}) };
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];

  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);

    const upstream = https.request(
      {
        hostname: target.hostname,
        port: 443,
        method,
        path: target.pathname + target.search,
        headers: { ...headers, "content-length": body.length }
      },
      (r) => {
        res.statusCode = r.statusCode || 502;
        for (const [k, v] of Object.entries(r.headers || {})) {
          if (v !== undefined) res.setHeader(k, v);
        }
        r.on("data", (d) => res.write(d));
        r.on("end", () => res.end());
      }
    );

    upstream.on("error", (e) => {
      res.statusCode = 502;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "upstream_error", message: String(e?.message || e) }));
    });

    if (body.length) upstream.write(body);
    upstream.end();
  });
}
