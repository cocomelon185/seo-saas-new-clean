const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

console.log('Server file loaded');

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(compression());

// JSON parsing middleware
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static(path.join(__dirname)));

// API route for SEO analysis
app.post('/api/analyze', (req, res) => {
  const { url } = req.body;

  // Validate URL
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Mock SEO data
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
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
