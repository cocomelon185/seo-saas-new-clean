// api/audit.js

const express = require('express');
const router = express.Router();

const { classifySaasPage } = require('../saasPageTypeDetector');
const { cleanTopic } = require('../utils/cleanTopic');

/**
 * Very simple heuristic scorer.
 * Later you can plug in real crawl + metrics.
 */
function scorePage({ url, pageType, topic }) {
  let base = 60; // neutral baseline

  // Nudge score by page type
  if (pageType === 'pricing') base += 5;
  if (pageType === 'blog') base += 0;
  if (pageType === 'feature') base += 3;
  if (pageType === 'comparison') base += 2;

  // Penalize obviously empty/short topics
  if (!topic || topic.split(/\s+/).length < 2) base -= 10;

  // Clamp to 0–100
  base = Math.max(0, Math.min(100, base));

  return Math.round(base);
}

/**
 * Build a minimal issue list based on heuristics.
 * These are placeholders you can later hook to real checks.
 */
function buildIssues({ pageType, topic }) {
  const issues = [];

  // 1) Topic quality
  issues.push({
    id: 'thin_topic',
    label: 'Topic looks very generic; page may lack clear focus keyword.',
    severity: 'medium',
    status: !topic || topic.split(/\s+/).length < 2 ? 'open' : 'info'
  });

  // 2) Title length check (simple real on-page check)
  const titleLength = topic ? topic.length : 0;
  issues.push({
    id: 'title_length',
    label: 'Title should be between 30–65 characters for optimal SERP display.',
    severity: 'low',
    status: titleLength < 30 || titleLength > 65 ? 'open' : 'info'
  });

  // 3) Page-type specific checks
  if (pageType === 'pricing') {
    issues.push(
      {
        id: 'missing_trust_signals',
        label: 'Pricing pages should highlight testimonials and guarantees (e.g., 30‑day refund).',
        severity: 'high',
        status: 'open'
      },
      {
        id: 'missing_faq',
        label: 'Add FAQ for pricing objections like refunds, contracts, and limits.',
        severity: 'medium',
        status: 'open'
      }
    );
  } else if (pageType === 'blog') {
    issues.push(
      {
        id: 'internal_links',
        label: 'Ensure at least 3 internal links to related content.',
        severity: 'medium',
        status: 'open'
      },
      {
        id: 'missing_faq_schema',
        label: 'Consider FAQ schema if the article answers common questions.',
        severity: 'low',
        status: 'open'
      }
    );
  }

  return issues;
}

// GET /api/audit?url=...
router.get('/', (req, res) => {
  const url = (req.query.url || '').trim();

  if (!url) {
    return res.status(400).json({
      error: 'Missing required query param: url'
    });
  }

  // Very lightweight "classification" reuse
  const classification = classifySaasPage({ url });
  const pageType = classification.pageType || 'blog';

  // Use title/H1 when available so topic is meaningful
  const rawTopic = classification.title || classification.h1 || url;
  const topic = cleanTopic(rawTopic) || 'Untitled page';

  const overall_score = scorePage({ url, pageType, topic });
  const issues = buildIssues({ pageType, topic });

  const data = {
    url,
    page_type: pageType,
    topic,
    overall_score,
    issues,
    notes: [
      'This is a quick heuristic audit. Deeper checks (content length, headings, links, Core Web Vitals) will come in later phases.'
    ]
  };

  res.json(data);
});

module.exports = router;
