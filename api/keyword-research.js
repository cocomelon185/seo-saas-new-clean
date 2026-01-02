export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
