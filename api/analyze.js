function normalizeUrl(url) {
  if (!url) return '';
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

function isValidUrl(url) {
  try {
    const normalizedUrl = normalizeUrl(url);
    const urlObject = new URL(normalizedUrl);
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Parse JSON body safely
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  let { url } = body || {};

  // Normalize and validate URL
  url = normalizeUrl(url);
  if (!isValidUrl(url)) {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  // Return mock SEO data (same shape as server.js)
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

  res.status(200).json(seoData);
}
