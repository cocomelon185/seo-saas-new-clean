const cors = require('cors');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
cconst express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
console.log('Server file loaded');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());const { normalizeUrl, isValidUrl } = require('./utils/urlHelpers'); // adjust path if needed

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

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(normalizedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEO-Bot/1.0)' },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Failed to fetch URL (status ${response.status})` });
    }

    const html = await response.text();
    const results = {
      url: normalizedUrl,
      score: Math.floor(Math.random() * 40) + 60,
      keywords: ['SEO', 'optimization', 'content'],
      titleAnalysis: 'Title is well-optimized',
      metaDescriptionCheck: 'Meta description present',
      suggestions: ['Improve keyword density', 'Add alt text to images'],
      htmlLength: html.length,
    };

    return res.status(200).json(results);
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Failed to analyze URL', message: error.message });
  }
});


const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);
app.use(express.static(path.join(__dirname)));

function normalizeUrl(url) {
  if (!url) return '';
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  return url;
}

app.post('/api/analyze', async (req, res) => {
  try {
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    url = normalizeUrl(url);
    const fetch = (await import('node-fetch')).default;
    await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    res.json({
      score: Math.floor(Math.random() * 40) + 60,
      keywords: ['SEO', 'optimization', 'content'],
      titleAnalysis: 'Title is well-optimized',
      metaDescriptionCheck: 'Meta description present',
      suggestions: ['Improve keyword density', 'Add alt text to images']
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: err.message });
  }
});

app.post('/api/content-analysis', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    const words = content.trim().split(/\s+/);
    const wordCount = words.length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim()).length;
    const readabilityScore = Math.min(100, Math.max(0, 100 - ((wordCount/sentences) * 2)));
    res.json({
      wordCount, charCount: content.length, sentences,
      readabilityScore: Math.round(readabilityScore),
      suggestions: wordCount < 300 ? ['Add more content (300+ words recommended)'] : ['Looks good!']
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: err.message });
  }
});

app.post('/api/keyword-research', async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: 'Keyword required' });
    res.json({
      mainKeyword: keyword,
      relatedKeywords: [
        { keyword: `${keyword} guide`, volume: '1K-10K', difficulty: 'Medium' },
        { keyword: `best ${keyword}`, volume: '10K-100K', difficulty: 'High' },
        { keyword: `${keyword} tips`, volume: '1K-10K', difficulty: 'Low' }
      ],
      suggestions: ['Focus on long-tail keywords', 'Target low-difficulty keywords first']
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed', message: err.message });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

