const express = require('express');
const router = express.Router();

const { cleanTopic } = require('../utils/cleanTopic');
const { classifySaasPage } = require('../saasPageTypeDetector');

/**
 * Simple keyword idea builder shared with page-report logic style.
 * Given a topic, return primary + secondary keyword arrays.
 */
function buildKeywordSetsFromTopic(topic) {
  const base = (topic || '').toString().toLowerCase().trim();

  if (!base) {
    return {
      primary_keywords: [],
      secondary_keywords: []
    };
  }

  const primary_keywords = [
    base,
    `${base} guide`,
    `${base} checklist`
  ];

  const secondary_keywords = [
    `${base} best practices`,
    `${base} examples`,
    `${base} tips`,
    `${base} strategy`
  ];

  return {
    primary_keywords,
    secondary_keywords
  };
}

/**
 * Build outline for blog posts
 */
function buildBlogOutline(topic) {
  return [
    {
      heading: `Introduction to ${topic}`,
      level: 'h2',
      goal: `Define ${topic} and set context for the reader.`
    },
    {
      heading: `Why ${topic} matters for SaaS and startups`,
      level: 'h2',
      goal: 'Connect the topic to business outcomes like growth or revenue.'
    },
    {
      heading: `Key components of an effective ${topic} strategy`,
      level: 'h2',
      goal: 'Break down must-have elements in a practical way.'
    },
    {
      heading: `Step-by-step: How to execute ${topic}`,
      level: 'h2',
      goal: 'Give readers a clear, numbered process.'
    },
    {
      heading: `Common mistakes with ${topic} (and how to avoid them)`,
      level: 'h2',
      goal: 'Help readers dodge traps that waste time or budget.'
    },
    {
      heading: `Examples and quick wins for ${topic}`,
      level: 'h2',
      goal: 'Share concrete scenarios or optimizations.'
    },
    {
      heading: `Conclusion: Turn ${topic} into shipped results`,
      level: 'h2',
      goal: 'Summarize and push toward a specific next step.'
    }
  ];
}

/**
 * Build outline for pricing pages
 */
function buildPricingOutline(topic) {
  return [
    {
      heading: `${topic} – Clear pricing that helps buyers decide fast`,
      level: 'h2',
      goal: 'Set the context: pricing transparency builds trust.'
    },
    {
      heading: 'Our pricing tiers explained',
      level: 'h2',
      // use double quotes so "it's" and "what's" are safe
      goal: "Break down each plan: who it's for, what's included, and why."
    },
    {
      heading: 'How we compare to alternatives',
      level: 'h2',
      goal: 'Position your pricing against competitors honestly.'
    },
    {
      heading: 'FAQ: Common pricing questions',
      level: 'h2',
      goal: 'Answer objections like "Can I cancel?", "Do you offer refunds?", "What\'s included?"'
    },
    {
      heading: 'Ready to get started?',
      level: 'h2',
      goal: 'Strong CTA with trial/demo offer and risk reversal.'
    }
  ];
}

/**
 * Build outline for feature pages
 */
function buildFeatureOutline(topic) {
  return [
    {
      heading: `${topic} – The feature that solves [specific problem]`,
      level: 'h2',
      goal: 'Lead with the problem this feature solves.'
    },
    {
      heading: 'How it works',
      level: 'h2',
      goal: 'Explain the feature in 3–5 simple steps.'
    },
    {
      heading: 'Key benefits for your team',
      level: 'h2',
      goal: 'List 3–5 outcomes this feature delivers (time saved, revenue, etc.).'
    },
    {
      heading: 'Use cases and examples',
      level: 'h2',
      goal: 'Show real scenarios where this feature shines.'
    },
    {
      heading: 'Integrations and compatibility',
      level: 'h2',
      goal: 'Mention tools/platforms this feature works with.'
    },
    {
      heading: 'Start using [feature] today',
      level: 'h2',
      goal: 'CTA to trial, demo, or contact sales.'
    }
  ];
}

