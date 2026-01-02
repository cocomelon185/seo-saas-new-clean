module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
};
