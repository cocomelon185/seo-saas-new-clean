import { useState } from 'react';
import './App.css';

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
      const response = await fetch(API_BASE + '/api/page-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
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
              <div className="score">{result.score}</div>
              <div className="label">SEO Score</div>
            </div>

            {result.issues && (
              <div className="issues">
                <h2>Issues</h2>
                <ul>
                  {result.issues.map((issue, i) => (
                    <li key={i} className={'sev-' + issue.sev.toLowerCase()}>
                      <strong>{issue.sev}</strong> {issue.msg}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.keywords && (
              <div className="keywords">
                <h2>Keywords</h2>
                <div className="tags">
                  {result.keywords.slice(0, 10).map((kw, i) => (
                    <span key={i} className="tag">{kw}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