/**
 * Build outline for comparison pages
 */
function buildComparisonOutline(topic) {
  return [
    {
      heading: `${topic} – An honest comparison`,
      level: 'h2',
      goal: 'Set expectations: you will compare fairly and help them decide.'
    },
    {
      heading: 'Feature-by-feature breakdown',
      level: 'h2',
      goal: 'Use a table or bullet list to compare key features.'
    },
    {
      heading: 'When [your product] is a better fit',
      level: 'h2',
      goal: 'Be clear about your strengths and ideal customer.'
    },
    {
      heading: 'When [competitor] might be better',
      level: 'h2',
      goal: 'Build trust by acknowledging their strengths honestly.'
    },
    {
      heading: 'Migration and switching',
      level: 'h2',
      goal: 'Address how easy (or hard) it is to switch from the competitor.'
    },
    {
      heading: 'Try [your product] risk-free',
      level: 'h2',
      goal: 'CTA with trial offer and migration support.'
    }
  ];
}

/**
 * Build checklist for each page type
 */
function buildChecklistForType(pageType) {
  const base = [
    {
      id: 'include_primary_keyword_in_title',
      label: 'Primary keyword appears once in the title',
      status: 'todo',
      priority: 'high'
    },
    {
      id: 'use_clear_h2_sections',
      label: 'Content is broken into clear H2 sections that match search intent',
      status: 'todo',
      priority: 'high'
    }
  ];

  if (pageType === 'pricing') {
    return [
      ...base,
      {
        id: 'add_trust_signals',
        label: 'Include trust signals: testimonials, logos, "30-day refund" badge',
        status: 'todo',
        priority: 'high'
      },
      {
        id: 'clear_cta',
        label: 'Add a clear, high-contrast CTA button above the fold',
        status: 'todo',
        priority: 'high'
      },
      {
        id: 'pricing_table',
        label: 'Use a pricing comparison table with 3–4 tiers clearly labeled',
        status: 'todo',
        priority: 'medium'
      },
      {
        id: 'faq_pricing',
        label: 'Add FAQ section answering billing, cancellation, and refund questions',
        status: 'todo',
        priority: 'medium'
      }
    ];
  }

  if (pageType === 'feature') {
    return [
      ...base,
      {
        id: 'add_screenshots',
        label: 'Include 3–5 annotated screenshots or product demos',
        status: 'todo',
        priority: 'high'
      },
      {
        id: 'highlight_benefits',
        label: 'Lead with benefits (outcomes) before features (specs)',
        status: 'todo',
        priority: 'high'
      },
      {
        id: 'use_cases',
        label: 'Add 2–3 real use cases or customer stories',
        status: 'todo',
        priority: 'medium'
      },
      {
        id: 'cta_trial',
        label: 'Include CTA for free trial or demo with this feature',
        status: 'todo',
        priority: 'medium'
      }
    ];
  }

  if (pageType === 'comparison') {
    return [
      ...base,
      {
        id: 'comparison_table',
        label: 'Use a side-by-side comparison table for key features',
        status: 'todo',
        priority: 'high'
      },
      {
        id: 'honest_tradeoffs',
        label: 'Acknowledge competitor strengths to build trust',
        status: 'todo',
        priority: 'high'
      },
      {
        id: 'migration_info',
        label: 'Include section on how easy it is to switch from competitor',
        status: 'todo',
        priority: 'medium'
      },
      {
        id: 'cta_trial_comparison',
        label: 'Add CTA with risk-free trial and migration support',
        status: 'todo',
        priority: 'medium'
      }
    ];
  }

  // Default blog checklist
  return [
    ...base,
    {
      id: 'add_internal_links',
      label: 'At least 3 relevant internal links added',
      status: 'warning',
      priority: 'medium'
    },
    {
      id: 'add_supporting_images',
      label: 'Include 2–4 relevant images or screenshots with descriptive alt text',
      status: 'todo',
      priority: 'medium'
    },
    {
      id: 'add_faq_section',
      label: 'Add a short FAQ section (3–5 questions) answering real search questions',
      status: 'todo',
      priority: 'medium'
    },
    {
      id: 'implement_schema_markup',
      label: 'Add basic schema markup (Article, and FAQ schema if you include FAQs)',
      status: 'todo',
      priority: 'low'
    }
  ];
}

