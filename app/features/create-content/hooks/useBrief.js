import { useState } from 'react';

export function BriefForm({ onGenerateBrief, loading, error }) {
  const [input, setInput] = useState('');
  const [useUrl, setUseUrl] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) {
      alert('Please enter a topic or URL');
      return;
    }
    onGenerateBrief(input, useUrl);
  };

  const handleToggleMode = () => {
    setUseUrl(!useUrl);
    setInput('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Content Brief Generator</h1>
        <p style={styles.subtitle}>
          Generate an SEO-optimized content brief in seconds
        </p>

        {/* Mode Toggle */}
        <div style={styles.modeToggle}>
          <button
            type="button"
            style={{
              ...styles.toggleButton,
              ...(useUrl === false && styles.toggleButtonActive),
            }}
            onClick={() => useUrl && handleToggleMode()}
          >
            By Topic
          </button>
          <button
            type="button"
            style={{
              ...styles.toggleButton,
              ...(useUrl === true && styles.toggleButtonActive),
            }}
            onClick={() => !useUrl && handleToggleMode()}
          >
            By URL
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              {useUrl ? 'Enter URL' : 'Enter Topic'}
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                useUrl
                  ? 'https://example.com/article'
                  : 'e.g., ecommerce SEO strategies'
              }
              style={styles.input}
              disabled={loading}
            />
            <p style={styles.helperText}>
              {useUrl
                ? 'Paste a competitor URL to analyze'
                : 'Describe the topic you want to write about'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={styles.errorBox}>
              <p style={styles.errorText}>❌ {error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(loading && styles.submitButtonLoading),
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={styles.spinner}>⏳</span> Generating Brief...
              </>
            ) : (
              <>
                <span style={styles.sparkle}>✨</span> Generate Brief
              </>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div style={styles.infoBox}>
          <p style={styles.infoTitle}>💡 What you'll get:</p>
          <ul style={styles.infoList}>
            <li>5-point content outline</li>
            <li>Primary & secondary keywords</li>
            <li>SEO checklist (5 items)</li>
            <li>Internal linking strategy</li>
            <li>Word count recommendations (1200-1800 words)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: '600px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    padding: '40px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 10px 0',
    color: '#1a202c',
  },
  subtitle: {
    fontSize: '16px',
    color: '#718096',
    margin: '0 0 30px 0',
    lineHeight: '1.5',
  },
  modeToggle: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    background: '#f7fafc',
    padding: '4px',
    borderRadius: '8px',
  },
  toggleButton: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    color: '#718096',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  toggleButtonActive: {
    background: 'white',
    color: '#2d3748',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  form: {
    marginBottom: '30px',
  },
  inputGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    outline: 'none',
  },
  helperText: {
    fontSize: '12px',
    color: '#a0aec0',
    margin: '8px 0 0 0',
  },
  errorBox: {
    background: '#fed7d7',
    border: '1px solid #fc8181',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  errorText: {
    fontSize: '14px',
    color: '#c53030',
    margin: 0,
  },
  submitButton: {
    width: '100%',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  submitButtonLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  spinner: {
    display: 'inline-block',
    fontSize: '18px',
  },
  sparkle: {
    fontSize: '16px',
  },
  infoBox: {
    background: '#edf2f7',
    border: '1px solid #cbd5e0',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px',
  },
  infoTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748',
    margin: '0 0 12px 0',
  },
  infoList: {
    fontSize: '14px',
    color: '#4a5568',
    margin: 0,
    paddingLeft: '20px',
    listStyle: 'none',
  },
};

