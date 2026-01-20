import { useMemo, useState } from "react";

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const canRun = useMemo(() => {
    try {
      const u = new URL(url.trim());
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, [url]);

  async function runAudit() {
    setError("");
    if (!canRun) {
      setStatus("error");
      setError("Please enter a valid URL (including https://).");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/page-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      });
      if (!res.ok) throw new Error("bad_response");
      const data = await res.json();
      setResult(data);
      setStatus("success");
    } catch {
      setStatus("error");
      setError("We couldn’t analyze this page right now. Please try again.");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>SEO Page Audit</h1>
      <div style={{ marginBottom: 16, opacity: 0.85 }}>
        Analyze any webpage and get instant SEO issues and quick wins.
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/pricing"
          style={{ flex: 1, padding: "12px 14px", fontSize: 16, borderRadius: 10, border: "1px solid #ccc" }}
        />
        <button
          onClick={runAudit}
          disabled={status === "loading"}
          style={{
            padding: "12px 16px",
            fontSize: 16,
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            cursor: status === "loading" ? "not-allowed" : "pointer"
          }}
        >
          Run SEO Audit
        </button>
      </div>

      {status === "idle" && (
        <div style={{ padding: 14, borderRadius: 12, border: "1px dashed #bbb", opacity: 0.85 }}>
          Enter a URL above to run an SEO audit.
        </div>
      )}

      {status === "loading" && (
        <div style={{ padding: 14, borderRadius: 12, border: "1px solid #ddd" }}>
          Analyzing page… this may take up to 20 seconds.
        </div>
      )}

      {status === "error" && (
        <div style={{ padding: 14, borderRadius: 12, border: "1px solid #f2c7c7", background: "#fff5f5" }}>
          {error}
        </div>
      )}

      {status === "success" && (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 12, border: "1px solid #ddd" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>SEO Score</div>
            <div style={{ fontSize: 28 }}>{typeof result?.score === "number" ? result.score : 0}</div>
          </div>

          <div style={{ padding: 14, borderRadius: 12, border: "1px solid #ddd" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Issues / Quick Wins</div>
            {Array.isArray(result?.quick_wins) && result.quick_wins.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {result.quick_wins.slice(0, 10).map((x, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{x}</li>
                ))}
              </ul>
            ) : (
              <div style={{ opacity: 0.85 }}>No major issues detected yet.</div>
            )}
          </div>

          <div style={{ padding: 14, borderRadius: 12, border: "1px solid #ddd" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Summary</div>
            <div style={{ opacity: 0.9 }}>
              {result?.warning ? result.warning : "Audit complete. Review the quick wins above."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
