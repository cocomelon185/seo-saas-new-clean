const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Store API key securely
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Rate limiting object to track usage per user
const userUsage = {};

// Function to generate blog post using OpenAI
async function generateBlogPost(keyword, tone, tone_value) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert SEO content writer. Create a comprehensive, original blog post that is optimized for search engines. The post should be 1500-2000 words, well-structured with proper headings, and written in a ${tone_value} tone. Always include:
1. A compelling introduction
2. Clear H2 and H3 headings (at least 8-10 sections)
3. Practical tips and insights
4. Real examples where relevant
5. A strong conclusion with a call-to-action
6. Natural keyword integration (2-3% keyword density)
7. Include internal linking suggestions in [brackets]
8. Mobile-friendly formatting with short paragraphs`
          },
          {
            role: 'user',
            content: `Write a comprehensive blog post about "${keyword}" in a ${tone_value} tone. Make it SEO-optimized, engaging, and original. Start with a catchy title followed by the content.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
        top_p: 1.0
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    throw new Error('Failed to generate content: ' + error.message);
  }
}

// API Endpoint: Generate Content
app.post('/api/generate-content', async (req, res) => {
  try {
    const { keyword, tone } = req.body;
    
    // Validate input
    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    // Check rate limiting (basic version - 5 requests per hour per IP)
    const ip = req.ip;
    const now = Date.now();
    
    if (!userUsage[ip]) {
      userUsage[ip] = [];
    }
    
    // Remove old requests (older than 1 hour)
    userUsage[ip] = userUsage[ip].filter(time => now - time < 3600000);
    
    if (userUsage[ip].length >= 5) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Maximum 5 requests per hour.' 
      });
    }
    
    userUsage[ip].push(now);

    // Generate content
    const content = await generateBlogPost(keyword, tone, tone || 'Professional');
    
    res.json({ 
      success: true, 
      content: content,
      keyword: keyword,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.message 
    });
  }
});

// API Endpoint: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Serve static files
app.use(express.static('.'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/generate-content`);
});
