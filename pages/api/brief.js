// pages/api/brief.js

export default function handler(req, res) {
  const { input_type = "keyword", input_value = "" } = req.query;

  const data = {
    input_type,
    input_value,
    page_type: "blog",
    topic: "SaaS SEO Tools for Startups: How to Pick One That Actually Helps You Grow",
    search_intent: "informational",
    recommended_word_count: 2200,
    primary_keywords: [
      "SaaS SEO tool",
      "SEO tools for startups",
      "SaaS SEO strategy"
    ],
    secondary_keywords: [
      "keyword research",
      "content briefs",
      "technical SEO basics",
      "B2B SaaS marketing",
      "on-page SEO checklist"
    ],
    questions: [
      {
        question: "What is a SaaS SEO tool?",
        type: "faq"
      },
      {
        question: "How do startups choose the right SEO tool?",
        type: "faq"
      },
      {
        question: "What SEO tools are best for early-stage SaaS companies?",
        type: "people_also_ask"
      }
    ],
    outline: [
      {
        heading: "Introduction: Why SEO Tools Matter for Startups",
        level: "h2",
        goal: "Set context and show why picking the right SEO tool matters for a SaaS startup."
      },
      {
        heading: "What Is a SaaS SEO Tool?",
        level: "h2",
        goal: "Define SaaS SEO tools and connect them to real startup use cases."
      },
      {
        heading: "Key Features Startups Actually Need",
        level: "h2",
        goal: "List and explain must-have features without overwhelming the reader."
      },
      {
        heading: "On-Page SEO Checklist for Startup Websites",
        level: "h2",
        goal: "Give a practical checklist readers can apply immediately."
      },
      {
        heading: "How to Evaluate SaaS SEO Tools (Step by Step)",
        level: "h2",
        goal: "Help readers compare tools and avoid overpaying early."
      },
      {
        heading: "Examples of SaaS SEO Tool Stacks for Different Budgets",
        level: "h2",
        goal: "Provide concrete tool combinations for low, medium, and higher budgets."
      },
      {
        heading: "Conclusion: Pick a Tool and Ship Your First SEO Wins",
        level: "h2",
        goal: "Summarize and push the reader toward taking action."
      }
    ],
    internal_link_ideas: [
      {
        anchor_text: "SaaS SEO checklist",
        target_url_hint: "/blog/saas-seo-checklist",
        reason: "Deep dive article that supports the on-page SEO section."
      },
      {
        anchor_text: "How this SEO assistant works",
        target_url_hint: "/product",
        reason: "Explains how your tool fits into the workflow described."
      }
    ],
    competitor_examples: [
      {
        title: "SaaS SEO: A Complete Guide",
        url: "https://example-competitor.com/blog/saas-seo-guide",
        note: "Good example of structure and FAQ usage."
      }
    ],
    checklist_items: [
      {
        id: "include_primary_keyword_in_title",
        label: "Primary keyword appears once in the title",
        status: "todo",
        priority: "high"
      },
      {
        id: "use_clear_h2_sections",
        label: "Content is broken into clear H2 sections that match search intent",
        status: "todo",
        priority: "high"
      },
      {
        id: "add_internal_links",
        label: "At least 3 relevant internal links added",
        status: "warning",
        priority: "medium"
      }
    ]
  };

  res.status(200).json(data);
}

