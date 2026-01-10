import { useState } from 'react';
import './AuditView.css';

export default function AuditView({ auditData }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!auditData) return null;

  const { overview, issues, keywords, brief } = auditData;

  return (
    <div className="audit-container">
      <div className="audit-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          Issues
        </button>
        <button
          className={`tab ${activeTab === 'keywords' ? 'active' : ''}`}
          onClick={() => setActiveTab('keywords')}
        >
          Keywords
        </button>
        <button
          className={`tab ${activeTab === 'brief' ? 'active' : ''}`}
          onClick={() => setActiveTab('brief')}
        >
          Brief
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h3>Page Overview</h3>
            <div className="overview-grid">
              <div className="overview-item">
                <label>Title</label>
                <p>{overview.title}</p>
              </div>
              <div className="overview-item">
                <label>Meta Description</label>
                <p>{overview.metaDescription}</p>
              </div>
              <div className="overview-item">
                <label>H1</label>
                <p>{overview.h1}</p>
              </div>
              <div className="overview-item">
                <label>Word Count</label>
                <p>{overview.wordCount}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="issues-section">
            <h3>Issues Found</h3>
            {issues.length === 0 ? (
              <p className="no-issues">No issues found! ✅</p>
            ) : (
              <ul className="issues-list">
                {issues.map((issue, i) => (
                  <li key={i} className={`issue sev-${issue.sev.toLowerCase()}`}>
                    <strong>{issue.sev}</strong> {issue.msg}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'keywords' && (
          <div className="keywords-section">
            <h3>Extracted Keywords</h3>
            <div className="keywords-grid">
              {keywords.map((kw, i) => (
                <span key={i} className="keyword-tag">{kw}</span>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'brief' && (
          <div className="brief-section">
            <h3>Content Brief</h3>
            
            <div className="brief-subsection">
              <h4>Recommended Outline</h4>
              <ol className="outline-list">
                {brief.outline.map((section, i) => (
                  <li key={i}>
                    <strong>{section.title}</strong>
                    <p>{section.description}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="brief-subsection">
              <h4>Word Count Target</h4>
              <p>{brief.wordCount.min} - {brief.wordCount.max} words</p>
            </div>

            <div className="brief-subsection">
              <h4>SEO Checklist</h4>
              <ul className="checklist">
                {brief.checklist.map((item, i) => (
                  <li key={i}>
                    <input type="checkbox" disabled />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
