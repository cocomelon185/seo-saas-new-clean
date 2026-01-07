const fetch = require('node-fetch');
const { cleanTopic } = require('../utils/cleanTopic');

// --- Simple text utilities ---

function basicWordStats(text) {
  const content = (text || '').toString();
  const words = content.trim().split(/\s+/).filter(Boolean);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length
    ? Math.round(words.length / sentences.length)
    : 0;

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength
  };
}

function scoreFromStats(stats) {
  let score = 100;

  if (stats.wordCount < 300) score -= 15;
  if (stats.wordCount > 2500) score -= 10;
  if (stats.avgSentenceLength > 25) score -= 15;
  if (stats.sentenceCount < 5) score -= 10;

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return score;
}

function buildQuickWins(stats) {
  const wins = [];

  if (stats.avgSentenceLength > 25) {
    wins.push(
      'Sentences are quite long. Break long sentences into 1–2 shorter ones to improve readability.'
    );
  }

  if (stats.wordCount < 800) {
    wins.push(
      'Content is thin. Add more examples, FAQs, or use cases to reach at least 800–1200 words for depth.'
    );
  }

  if (stats.wordCount > 2500) {
    wins.push(
      'Content is very long. Consider splitting into sections or separate pages to keep readers focused.'
    );
  }

  if (!wins.length) {
    wins.push(
      'Structure, length, and readability look solid. Focus on tightening headings and internal links.'
    );
  }

  return wins;
}

// --- SaaS helpers (same as localhost) ---

function detectSaasPageType(url, title = '', h1 = '') {
  const href = (url || '').toLowerCase();
  const t = (title || '').toLowerCase();
  const h = (h1 || '').toLowerCase();
  const combined = `${href} ${t} ${h}`;

  const signals = [];
  let pageType = 'generic';
  let confidence = 0.3;

  if (
    /pricing|plans|billing|upgrade|subscribe/.test(href) ||
    /pricing|plans|per month|\$|€|£/.test(combined)
  ) {
    pageType = 'pricing';
    confidence = 0.7;
    signals.push('pricing keywords found');
  }

  if (
    /features|product|platform|capabilities/.test(href) ||
    /features|capabilities|how it works/.test(combined)
  ) {
    pageType = 'feature';
    confidence = 0.6;
    signals.push('feature page language found');
  }

  if (
    /vs-|\/vs\//.test(href) ||
    / vs /.test(combined) ||
    /compare|comparison/.test(combined)
  ) {
    pageType = 'comparison';
    confidence = 0.7;
    signals.push('comparison language found');
  }

  if (
    /blog|resources|learn|guides|library/.test(href) ||
    /guide|how to|best practices|tips/.test(combined)
  ) {
    pageType = 'blog';
    confidence = 0.6;
    signals.push('blog/guide language found');
  }

  return { pageType, confidence, signals };
}

function buildSaasPageAdvice(pageType) {
  if (pageType === 'comparison') {
    return {
      keyMessage:
        'This looks like a SaaS comparison page. Help buyers decide when you’re a better fit than [competitor] without trash‑talking them.',
      focusAreas: [
        'State clearly who you are for and when [competitor] is a better fit.',
        'Use a simple feature/benefit table instead of long comparison paragraphs.',
        'Highlight 3–5 sharp differentiators with specific examples or screenshots.',
        'Be upfront about trade‑offs to build trust and reduce “too good to be true” friction.',
        'Add a short FAQ on migration, data import, and switching risk so moving feels safe.'
      ],
      ctaIdeas: [
        '“Migrate from [competitor] in X days” with a strong risk-reversal offer.',
        '“Talk to an expert” for teams comparing multiple tools.',
        '“Start free trial” with pre-built templates for ex-competitor users.'
      ]
    };
  }

  // keep your pricing / feature / blog branches here too, unchanged
  // ...

  return null;
}

// --- Vercel function handler ---

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { url, content } = req.body || {};

    let fetchedHtml = '';
    let pageTitleOrH1 = '';

    if (url) {
      const response = await fetch(url);
      fetchedHtml = await response.text();
      const titleMatch = fetchedHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
      const h1Match = fetchedHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      pageTitleOrH1 =
        (titleMatch && titleMatch[1]) ||
        (h1Match && h1Match[1]) ||
        '';
    }

    const workingContent =
      content && content.trim().length > 0
        ? content
        : fetchedHtml.replace(/<[^>]+>/g, ' ');

    const stats = basicWordStats(workingContent);
    const score = scoreFromStats(stats);
    const quickWins = buildQuickWins(stats);

    const firstSentence = workingContent.split(/[.!?]+/)[0] || '';
    const topicGuess = firstSentence.slice(0, 80);

    const rawTopic = pageTitleOrH1 || topicGuess;
    const topic = cleanTopic(rawTopic);

    const contentBrief = [
      `1. Clarify the primary search intent for ${topic} (informational, commercial, or transactional).`,
      `2. Add an introduction that clearly explains who the page is for and what they will learn about ${topic}.`,
      `3. Use H2/H3 sections to cover subtopics, FAQs, and comparisons related to ${topic}.`,
      `4. Include internal links to 3–5 closely related pages and 1–2 authoritative external resources.`,
      `5. End with a clear next step (CTA) that fits the visitor’s stage: learn more, compare options, or get started.`
    ];

    const keywordIdeas = [
      `${topic.toLowerCase()} checklist`,
      `${topic.toLowerCase()} guide`,
      `${topic.toLowerCase()} best practices`,
      `${topic.toLowerCase()} examples`
    ];

    const saasPageType = detectSaasPageType(url || '', pageTitleOrH1, '');
    const saasPageAdvice = buildSaasPageAdvice(saasPageType.pageType);

    res.status(200).json({
      score,
      quick_wins: quickWins,
      content_brief: contentBrief.join('\n'),
      keyword_ideas: keywordIdeas,
      saas_page_type: saasPageType,
      saas_page_advice: saasPageAdvice,
      warning: null
    });
  } catch (err) {
    console.error('Page report error', err);
    res.status(500).json({
      score: 0,
      quick_wins: [],
      content_brief: '',
      keyword_ideas: [],
      saas_page_type: null,
      saas_page_advice: null,
      warning: 'Failed to analyze page. Try again in a moment.'
    });
  }
};
