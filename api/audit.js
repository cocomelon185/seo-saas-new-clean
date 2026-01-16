// api/audit.js
// Compatibility wrapper: keeps GET /api/audit?url=... working,
// but uses the canonical analyzer in api/page-report.js.

const express = require('express');
const router = express.Router();

const pageReport = require('./page-report');

// GET /api/audit?url=...
router.get('/', async (req, res) => {
  const url = (req.query.url || '').trim();

  if (!url) {
    return res.status(400).json({ error: 'Missing required query param: url' });
  }

  // Call the canonical handler as if it were a POST body request
  const fakeReq = {
    method: 'POST',
    body: { url }
  };

  return pageReport(fakeReq, res);
});

module.exports = router;
