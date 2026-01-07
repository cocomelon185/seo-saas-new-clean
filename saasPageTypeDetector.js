// saasPageTypeDetector.js
// Very small, heuristic classifier for SaaS marketing pages.

function textIncludes(text, patterns) {
  if (!text) return false;
  const lower = String(text).toLowerCase();
  return patterns.some(p => lower.includes(p));
}

/**
 * classifySaasPage
 * @param {Object} input
 * @param {string} [input.url]
 * @param {string} [input.title]
 * @param {string} [input.h1]
 * @param {string} [input.metaDescription]
 * @returns {{ pageType: 'pricing' | 'comparison' | 'feature' | 'blog', confidence: number, signals: string[] }}
 */
function classifySaasPage(input = {}) {
  const { url = '', title = '', h1 = '', metaDescription = '' } = input;
  const signals = [];
  let score = {
    pricing: 0,
    comparison: 0,
    feature: 0,
    blog: 0
  };

  const haystack = `${url} ${title} ${h1} ${metaDescription}`.toLowerCase();

  // --- Pricing signals ---
  if (textIncludes(haystack, ['pricing', '/pricing', 'plans', 'billing', 'per month', 'per user'])) {
    score.pricing += 2;
    signals.push('pricing keywords found');
  }
  if (textIncludes(haystack, ['monthly', 'annually', 'annual', 'free trial', 'start free'])) {
    score.pricing += 1;
    signals.push('billing / trial language found');
  }

  // --- Comparison signals ---
  if (textIncludes(haystack, [' vs ', 'versus', 'alternative to', 'alternatives to', 'compare plans', 'comparison'])) {
    score.comparison += 2;
    signals.push('comparison keywords found');
  }
  if (textIncludes(haystack, ['compare', 'side-by-side', 'feature comparison'])) {
    score.comparison += 1;
    signals.push('feature comparison language found');
  }

  // --- Feature / product page signals ---
  if (textIncludes(haystack, ['features', 'feature', 'how it works', 'product tour', 'capabilities'])) {
    score.feature += 2;
    signals.push('feature page language found');
  }
  if (textIncludes(haystack, ['use cases', 'workflow', 'for teams', 'for startups', 'for enterprise'])) {
    score.feature += 1;
    signals.push('use-case / persona language found');
  }

  // --- Blog / content signals ---
  if (textIncludes(haystack, ['blog', '/blog', 'guide', 'how to ', 'ultimate guide', 'playbook'])) {
    score.blog += 2;
    signals.push('blog/guide language found');
  }
  if (textIncludes(haystack, ['what is ', 'benefits of', 'tips for', 'best practices'])) {
    score.blog += 1;
    signals.push('educational intent language found');
  }

  // Decide pageType by max score; default to 'blog'
  let pageType = 'blog';
  let maxScore = -1;
  Object.keys(score).forEach(type => {
    if (score[type] > maxScore) {
      maxScore = score[type];
      pageType = type;
    }
  });

  // crude confidence: normalize by possible max (here ~4)
  const confidence = Math.max(0.1, Math.min(1, maxScore / 4));

  return {
    pageType,
    confidence,
    signals
  };
}

// Small helper for brief / other callers
function detectSaasPageTypeFromText(input = {}) {
  const { url = '', content = '' } = input;
  // Reuse content as title/h1/meta when we only have raw text/keyword
  const { pageType } = classifySaasPage({
    url,
    title: content,
    h1: content,
    metaDescription: content
  });
  return pageType;
}

module.exports = {
  classifySaasPage,
  detectSaasPageTypeFromText
};
