'use client';

import { useBrief } from './hooks/useBrief';
import { BriefForm } from './components/BriefForm';
import { OutlineSection } from './components/OutlineSection';
import { KeywordsSection } from './components/KeywordsSection';
import { ChecklistSection } from './components/ChecklistSection';
import { ExportToolbar } from './components/ExportToolbar';

export default function CreateContentPage() {
  const {
    briefState,
    generateBrief,
    toggleChecklistItem,
    toggleOutlineStep,
    copyToClipboard,
    exportAsMarkdown,
    exportAsJSON,
    downloadFile,
  } = useBrief();

  const handleExportMarkdown = async () => {
    const markdown = exportAsMarkdown();
    await copyToClipboard(markdown, 'markdown');
  };

  const handleExportJSON = async () => {
    const json = exportAsJSON();
    await copyToClipboard(json, 'json');
  };

  const handleDownloadMarkdown = () => {
    const markdown = exportAsMarkdown();
    downloadFile(markdown, `${briefState.topic}-brief.md`, 'text/markdown');
  };

  const handleDownloadJSON = () => {
    const json = exportAsJSON();
    downloadFile(json, `${briefState.topic}-brief.json`, 'application/json');
  };

  return (
    <div style={styles.pageContainer}>
      {/* Form Section */}
      <BriefForm 
        onGenerateBrief={generateBrief} 
        loading={briefState.loading} 
        error={briefState.error} 
      />

      {/* Results Section */}
      {briefState.topic && (
        <div style={styles.resultsContainer}>
          <div style={styles.resultsContent}>
            {/* Header */}
            <div style={styles.resultsHeader}>
              <h1 style={styles.resultsTitle}>{briefState.topic}</h1>
              <p style={styles.resultsSubtitle}>Your content brief is ready!</p>
            </div>

            {/* Word Count & Intent */}
            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Recommended Length</span>
                <span style={styles.metricValue}>{briefState.word_count.min}-{briefState.word_count.max} words</span>
              </div>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Search Intent</span>
                <span style={styles.metricValue}>{briefState.intent || 'Informational'}</span>
              </div>
            </div>

            {/* Outline Section */}
            <OutlineSection
              outline={briefState.outline}
              expandedStep={briefState.expandedOutlineStep}
              onToggleExpand={toggleOutlineStep}
              onCopyStep={copyToClipboard}
            />

            {/* Keywords Section */}
            <KeywordsSection
              keywords={briefState.keywords}
              onCopyKeywords={copyToClipboard}
            />

            {/* Checklist Section */}
            <ChecklistSection
              checklist={briefState.checklist}
              onToggleItem={toggleChecklistItem}
            />

            {/* Internal Links Section */}
            {briefState.internal_links && (
              <div style={styles.linksSection}>
                <h2 style={styles.linksHeading}>Internal Linking Strategy</h2>
                <p style={styles.linksStrategy}>{briefState.internal_links.strategy}</p>
                <ul style={styles.linksList}>
                  {briefState.internal_links.examples?.map((example, idx) => (
                    <li key={idx} style={styles.linksItem}>{example}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Export Toolbar */}
            <ExportToolbar
              onExportMarkdown={handleExportMarkdown}
              onExportJSON={handleExportJSON}
              onDownloadMarkdown={handleDownloadMarkdown}
              onDownloadJSON={handleDownloadJSON}
              copiedSection={briefState.copiedSection}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: { width: '100%', minHeight: '100vh', background: '#ffffff' },
  resultsContainer: { width: '100%', padding: '40px 20px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
  resultsContent: { maxWidth: '900px', margin: '0 auto' },
  resultsHeader: { marginBottom: '40px', textAlign: 'center' },
  resultsTitle: { fontSize: '36px', fontWeight: '700', margin: '0 0 10px 0', color: '#1a202c' },
  resultsSubtitle: { fontSize: '16px', color: '#718096', margin: 0 },
  metricsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' },
  metricCard: { background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' },
  metricLabel: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', marginBottom: '8px' },
  metricValue: { display: 'block', fontSize: '20px', fontWeight: '700', color: '#667eea' },
  linksSection: { marginBottom: '40px', background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  linksHeading: { fontSize: '18px', fontWeight: '700', margin: '0 0 12px 0', color: '#1a202c' },
  linksStrategy: { fontSize: '14px', lineHeight: '1.6', color: '#4a5568', margin: '0 0 12px 0' },
  linksList: { fontSize: '14px', color: '#4a5568', margin: 0, paddingLeft: '20px' },
  linksItem: { marginBottom: '8px' },
};

