import React from 'react';

export function OutlineSection({ outline, expandedStep, onToggleExpand, onCopyStep }) {
  if (!outline || outline.length === 0) return null;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Content Outline</h2>
      <div style={styles.outlineList}>
        {outline.map((step) => (
          <div key={step.step} style={styles.outlineCard}>
            <button style={styles.stepHeader} onClick={() => onToggleExpand(step.step)}>
              <span style={styles.stepNumber}>{step.step}</span>
              <span style={styles.stepTitle}>{step.title}</span>
              <span style={styles.expandIcon}>{expandedStep === step.step ? '▼' : '▶'}</span>
            </button>
            {expandedStep === step.step && (
              <div style={styles.stepContent}>
                <p style={styles.description}>{step.description}</p>
                <button style={styles.copyBtn} onClick={() => onCopyStep(step.description)}>📋 Copy</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { marginBottom: '40px' },
  heading: { fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1a202c' },
  outlineList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  outlineCard: { border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#f7fafc' },
  stepHeader: { width: '100%', padding: '16px', background: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left' },
  stepNumber: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: '#667eea', color: 'white', borderRadius: '50%', fontWeight: '600', fontSize: '14px', flexShrink: 0 },
  stepTitle: { flex: 1, fontWeight: '600', color: '#2d3748' },
  expandIcon: { color: '#718096', fontSize: '12px' },
  stepContent: { padding: '16px', background: '#edf2f7', borderTop: '1px solid #e2e8f0' },
  description: { fontSize: '14px', lineHeight: '1.6', color: '#4a5568', margin: '0 0 12px 0' },
  copyBtn: { padding: '6px 12px', fontSize: '12px', background: 'white', border: '1px solid #cbd5e0', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', color: '#2d3748' },
};

