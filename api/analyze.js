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

  const { url } = body || {};

  // Validate URL
  try {
    new URL(url);
  } catch (err) {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  // Return mock SEO data
  const seoData = {
    score: Math.floor(Math.random() * 101),
    keywords: ['SEO', 'optimization', 'content'],
    titleAnalysis: 'Title is well-optimized',
    metaDescriptionCheck: 'Meta description present',
    suggestions: ['Improve keyword density', 'Add alt text to images']
  };

  res.status(200).json(seoData);
}
