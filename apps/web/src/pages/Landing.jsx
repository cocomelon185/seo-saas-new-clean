export default function Landing() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px" }}>
      <header style={{ paddingBottom: 32 }}>
        <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: 0 }}>
          Clear SEO decisions. Without the noise.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, marginTop: 16, maxWidth: 720 }}>
          Focused page audits with prioritized fixes, examples, and content guidance you can act on immediately.
        </p>
        <div style={{ marginTop: 20 }}>
          <a
            href="/rank"
            style={{
              display: "inline-block",
              padding: "12px 16px",
              borderRadius: 10,
              textDecoration: "none",
              border: "1px solid rgba(0,0,0,0.15)"
            }}
          >
            Run an Audit
          </a>
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
            Paid, professional SEO tooling.
          </div>
        </div>
      </header>

      <section style={{ padding: "28px 0", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: 22, margin: "0 0 10px" }}>SEO audits designed for action</h2>
        <p style={{ margin: 0, lineHeight: 1.7, maxWidth: 820 }}>
          RankyPulse analyzes individual pages and produces a clear fix plan — so you know what to change first and why it matters.
        </p>
      </section>

      <section style={{ padding: "28px 0", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: 22, margin: "0 0 10px" }}>How it works</h2>
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
          <li>Enter a page URL</li>
          <li>Run a focused audit</li>
          <li>Review prioritized fixes</li>
          <li>Improve with confidence</li>
        </ol>
      </section>

      <section style={{ padding: "28px 0", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: 22, margin: "0 0 10px" }}>What you get</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
          <li>One-sentence page diagnosis</li>
          <li>Priority fix plan (Fix now / next / later)</li>
          <li>Clear explanations and examples</li>
          <li>Content briefs on paid plans</li>
          <li>Audit history and re-runs</li>
        </ul>
      </section>

      <section style={{ padding: "28px 0", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: 22, margin: "0 0 10px" }}>Who it’s for</h2>
        <p style={{ margin: 0, lineHeight: 1.7, maxWidth: 820 }}>
          Built for freelancers, agencies, SaaS teams, and founders who want clarity instead of dashboards.
        </p>
      </section>

      <footer style={{ paddingTop: 28, marginTop: 10, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: 22, margin: "0 0 10px" }}>Start with a real page</h2>
        <p style={{ margin: "0 0 14px", lineHeight: 1.7, maxWidth: 820 }}>
          Run an audit and see what’s holding your page back — clearly.
        </p>
        <a
          href="/rank"
          style={{
            display: "inline-block",
            padding: "12px 16px",
            borderRadius: 10,
            textDecoration: "none",
            border: "1px solid rgba(0,0,0,0.15)"
          }}
        >
          Run an Audit
        </a>
      </footer>
    </div>
  );
}
