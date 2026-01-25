import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const detector = await import("../src/detectors/http_status_redirect_hygiene.js");

async function main() {
  const dir = path.join(__dirname, "..", "fixtures", "http_status_redirect_hygiene");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const out = [];
  for (const f of files) {
    const p = path.join(dir, f);
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    const issues = await detector.default.run({
      url: data.url,
      timeouts: { httpMs: 15000 },
      userAgent: "RankyPulseFixtureRunner/1.0",
    });
    out.push({ fixture: f, url: data.url, issues });
  }
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

main().catch((e) => {
  process.stderr.write(String(e?.stack || e) + "\n");
  process.exit(1);
});
