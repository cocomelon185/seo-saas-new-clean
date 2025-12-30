/* Hardened Express server
 - helmet for secure headers
 - compression for response gzip
 - express-rate-limit to limit requests
 - /health endpoint
 - serves index.html and other HTML/assets
 - uses process.env.OPENAI_API_KEY for server-side secret
*/

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Server file loaded');

// Basic hardening
app.use(helmet());
app.use(compression());

// Rate limiting (tune as needed)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // limit each IP to 120 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Serve everything in project root statically (HTML files, etc.)
app.use(express.static(__dirname));

// Serve static assets from /assets
app.use(
  '/assets',
  express.static(path.join(__dirname, 'assets'), { maxAge: '1d' })
);

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use(express.json()); // Middleware to parse JSON request bodies

// POST /api/analyze route
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
    score: Math.floor(Math.random() * 101), // Random score between 0 and 100
    keywords: ['SEO', 'optimization', 'content'],
    titleAnalysis: 'Title is well-optimized',
    metaDescriptionCheck: 'Meta description is present and optimized',
    suggestions: ['Improve keyword density', 'Add alt text to images']
  };

  res.json(seoData);
});

// Example endpoint that requires OPENAI_API_KEY
app.get('/api/health-check-openai', (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ error: 'OPENAI_API_KEY not configured on server' });
  }
  // Do not log or expose the key. This is just a presence check.
  res.json({ openai: 'configured' });
});

// Serve index.html for non-file routes (simple SPA support)
app.get('*', (req, res, next) => {
  // If the path looks like a real file (has a dot), let static middleware handle it
  if (req.path.includes('.')) return next();

  const indexPath = path.join(__dirname, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next(err);
  });
});

// Graceful error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Catch unhandled rejections and uncaught exceptions to avoid silent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  // In production you might want to attempt a graceful shutdown here
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
