const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const { normalizeUrl, isValidUrl } = require('./utils/urlHelpers'); // adjust path if needed

const app = express();
console.log('Server file loaded');

// Security & middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Static + SPA entry
app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Analyze URL route
app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const normalizedUrl = normalizeUrl(url);
    if (!isValidUrl(normalizedUrl)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const response = await fetch(normalizedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEO-Bot/1.0)' }
    });

    if (!response.ok) {
      return res
        .status(502)
        .json({ error: `Failed to fetch URL (status ${response.status})` });
    }

    const html = await response.text();

    const results = {
      url: normalizedUrl,
      score: Math.floor(Math.random() * 40) + 60,
      keywords: ['SEO', 'optimization', 'content'],
      titleAnalysis: 'Title is well-optimized',
      metaDescriptionCheck: 'Meta description present',
      suggestions: ['Improve keyword density', 'Add alt text to images'],
      htmlLength: html.length
    };

    return res.status(200).json(results);
  } catch (error) {
    console.error('Analysis error:', error);
    return res
      .status(500)
      .json({ error: 'Failed to analyze URL', message: error.message });
  }
});

app.post("/api/page-report", (req, res) => {
  const body = req.body || {};
  if (typeof body !== "object") {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const response = {
    score: 72,
    quick_wins: [
      "Add your primary keyword to the H1.",
      "Include the target keyword in the first 100 words.",
      "Add 2–3 internal links to related pages.",
      "Improve meta title to include a benefit-driven phrase."
    ],
    content_brief:
      "Create a clear, benefit-focused page targeting SaaS founders. Use one primary keyword in the H1, answer 2–3 main user questions, and end with a strong CTA.",
    keyword_ideas: [
      "saas seo checklist",
      "seo for saas landing pages",
      "on-page seo for startups",
      "content brief for saas pages"
    ]
  };

  return res.status(200).json(response);
});

// Content analysis route
app.post('/api/content-analysis', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }

    const words = content.trim().split(/\s+/);
    const wordCount = words.length;
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim()).length;
    const readabilityScore = Math.min(
      100,
      Math.max(0, 100 - (wordCount / sentences) * 2)
    );

    res.json({
      wordCount,
      charCount: content.length,
      sentences,
      readabilityScore: Math.round(readabilityScore),
      suggestions:
        wordCount < 300
          ? ['Add more content (300+ words recommended)']
          : ['Looks good!']
    });
  } catch (err) {
    console.error('Content analysis error:', err);
    res.status(500).json({ error: 'Failed', message: err.message });
  }
});

// Keyword research route
app.post('/api/keyword-research', async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword required' });
    }

    res.json({
      mainKeyword: keyword,
      relatedKeywords: [
        { keyword: `${keyword} guide`, volume: '1K-10K', difficulty: 'Easy–Medium' },
        { keyword: `best ${keyword}`, volume: '10K-100K', difficulty: 'Medium–Hard' },
        { keyword: `${keyword} tips`, volume: '100-1K', difficulty: 'Easy' }
      ],
      suggestions: [
        'Start with easier terms to build authority',
        'Create a main pillar page for your keyword',
        'Use long-tail variations to capture niche traffic'
      ]
    });
  } catch (err) {
    console.error('Keyword research error:', err);
    res.status(500).json({ error: 'Failed', message: err.message });
  }
});

app.post('/api/seo-score', (req, res) => {
  const { url, wordCount, readabilityScore } = req.body;

  if (typeof wordCount !== 'number' || typeof readabilityScore !== 'number') {
    return res.status(400).json({ error: 'wordCount and readabilityScore must be numbers' });
  }

  let score = 50;
  const factors = [];

  if (wordCount >= 800) {
    score += 20;
    factors.push('Good content length (800+ words)');
  } else if (wordCount >= 300) {
    score += 10;
    factors.push('Decent content length (300–799 words)');
  } else {
    score -= 10;
    factors.push('Content is quite short (< 300 words)');
  }

  if (readabilityScore >= 60 && readabilityScore <= 80) {
    score += 15;
    factors.push('Good readability (60–80)');
  } else if (readabilityScore < 40) {
    score -= 10;
    factors.push('Content is hard to read (readability < 40)');
  }

  score = Math.max(0, Math.min(100, score));

  let grade;
  if (score >= 85) {
    grade = 'Excellent';
  } else if (score >= 70) {
    grade = 'Good';
  } else {
    grade = 'Needs improvement';
  }

  res.json({ score, grade, factors });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
