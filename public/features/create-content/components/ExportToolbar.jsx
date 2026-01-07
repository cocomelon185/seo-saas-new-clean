import React, { useState } from 'react';

export function ExportToolbar({ onExportMarkdown, onExportJSON, onDownloadMarkdown, onDownloadJSON, copiedSection, briefState }) {
  const [downloadStatus, setDownloadStatus] = useState(null);

  const handleDownload = (handler, type) => {
    handler();
    setDownloadStatus(type);
    setTimeout(() => setDownloadStatus(null), 2000);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Export & Download</h2>
      <div style={styles.buttonGrid}>
        <button 
          style={{
            ...styles.button,
            ...(copiedSection === 'markdown' && styles.buttonSuccess)
          }}
          onClick={onExportMarkdown}
          title="Copy brief as Markdown to clipboard"
        >
          {copiedSection === 'markdown' ? '✅ Copied!' : '📋 Copy Markdown'}
        </button>
        <button 
          style={{
            ...styles.button,
            ...(copiedSection === 'json' && styles.buttonSuccess)
          }}
          onClick={onExportJSON}
          title="Copy brief as JSON to clipboard"
        >
          {copiedSection === 'json' ? '✅ Copied!' : '📋 Copy JSON'}
        </button>
        <button 
          style={{
            ...styles.button,
            ...styles.buttonDownload,
            ...(downloadStatus === 'markdown' && styles.buttonDownloadSuccess)
          }}
          onClick={() => handleDownload(onDownloadMarkdown, 'markdown')}
          title="Download brief as Markdown file"
        >
          {downloadStatus === 'markdown' ? '✅ Downloaded!' : '⬇️ Download MD'}
        </button>
        <button 
          style={{
            ...styles.button,
            ...styles.buttonDownload,
            ...(downloadStatus === 'json' && styles.buttonDownloadSuccess)
          }}
          onClick={() => handleDownload(onDownloadJSON, 'json')}
          title="Download brief as JSON file"
        >
          {downloadStatus === 'json' ? '✅ Downloaded!' : '⬇️ Download JSON'}
        </button>
      </div>
      <p style={styles.hint}>💡 Tip: Copy to clipboard for quick paste into your CMS or editor. Download to save for later.</p>
    </div>
  );
}

const styles = {
  container: { marginTop: '40px', paddingTop: '40px', borderTop: '1px solid #e2e8f0' },
  heading: { fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1a202c' },
  buttonGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' },
  button: { padding: '12px 16px', fontSize: '14px', fontWeight: '600', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', color: '#2d3748', cursor: 'pointer', transition: 'all 0.2s' },
  buttonSuccess: { background: '#34d399', color: 'white', border: 'none' },
  buttonDownload: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' },
  buttonDownloadSuccess: { background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' },
  hint: { fontSize: '12px', color: '#718096', fontStyle: 'italic', margin: '0' },
};

