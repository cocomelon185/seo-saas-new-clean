import React from 'react';

export function ExportToolbar({ onExportMarkdown, onExportJSON, onDownloadMarkdown, onDownloadJSON, copiedSection }) {
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Export & Download</h2>
      <div style={styles.buttonGrid}>
        <button style={styles.button} onClick={onExportMarkdown}>
          {copiedSection === 'markdown' ? '✅ Copied!' : '📋 Copy Markdown'}
        </button>
        <button style={styles.button} onClick={onExportJSON}>
          {copiedSection === 'json' ? '✅ Copied!' : '📋 Copy JSON'}
        </button>
        <button style={{ ...styles.button, ...styles.buttonDownload }} onClick={onDownloadMarkdown}>
          ⬇️ Download MD
        </button>
        <button style={{ ...styles.button, ...styles.buttonDownload }} onClick={onDownloadJSON}>
          ⬇️ Download JSON
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { marginTop: '40px', paddingTop: '40px', borderTop: '1px solid #e2e8f0' },
  heading: { fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1a202c' },
  buttonGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' },
  button: { padding: '12px 16px', fontSize: '14px', fontWeight: '600', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', color: '#2d3748', cursor: 'pointer', transition: 'all 0.2s' },
  buttonDownload: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' },
};
