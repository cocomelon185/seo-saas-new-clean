// saasPageAdvice.js
// Turn SaaS page type into tailored advice + CTA ideas.

function buildPricingAdvice() {
  return {
    keyMessage: 'This looks like a SaaS pricing page. Focus on clarity, risk removal, and guiding visitors to the right plan.',
    bullets: [
      'Make plan differences crystal clear (who each plan is for, usage limits, key features).',
      'Highlight your most popular / recommended plan to reduce choice paralysis.',
      'Add trust elements near pricing (logos, testimonials, usage stats, security badges).',
      'Answer common objections with an FAQ section close to the pricing table.',
      'Clarify billing (monthly vs annual), cancellation, refunds, and any hidden fees.'
    ],
    ctaIdeas: [
      '“Start free trial” or “Try it free for 14 days” on the primary plan.',
      '“Talk to sales” or “Request custom quote” for enterprise / custom tiers.',
      '“Compare plans” link for visitors who need more detail before committing.'
    ]
  };
}

function buildFeatureAdvice() {
  return {
    keyMessage: 'This looks like a SaaS feature/product page. Emphasize value, outcomes, and how the feature fits into the full product.',
    bullets: [
      'Lead with a strong value proposition above the fold, not just the feature name.',
      'Use benefit‑oriented subheadings (what the user gets, not what the feature does).',
      'Show the feature in context with product UI or a short product tour.',
      'Add 1–2 relevant testimonials or logos tied to this feature’s outcome.',
      'Link clearly to pricing and related features so visitors can continue the journey.'
    ],
    ctaIdeas: [
      '“See it in action” or “Watch 2‑minute demo”.',
      '“Start free trial” with copy tied to this specific feature.',
      '“Book a live demo” for high‑value / enterprise features.'
    ]
  };
}

function buildComparisonAdvice() {
  return {
    keyMessage: 'This looks like a SaaS comparison / alternatives page. Be honest, structured, and help visitors choose confidently.',
    bullets: [
      'Use a clear comparison table that shows differences on features, price, and support.',
      'Call out where your product is a better fit and where competitors may be stronger.',
      'Frame evaluation criteria that favor your strengths (e.g., ease of use, support, integrations).',
      'Include short quotes or case studies from customers who switched from competitors.',
      'End with a clear “what to do next” section summarizing who should choose which option.'
    ],
    ctaIdeas: [
      '“Compare plans side by side” or “See full comparison”.',
      '“Book a migration consult” for visitors switching from a competitor.',
      '“Start trial with your data” to lower the friction of trying your tool.'
    ]
  };
}

function buildBlogAdvice() {
  return {
    keyMessage: 'This looks like a SaaS blog / guide page. Educate first, then smoothly connect to your product.',
    bullets: [
      'Make the intro clearly match the search problem and promise a specific outcome.',
      'Use structured H2/H3 sections and in‑line examples that relate back to your product.',
      'Include 1–2 “product moments” (screenshots or short callouts) that show how your tool helps.',
      'Add internal links to relevant feature, pricing, and case study pages.',
      'End with a CTA that fits the reader’s stage (checklist, template, or gentle product invite).'
    ],
    ctaIdeas: [
      '“Get the checklist/template” as a soft CTA.',
      '“See how YourTool solves this” linking to a feature page.',
      '“Start free trial” for readers who are ready to act.'
    ]
  };
}

function buildSaasPageAdvice(saasPageType) {
  if (!saasPageType || !saasPageType.pageType) {
    return null;
  }

  switch (saasPageType.pageType) {
    case 'pricing':
      return buildPricingAdvice();
    case 'feature':
      return buildFeatureAdvice();
    case 'comparison':
      return buildComparisonAdvice();
    case 'blog':
    default:
      return buildBlogAdvice();
  }
}

module.exports = {
  buildSaasPageAdvice
};
