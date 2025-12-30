const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { parseBody } = require('./_helpers');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key for server-side operations
);

module.exports = async (req, res) => {
  // Enable CORS (restrict to your domain in production)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ⚠️ SECURITY: Validate authorization token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  // Verify token with Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  try {
    // ⚠️ SECURITY: Check usage limits
    const { data: usageLimits, error: usageError } = await supabase
      .from('usage_limits')
      .select('optimizations_used, optimizations_limit')
      .eq('user_id', user.id)
      .single();

    if (usageError) {
      return res.status(500).json({ error: 'Failed to check usage limits' });
    }

    if (!usageLimits) {
      return res.status(403).json({ error: 'User not found in system' });
    }

    // Check if user has reached limit
    if (usageLimits.optimizations_used >= usageLimits.optimizations_limit) {
      return res.status(429).json({ 
        error: 'Usage limit reached',
        used: usageLimits.optimizations_used,
        limit: usageLimits.optimizations_limit,
        message: 'Upgrade your plan to continue optimizing content'
      });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Parse request body
    const body = await parseBody(req);
    const { content, keyword, tone } = body;

    if (!content || !keyword) {
      return res.status(400).json({ error: 'Content and keyword are required' });
    }

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an SEO optimization expert. Rewrite the content to be more SEO-friendly while preserving the core message. Focus on: keyword density, readability, proper headings structure, and engaging meta descriptions.`
          },
          {
            role: 'user',
            content: `Optimize this content for the keyword "${keyword}" with a ${tone || 'professional'} tone:\n\n${content}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const optimizedContent = response.data.choices[0].message.content;

    // ⚠️ SECURITY: Track usage in database
    const { error: trackError } = await supabase
      .from('usage_history')
      .insert({
        user_id: user.id,
        action_type: 'optimization',
        content_title: keyword,
        word_count: content.split(' ').length,
        metadata: { keyword, tone }
      });

    if (trackError) {
      console.error('Failed to track usage:', trackError);
      // Don't fail the request if tracking fails, but log it
    }

    // Return success with updated usage stats
    res.status(200).json({ 
      optimizedContent,
      usage: {
        used: usageLimits.optimizations_used + 1,
        limit: usageLimits.optimizations_limit,
        remaining: usageLimits.optimizations_limit - usageLimits.optimizations_used - 1
      }
    });

  } catch (error) {
    console.error('API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to optimize content',
      details: error.response?.data?.error?.message || error.message
    });
  }
};
