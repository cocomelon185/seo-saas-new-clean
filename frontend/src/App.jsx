import { useState } from 'react';
import './App.css';
import AuditView from './AuditView';

export default function App() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || 'https://api.rankypulse.com';

  const analyze = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(
        API_BASE + '/api/audit?url=' + encodeURIComponent(url)
      );
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('API Error:', err);
      setError('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>RankyPulse</h1>
        <p>SEO Audit in One Click</p>
      </header>

      <main className="container">
        <form onSubmit={analyze} className="form">
          <div className="input-group">
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input"
            />
            <button type="submit" disabled={loading} className="btn">
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </form>

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="results">
            <div className="score-card">
              <div className="score">{result.overview.score[0]}</div>
              <div className="label">SEO Score</div>
            </div>

            <AuditView auditData={result} />
          </div>
        )}
      </main>
    </div>
  );
}
