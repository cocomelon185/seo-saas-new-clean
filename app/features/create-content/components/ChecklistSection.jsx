import React from 'react';

export function ChecklistSection({ checklist, onToggleItem }) {
  if (!checklist || checklist.length === 0) return null;

  const completedCount = checklist.filter(item => item.completed).length;
  const progress = Math.round((completedCount / checklist.length) * 100);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>SEO Checklist</h2>
        <span style={styles.progress}>{completedCount}/{checklist.length}</span>
      </div>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
      <div style={styles.checklistItems}>
        {checklist.map((item) => (
          <label key={item.id} style={styles.checklistItem}>
            <input 
              type="checkbox" 
              checked={item.completed} 
              onChange={() => onToggleItem(item.id)} 
              style={styles.checkbox} 
            />
            <span style={{ 
              ...styles.itemText, 
              textDecoration: item.completed ? 'line-through' : 'none', 
              color: item.completed ? '#a0aec0' : '#2d3748',
              transition: 'all 0.2s'
            }}>
              {item.title}
            </span>
            {item.completed && <span style={styles.checkmark}>✓</span>}
          </label>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { marginBottom: '40px', background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  heading: { fontSize: '20px', fontWeight: '700', margin: 0, color: '#1a202c' },
  progress: { fontSize: '14px', fontWeight: '600', color: '#718096', background: 'white', padding: '4px 12px', borderRadius: '20px' },
  progressBar: { width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginBottom: '20px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', transition: 'width 0.3s' },
  checklistItems: { display: 'flex', flexDirection: 'column', gap: '12px' },
  checklistItem: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px 0', transition: 'all 0.2s' },
  checkbox: { width: '20px', height: '20px', cursor: 'pointer', accentColor: '#667eea' },
  itemText: { fontSize: '14px', lineHeight: '1.5', flex: 1 },
  checkmark: { color: '#667eea', fontWeight: 'bold', fontSize: '16px' },
};