/**
 * Recommend word count by page type
 */
function recommendWordCountForType(pageType, topic) {
  const words = (topic || '').trim().split(/\s+/).filter(Boolean).length;

  if (pageType === 'pricing') return 800;
  if (pageType === 'feature') return 1200;
  if (pageType === 'comparison') return 1600;

  // Blog: use existing heuristic
  if (!words || words <= 2) return 2400;
  if (words <= 4) return 2000;
  if (words <= 6) return 1600;
  return 1200;
}

// GET /api/brief?input_type=keyword|url&input_value=...&search_intent=...&audience=...&tone=...
router.get('/', (req, res) => {
  const input_type = req.query.input_type || 'keyword';
  const input_value = req.query.input_value || '';
  const search_intent = req.query.search_intent || 'informational';
  const audience =
    req.query.audience || 'SaaS founders and in-house marketing leads';
  const tone =
    req.query.tone || 'clear, direct, and practical';

  // Derive topic from input
  const derivedTopicRaw = cleanTopic(input_value);
  const derivedTopic = derivedTopicRaw || 'content strategy';

  // Detect page type
  let detectedPageType = 'blog'; // default
  if (input_type === 'url') {
    const classification = classifySaasPage({ url: input_value });
    detectedPageType = classification.pageType || 'blog';
  } else {
    // keyword-based heuristic
    const classification = classifySaasPage({
      url: '',
      title: derivedTopic,
      h1: derivedTopic
    });
    detectedPageType = classification.pageType || 'blog';
  }

  // Build keyword sets from the topic
  const { primary_keywords, secondary_keywords } =
    buildKeywordSetsFromTopic(derivedTopic);

  // Build dynamic outline based on page type
  let outline;
  if (detectedPageType === 'pricing') {
    outline = buildPricingOutline(derivedTopic);
  } else if (detectedPageType === 'feature') {
    outline = buildFeatureOutline(derivedTopic);
  } else if (detectedPageType === 'comparison') {
    outline = buildComparisonOutline(derivedTopic);
  } else {
    outline = buildBlogOutline(derivedTopic);
  }

  const checklist_items = buildChecklistForType(detectedPageType);
  const recommended_word_count = recommendWordCountForType(
    detectedPageType,
    derivedTopic
  );

  const data = {
    input_type,
    input_value,
    page_type: detectedPageType,
    topic: derivedTopic,
    search_intent,
    target_audience: audience,
    tone_of_voice: tone,
    recommended_word_count,
    primary_keywords,
    secondary_keywords,
    questions: [
      {
        question: `What is ${derivedTopic}?`,
        type: 'faq'
      },
      {
        question: `Why does ${derivedTopic} matter for SaaS companies or startups?`,
        type: 'faq'
      },
      {
        question: `How do you implement ${derivedTopic} step by step?`,
        type: 'people_also_ask'
      }
    ],
    outline,
    internal_link_ideas: [
      {
        anchor_text: `${derivedTopic} checklist`,
        target_url_hint: '/blog/saas-seo-checklist',
        reason: 'Deep dive article or checklist that supports the main topic.'
      },
      {
        anchor_text: 'How this SEO assistant works',
        target_url_hint: '/product',
        reason: 'Explains how your tool fits into the workflow described.'
      }
    ],
    competitor_examples: [
      {
        title: `A complete guide to ${derivedTopic}`,
        url: 'https://example-competitor.com/blog/example-guide',
        note: 'Good example of structure and FAQ usage.'
      }
    ],
    checklist_items
  };

  res.json(data);
});

module.exports = router;
