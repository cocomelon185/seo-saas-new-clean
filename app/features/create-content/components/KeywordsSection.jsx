import React, { useState } from 'react';

export function KeywordsSection({ keywords, onCopyKeywords }) {
  const [copiedKeyword, setCopiedKeyword] = useState(null);

  const handleCopyKeyword = (kw) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 2000);
    onCopyKeywords?.(kw);
  };

  if (!keywords || (!keywords.primary && !keywords.secondary)) return null;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Keywords</h2>
      <div style={styles.grid}>
        <div style={styles.keywordGroup}>
          <h3 style={styles.groupTitle}>Primary Keywords</h3>
          <div style={styles.tagContainer}>
            {keywords.primary?.map((kw, idx) => (
              <button
                key={idx}
                style={{
                  ...styles.tag,
                  ...(copiedKeyword === kw && styles.tagCopied)
                }}
                onClick={() => handleCopyKeyword(kw)}
                title="Click to copy"
              >
                {kw} <span style={styles.tagCopy}>{copiedKeyword === kw ? '✓' : '📋'}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={styles.keywordGroup}>
          <h3 style={styles.groupTitle}>Secondary Keywords</h3>
          <div style={styles.tagContainer}>
            {keywords.secondary?.map((kw, idx) => (
              <button
                key={idx}
                style={{
                  ...styles.tagSecondary,
                  ...(copiedKeyword === kw && styles.tagSecondaryCopied)
                }}
                onClick={() => handleCopyKeyword(kw)}
                title="Click to copy"
              >
                {kw} <span style={styles.tagCopy}>{copiedKeyword === kw ? '✓' : '📋'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { marginBottom: '40px' },
  heading: { fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1a202c' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  keywordGroup: { background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  groupTitle: { fontSize: '14px', fontWeight: '600', color: '#2d3748', margin: '0 0 12px 0' },
  tagContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tag: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '20px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', border: 'none', boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)' },
  tagCopied: { background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', boxShadow: '0 2px 8px rgba(52, 211, 153, 0.3)' },
  tagSecondary: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#cbd5e0', color: '#2d3748', borderRadius: '20px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', border: 'none' },
  tagSecondaryCopied: { background: '#34d399', color: 'white' },
  tagCopy: { fontSize: '12px', opacity: 0.9 },
};
