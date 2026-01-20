import { useState } from "react";

export default function RankPage() {
  const [keyword, setKeyword] = useState("");
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function checkRank() {
    setError("");
    if (!keyword.trim() || !domain.trim()) {
      setStatus("error");
      setError("Enter a keyword and a domain to check rank.");
      return;
    }
    setStatus("loading");
    try {
      setResult({ keyword: keyword.trim(), domain: domain.trim(), rank: "—" });
      setStatus("success");
    } catch {
      setStatus("error");
      setError("We couldn’t check rank right now. Please try again.");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Rank Checker</h1>
      <div style={{ marginBottom: 16, opacity: 0.85 }}>
        Check where your domain ranks for a keyword.
      </div>

      <div style={{ display: "grid", gap: 12, marginBottom: 14 }}>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Keyword (e.g., seo audit tool)"
          style={{ padding: "12px 14px", fontSize: 16, borderRadius: 10, border: "1px solid #ccc" }}
        />
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Domain (e.g., rankypulse.com)"
          style={{ padding: "12px 14px", fontSize: 16, borderRadius: 10, border: "1px solid #ccc" }}
        />
        <button
          onClick={checkRank}
          disabled={status === "loading"}
          style={{
            padding: "12px 16px",
            fontSize: 16,
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            cursor: status === "loading" ? "not-allowed" : "pointer",
            width: 180
          }}
        >
          Check Rank
        </button>
      </div>

      {status === "idle" && (
        <div style={{ padding: 14, borderRadius: 12, border: "1px dashed #bbb", opacity: 0.85 }}>
          Enter a keyword and domain above to check rank.
        </div>
      )}

      {status === "loading" && (
        <div style={{ padding: 14, borderRadius: 12, border: "1px solid #ddd" }}>
          Checking rank…
        </div>
      )}

      {status === "error" && (
        <div style={{ padding: 14, borderRadius: 12, border: "1px solid #f2c7c7", background: "#fff5f5" }}>
          {error}
        </div>
      )}

      {status === "success" && (
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, border: "1px solid #ddd" }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Result</div>
          <div style={{ display: "grid", gap: 6, opacity: 0.95 }}>
            <div><b>Keyword:</b> {result.keyword}</div>
            <div><b>Domain:</b> {result.domain}</div>
            <div><b>Rank:</b> {result.rank}</div>
          </div>
        </div>
      )}
    </div>
  );
}
