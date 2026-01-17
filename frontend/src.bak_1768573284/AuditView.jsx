import { useEffect, useRef, useState } from 'react';
import './AuditView.css';
import { api } from './lib/api';

export default function AuditView({ auditData, isPro, onUpgrade }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!auditData) return null;

  const { meta, headings, content, images, links, checks } = auditData || {};

  const overview = {
    title: meta?.title || "",
    metaDescription: meta?.metaDescription || "",
    h1: (headings?.h1s && headings.h1s[0]) || "",
    wordCount: content?.wordCount ?? 0,
  };

  const issuesList = [];
  if (checks) {
    if (!checks.hasTitle) issuesList.push({ sev: "HIGH", msg: "Missing <title> tag" });
    if (!checks.hasMetaDescription) issuesList.push({ sev: "HIGH", msg: "Missing meta description" });
    if (!checks.hasCanonical) issuesList.push({ sev: "MED", msg: "Missing canonical URL" });
    if (!checks.singleH1) issuesList.push({ sev: "MED", msg: "Page should have exactly one H1" });
  }
  if ((images?.missingAlt ?? 0) > 0) issuesList.push({ sev: "MED", msg: "Images missing alt text: " + images.missingAlt });

  const priorities = issuesList.slice(0, 3).map(i => ({ impact: i.sev, title: i.msg }));

  // --- RankyPulse: autosave audit to DB (F2) ---
  const savedRef = useRef(new Set());

  useEffect(() => {
    if (!auditData) return;

    const url =
      auditData?.url ||
      meta?.url ||
      meta?.canonical ||
      "";

    if (!url) return;

    // prevent duplicates within this page session
    if (savedRef.current.has(url)) return;
    savedRef.current.add(url);

    const result = {
      url,
      seoScore: auditData?.seoScore ?? auditData?.seo_score ?? auditData?.score ?? null,
      pagesCrawled: auditData?.pagesCrawled ?? auditData?.pages_crawled ?? 1,
      issues: issuesList.map((x) => ({ severity: x.sev, message: x.msg })),

      // optional meta we already parse/display
      metaDescription: meta?.metaDescription || "",
      robotsMeta: meta?.robotsMeta || "",
      canonical: meta?.canonical || "",
      noindex: !!meta?.noindex,
    };

    api("/api/audits", { method: "POST", body: { result } })
      .catch((e) => console.warn("Auto-save audit failed:", e?.message || e));
  }, [auditData]);


  const keywords = auditData.keywords || [];
  const brief = auditData.brief || { outline: [], wordCount: { min: 0, max: 0 }, checklist: [] };

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
            {priorities.length > 0 && (
              <div className="overview-subsection">
                <h4>Top 3 Fixes</h4>
                <ul className="issues-list">
                  {priorities.map((p, i) => (
                    <li
                      key={i}
                      className={"issue sev-" + String(p.impact || "low").toLowerCase()}
                    >
                      <strong>{String(p.impact || "LOW").toUpperCase()}</strong>{" "}
                      {p.title}
                      {p.description ? " — " + p.description : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
            {issuesList.length === 0 ? (
              <p className="no-issues">No issues found! ✅</p>
            ) : (
              <ul className="issues-list">
                {issuesList.map((issue, i) => (
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

            <div className="brief-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!isPro}
                onClick={() => navigator.clipboard?.writeText(JSON.stringify(brief, null, 2))}
              >
                Copy brief
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!isPro}
                onClick={() => {
                  const blob = new Blob([JSON.stringify(brief, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "rankypulse-brief.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export JSON
              </button>
              {!isPro && <span className="pro-only">Pro only</span>}
            </div>

    {!isPro && (
      <div className="paywall-banner">
        <strong>Preview only.</strong> Upgrade to unlock the full brief and export.
        <button type="button" className="btn btn-upgrade" onClick={onUpgrade}>
          Unlock full brief ($19/mo)
        </button>
      </div>
    )}
            
            <div className="brief-subsection">
              <h4>Recommended Outline</h4>
              <ol className="outline-list">
                 {(isPro ? brief.outline : brief.outline.slice(0, 2)).map((section, i) => (
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
                 {(isPro ? brief.checklist : brief.checklist.slice(0, 3)).map((item, i) => (
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
