import { useState } from "react";
import AuditView from "./AuditView.jsx";
import "./index.css";

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const resetDemo = () => {
    setUrl("");
    setResult(null);
    setError("");
    setLoading(false);
  };

  const analyze = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(
        "/api/audit?url=" + encodeURIComponent(url)
      );
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error?.message || "Audit failed");
      }

      setResult(data.data || data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-container">

        <header className="app-header">
          <h1 className="logo">RankyPulse</h1>
          <p className="tagline">SEO clarity in one click</p>
        </header>

        <section className="hero">
          <form onSubmit={analyze} className="hero-form">
            <input
              type="text"
              placeholder="example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Analyzing…" : "Analyze"}
            </button>
          </form>

          <button className="reset-link" onClick={resetDemo}>
            Reset demo
          </button>

          {error && <div className="error">{error}</div>}
        </section>

        {result && (
          <section className="results">
            <AuditView auditData={result} />
          </section>
        )}

      </div>
    </div>
  );
}
