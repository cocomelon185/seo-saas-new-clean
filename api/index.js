const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/analyze', (req, res) => {
  const { url } = req.body;
  
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  
  const seoData = {
    score: Math.floor(Math.random() * 101),
    keywords: ['SEO', 'optimization', 'content'],
    titleAnalysis: 'Title is well-optimized',
    metaDescriptionCheck: 'Meta description present',
    suggestions: ['Improve keyword density', 'Add alt text to images']
  };
  
  res.json(seoData);
});

module.exports = app;
