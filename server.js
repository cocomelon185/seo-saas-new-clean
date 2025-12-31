const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { normalizeUrl, isValidUrl } = require('./utils/urlHelpers');

const app = express();

console.log('Server file loaded');

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(compression());

// JSON parsing middleware
app.use(express.json()); // parses JSON body into req.body[web:58][web:70]

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Serve static files from project root (index.html, etc.)
app.use(express.static(path.join(__dirname))); // serves index.html, script.js, etc.[web:63][web:66]

// API route for SEO analysis
app.post('/api/analyze', async (req, res) => {
  try {
    let { url } = req.body;

    console.log('Raw URL from client:', url);

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Normalize and validate URL
    url = normalizeUrl(url);
    console.log('Normalized URL:', url);

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Mock SEO data (placeholder for real analysis)
    const seoData = {
      score: Math.floor(Math.random() * 101),
      keywords: ['SEO', 'optimization', 'content', 'ranking', 'keywords'],
      titleAnalysis: 'Title is well-optimized and contains target keywords',
      metaDescriptionCheck: 'Meta description is present and optimized',
      suggestions: [
        'Improve keyword density in first paragraph',
        'Add alt text to all images',
        'Optimize page load speed',
        'Add internal links to related content',
        'Improve mobile responsiveness'
      ]
    };

    console.log(`POST /api/analyze - URL: ${url}`);
    res.json(seoData);
  } catch (err) {
    console.error('Error in /api/analyze:', err);
    res.status(500).json({ error: 'Failed to analyze URL', message: err.message });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
