/* Hardened Express server
 - helmet for secure headers
 - compression for response gzip
 - express-rate-limit to limit requests
 - /health endpoint
 - serves index.html and assets
 - uses process.env.OPENAI_API_KEY for server-side secret
*/

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Serve static assets from /assets and root index
app.use('/assets', express.static(path.join(__dirname, 'assets'), {maxAge: '1d'}));

// Health endpoint
app.get('/health', (req, res) => {
  res.json({status: 'ok', uptime: process.uptime()});
});

// Example endpoint that requires OPENAI_API_KEY
app.get('/api/health-check-openai', (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({error: 'OPENAI_API_KEY not configured on server'});
  }
  // Do not log or expose the key. This is just a presence check.
  res.json({openai: 'configured'});
});

// Serve index.html for all other routes (simple SPA support)
app.get('*', (req, res, next) => {
  const indexPath = path.join(__dirname, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next(err);
  });
});

// Graceful error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({error: 'Internal Server Error'});
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
