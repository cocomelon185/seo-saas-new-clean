import { Link } from "react-router-dom";

export default function Projects() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>RankyPulse</h1>
          <p style={{ marginTop: 8, opacity: 0.8 }}>Choose a project to start.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 18 }}>
        <Link
          to="/rank"
          style={{
            display: "block",
            padding: 18,
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 12,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>SEO Ranking</div>
          <div style={{ marginTop: 8, opacity: 0.8 }}>
            Track keywords, rankings, and progress.
          </div>
          <div style={{ marginTop: 14, fontWeight: 600 }}>Open →</div>
        </Link>

        <Link
          to="/audit"
          style={{
            display: "block",
            padding: 18,
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 12,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>SEO Audit</div>
          <div style={{ marginTop: 8, opacity: 0.8 }}>
            Run audits and get prioritized fixes.
          </div>
          <div style={{ marginTop: 14, fontWeight: 600 }}>Open →</div>
        </Link>
      </div>
    </div>
  );
}
