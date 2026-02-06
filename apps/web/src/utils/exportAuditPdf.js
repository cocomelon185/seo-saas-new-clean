function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function exportAuditPdf(result) {
  if (!result) return;

  const issues = Array.isArray(result.issues) ? result.issues : [];
  const fixNow = issues.filter((i) => i?.priority === "fix_now");
  const quickWins = Array.isArray(result.quick_wins) ? result.quick_wins : [];
  const score = typeof result.score === "number" ? result.score : "—";
  const pageType = result.page_type || "landing";
  const date = new Date().toLocaleString();
  const branding = result.branding || {};
  const brandName = branding.name || "RankyPulse";
  const brandColor = branding.color || "#FF642D";
  const brandLogo = branding.logo || "";

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>RankyPulse Audit</title>
      <style>
        body { font-family: Inter, Arial, sans-serif; color: #111827; margin: 40px; }
        h1 { font-size: 24px; margin: 0 0 6px; }
        h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.2em; color: #6B7280; margin-top: 28px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #F4F5F9; color: #374151; font-size: 11px; }
        .hero { display: flex; justify-content: space-between; gap: 24px; border: 1px solid #E0E5EB; border-radius: 12px; padding: 16px; background: #fff; }
        .stat { font-size: 28px; font-weight: 700; }
        .small { color: #6B7280; font-size: 12px; }
        ul { margin: 8px 0 0 18px; }
        .card { border: 1px solid #E0E5EB; border-radius: 12px; padding: 12px; margin-top: 10px; background: #fff; }
        .row { display: flex; gap: 12px; flex-wrap: wrap; }
      </style>
    </head>
    <body>
      <div class="small">${escapeHtml(brandName)} · ${escapeHtml(date)}</div>
      <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
        ${brandLogo ? `<img src="${escapeHtml(brandLogo)}" alt="${escapeHtml(brandName)}" style="height:36px; width:auto;"/>` : ""}
        <h1 style="margin:0;">SEO Audit Report</h1>
      </div>
      <div class="small">${escapeHtml(result.url || result.final_url || "")}</div>

      <div class="hero" style="margin-top:16px; border-left:6px solid ${escapeHtml(brandColor)};">
        <div>
          <div class="small">SEO Score</div>
          <div class="stat">${escapeHtml(score)}</div>
          <div class="small">Page type: ${escapeHtml(pageType)}</div>
        </div>
        <div>
          <div class="small">Fix now issues</div>
          <div class="stat">${fixNow.length}</div>
          <div class="small">Quick wins: ${quickWins.length}</div>
        </div>
      </div>

      <h2>Quick wins</h2>
      <div class="card">
        ${quickWins.length ? `<ul>${quickWins.slice(0, 10).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>` : `<div class="small">No quick wins detected.</div>`}
      </div>

      <h2>Fix now priorities</h2>
      <div class="card">
        ${fixNow.length ? `<ul>${fixNow.slice(0, 10).map((x) => `<li>${escapeHtml(x.title || x.issue_id || "Issue")}</li>`).join("")}</ul>` : `<div class="small">No fix now issues detected.</div>`}
      </div>

      <h2>Rewrite examples</h2>
      <div class="row">
        ${(Array.isArray(result.rewrite_examples) ? result.rewrite_examples.slice(0, 4) : []).map((ex) => `
          <div class="card" style="min-width: 220px; flex:1;">
            <div class="small">${escapeHtml(ex.label || "")}</div>
            <div style="margin-top:6px;"><strong>Before:</strong> ${escapeHtml(ex.before || "")}</div>
            <div style="margin-top:6px;"><strong>After:</strong> ${escapeHtml(ex.after || "")}</div>
          </div>
        `).join("")}
      </div>
    </body>
  </html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 300);
}
