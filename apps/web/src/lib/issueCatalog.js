export const ISSUE_CATALOG = {
  missing_title: {
    title: "Missing title tag",
    priority: "fix_now",
    why: "The title tag is a primary ranking and click-through signal.",
    what: "Add a unique, descriptive title (~50–60 chars) with the primary keyword near the front.",
    example_fix: "Example: 'SEO Audit Tool for Small Agencies | RankyPulse'"
  },
  title_too_long: {
    title: "Title tag is too long",
    priority: "fix_now",
    why: "Long titles can truncate in search results and dilute keyword focus.",
    what: "Shorten the title to ~50–60 characters while keeping the primary keyword near the front.",
    example_fix: "Old: 'Best Affordable SEO Site Audit Tool For Small Businesses And Agencies'\nNew: 'SEO Site Audit Tool for Small Agencies | RankyPulse'"
  },
  title_too_short: {
    title: "Title tag is too short",
    priority: "fix_next",
    why: "Very short titles often fail to communicate relevance and intent.",
    what: "Expand the title to include the primary topic + a differentiator.",
    example_fix: "Example: 'Technical SEO Audit Report — Fix Issues Fast | RankyPulse'"
  },
  duplicate_title: {
    title: "Duplicate title",
    priority: "fix_next",
    why: "Duplicate titles reduce clarity and can cause pages to compete against each other.",
    what: "Make each page title unique based on page intent.",
    example_fix: "Add product/feature names or location modifiers per page."
  },

  missing_meta_description: {
    title: "Missing meta description",
    priority: "fix_next",
    why: "A missing description reduces click-through control and may lead to irrelevant snippets.",
    what: "Add a concise description (120–160 chars) summarizing value and matching search intent.",
    example_fix: "Example: 'Instant SEO audits with clear fixes. Scan a page and get prioritized actions in seconds.'"
  },
  meta_description_too_long: {
    title: "Meta description is too long",
    priority: "fix_later",
    why: "Very long descriptions may truncate and waste important messaging.",
    what: "Trim to ~120–160 characters while keeping the core value statement.",
    example_fix: "Put the benefit in the first 100 characters."
  },
  duplicate_meta_description: {
    title: "Duplicate meta description",
    priority: "fix_later",
    why: "Duplicate descriptions reduce click-through differentiation across pages.",
    what: "Write unique descriptions per page intent.",
    example_fix: "Focus each description on the page’s unique benefit."
  },

  missing_h1: {
    title: "Missing H1 heading",
    priority: "fix_next",
    why: "H1 helps users and search engines understand the main topic of the page.",
    what: "Add a single, descriptive H1 that matches the page intent and primary query.",
    example_fix: "Example H1: 'SEO Audit Report for Your Page'"
  },
  multiple_h1: {
    title: "Multiple H1 headings",
    priority: "fix_later",
    why: "Multiple H1s can dilute the main topic signal and confuse structure.",
    what: "Keep one primary H1 and convert others to H2/H3.",
    example_fix: "Use H2 for section headings like 'Features', 'Pricing', 'FAQs'."
  },

  thin_content: {
    title: "Content is thin",
    priority: "fix_now",
    why: "Thin pages often fail to satisfy intent and rank poorly.",
    what: "Add helpful depth: examples, FAQs, screenshots, use-cases, and internal links.",
    example_fix: "Add 5–10 FAQs + 2–3 concrete examples."
  },

  canonical_missing: {
    title: "Missing canonical",
    priority: "fix_next",
    why: "Canonical helps avoid duplicate-content and parameter URL confusion.",
    what: "Add a canonical link pointing to the preferred URL.",
    example_fix: '<link rel="canonical" href="https://example.com/preferred" />'
  },
  canonical_on_noindex: {
    title: "Canonical present on a noindex page",
    priority: "fix_next",
    why: "Noindex + canonical can send mixed indexing signals.",
    what: "Remove noindex if you want indexing, or remove canonical if page should not consolidate signals.",
    example_fix: "Choose: index+canonical OR noindex (not both unless intentional)."
  },
  canonical_to_different_domain: {
    title: "Canonical points to a different domain",
    priority: "fix_now",
    why: "Cross-domain canonicals can cause your page to drop from results.",
    what: "Point canonical to your own preferred URL unless intentionally consolidating to another domain.",
    example_fix: "Set canonical to the same domain and correct path."
  },

  robots_noindex: {
    title: "Page is marked as noindex",
    priority: "fix_now",
    why: "Noindex prevents the page from appearing in search results.",
    what: "Remove noindex if the page should rank, or keep it if intentionally hidden.",
    example_fix: 'Remove: <meta name="robots" content="noindex" />'
  },
  robots_conflict: {
    title: "Conflicting robots directives (index + noindex)",
    priority: "fix_now",
    why: "Conflicting directives create unpredictable indexing behavior.",
    what: "Use a single clear directive: index or noindex.",
    example_fix: 'Use: <meta name="robots" content="index,follow" />'
  },
  x_robots_noindex: {
    title: "X-Robots-Tag indicates noindex",
    priority: "fix_now",
    why: "Header-level noindex blocks indexing even if HTML allows it.",
    what: "Remove the X-Robots-Tag noindex header if the page should rank.",
    example_fix: "Update server/CDN rules to remove X-Robots-Tag: noindex."
  },

  http_non_200: {
    title: "Non-200 HTTP status",
    priority: "fix_now",
    why: "Non-200 responses can prevent indexing and break user experience.",
    what: "Return 200 for valid pages, 301 for moved pages, and fix 4xx/5xx errors.",
    example_fix: "Fix server route, rewrite rules, or upstream availability."
  },
  redirect_chain: {
    title: "Redirect chain detected",
    priority: "fix_next",
    why: "Chains waste crawl budget and slow down users.",
    what: "Reduce to a single 301 hop to the final URL.",
    example_fix: "Update redirects so A → C (not A → B → C)."
  },
  mixed_content: {
    title: "Mixed content (HTTP resources on HTTPS page)",
    priority: "fix_next",
    why: "Browsers may block insecure resources and reduce trust.",
    what: "Load all scripts/images/styles over HTTPS.",
    example_fix: "Replace http:// with https:// for assets."
  },

  missing_alt_text: {
    title: "Images missing alt text",
    priority: "fix_next",
    why: "Alt text improves accessibility and image search relevance.",
    what: "Add descriptive alt text for meaningful images.",
    example_fix: '<img src="..." alt="SEO audit dashboard showing prioritized issues" />'
  },
  large_images: {
    title: "Large images detected",
    priority: "fix_next",
    why: "Large images slow the page and hurt Core Web Vitals.",
    what: "Compress images and serve responsive sizes (srcset).",
    example_fix: "Use WebP/AVIF and lazy-load below the fold."
  },
  render_blocking_resources: {
    title: "Render-blocking resources detected",
    priority: "fix_later",
    why: "Render blocking slows first paint and worsens UX.",
    what: "Defer non-critical JS and inline critical CSS when possible.",
    example_fix: 'Use <script defer> and load non-critical CSS async.'
  },

  broken_internal_links: {
    title: "Broken internal links",
    priority: "fix_now",
    why: "Broken links waste crawl budget and frustrate users.",
    what: "Fix or redirect broken internal URLs.",
    example_fix: "Update hrefs or add 301 redirects."
  },
  broken_external_links: {
    title: "Broken external links",
    priority: "fix_later",
    why: "Broken outbound links reduce trust and user value.",
    what: "Update or remove broken external links.",
    example_fix: "Replace with a working authoritative source."
  },

  missing_sitemap: {
    title: "Sitemap not found",
    priority: "fix_next",
    why: "Sitemaps help discovery and indexing for large sites.",
    what: "Add sitemap.xml and submit it in Search Console.",
    example_fix: "Serve /sitemap.xml and reference it from robots.txt."
  },
  missing_robots_txt: {
    title: "robots.txt not found",
    priority: "fix_later",
    why: "Robots.txt helps guide crawlers and declare sitemap location.",
    what: "Add robots.txt and include Sitemap directive.",
    example_fix: "Sitemap: https://example.com/sitemap.xml"
  },

  missing_schema: {
    title: "Missing structured data (schema.org)",
    priority: "fix_later",
    why: "Schema can improve eligibility for rich results.",
    what: "Add appropriate schema (Organization, Product, FAQ, Article).",
    example_fix: "Add JSON-LD with Organization + WebSite + Breadcrumbs."
  },
  invalid_schema: {
    title: "Invalid structured data",
    priority: "fix_next",
    why: "Invalid schema provides no benefit and can cause warnings.",
    what: "Validate schema and fix required fields/types.",
    example_fix: "Use Google's Rich Results Test to validate."
  },

  missing_lang: {
    title: "Missing html lang attribute",
    priority: "fix_later",
    why: "Lang improves accessibility and language targeting.",
    what: 'Add lang attribute on <html>.',
    example_fix: '<html lang="en">'
  },
  viewport_missing: {
    title: "Missing viewport meta tag",
    priority: "fix_next",
    why: "Without viewport, pages render poorly on mobile devices.",
    what: "Add viewport meta tag for responsive design.",
    example_fix: '<meta name="viewport" content="width=device-width, initial-scale=1" />'
  },

  h2_missing: {
    title: "Missing H2 headings",
    priority: "fix_later",
    why: "Headings improve readability and topical structure.",
    what: "Add H2s for major sections that match user intent.",
    example_fix: "H2 sections: 'How it works', 'Features', 'FAQs'."
  },
  heading_order_skips: {
    title: "Heading order skips levels",
    priority: "fix_later",
    why: "Skipping heading levels can confuse structure and accessibility tools.",
    what: "Use headings in logical order (H1 → H2 → H3).",
    example_fix: "Avoid jumping from H1 directly to H4."
  },

  favicon_missing: {
    title: "Favicon missing",
    priority: "fix_later",
    why: "Favicons improve brand recognition in tabs and bookmarks.",
    what: "Add a favicon and reference it in the head.",
    example_fix: '<link rel="icon" href="/favicon.ico" />'
  },

  gzip_brotli_missing: {
    title: "Compression missing (gzip/brotli)",
    priority: "fix_later",
    why: "Compression reduces payload size and speeds load time.",
    what: "Enable gzip or brotli at server/CDN.",
    example_fix: "Enable compression on Vercel/Railway/Cloudflare."
  },
  cache_headers_missing: {
    title: "Cache headers missing",
    priority: "fix_later",
    why: "Caching improves repeat visits and performance.",
    what: "Add Cache-Control for static assets.",
    example_fix: "Cache static assets with long max-age + immutable."
  },

  server_slow_ttfb: {
    title: "Slow server response (TTFB)",
    priority: "fix_next",
    why: "Slow TTFB hurts UX and can impact rankings.",
    what: "Reduce server work, add caching, and optimize upstream calls.",
    example_fix: "Cache results for 5–15 minutes per URL."
  },

  hreflang_missing: {
    title: "hreflang missing (if multilingual)",
    priority: "fix_later",
    why: "hreflang helps search engines serve the correct language/region version.",
    what: "Add hreflang tags if you have multiple locales.",
    example_fix: '<link rel="alternate" hreflang="en" href="https://example.com/" />'
  },

  meta_robots_missing: {
    title: "Meta robots tag missing",
    priority: "fix_later",
    why: "Robots meta provides explicit indexing directives (optional but useful).",
    what: "Add robots meta if you need to control indexing behavior.",
    example_fix: '<meta name="robots" content="index,follow" />'
  },
  title_same_as_h1: {
    title: "Title is identical to H1",
    priority: "fix_later",
    why: "Identical title/H1 can be fine, but often misses an opportunity to add differentiation.",
    what: "Keep H1 user-friendly and make the title more compelling for CTR.",
    example_fix: "Title adds benefit; H1 stays descriptive."
  },

  keyword_not_in_title: {
    title: "Primary keyword not in title",
    priority: "fix_next",
    why: "Titles help communicate relevance for key queries.",
    what: "Include the primary keyword naturally in the title.",
    example_fix: "Put the keyword in the first half of the title."
  },
  keyword_not_in_h1: {
    title: "Primary keyword not in H1",
    priority: "fix_later",
    why: "H1 supports topical focus and clarity.",
    what: "Include the primary keyword naturally in H1.",
    example_fix: "Avoid stuffing; keep it readable."
  },

  pagination_no_canonical: {
    title: "Pagination missing canonical/prev/next guidance",
    priority: "fix_later",
    why: "Pagination can confuse indexing and consolidation.",
    what: "Ensure canonical strategy and consistent URL patterns for paginated content.",
    example_fix: "Canonical to self for each page if appropriate."
  },

  too_many_indexable_params: {
    title: "Indexable URL parameters detected",
    priority: "fix_next",
    why: "Parameters can create duplicate-content and crawl traps.",
    what: "Block unnecessary params, canonicalize, or set noindex for faceted URLs.",
    example_fix: "Canonicalize to clean URL; block via robots rules if needed."
  }
};

export function enrichIssues(issues = []) {
  return issues.map((it) => {
    const id = it.issue_id || it.id || it.type;
    const base = (id && ISSUE_CATALOG[id]) ? ISSUE_CATALOG[id] : null;
    if (!base) return { ...it, issue_id: id || it.issue_id };
    return {
      ...it,
      issue_id: id,
      title: it.title || base.title,
      priority: it.priority || base.priority,
      why: it.why || base.why,
      what: it.what || base.what,
      example_fix: it.example_fix || base.example_fix
    };
  });
}
