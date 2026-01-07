// server.js
const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies for POST requests if you ever need them
app.use(express.json());

// Serve all static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper: compute a simple score based on issue severities
function computeScore(issues) {
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'high') score -= 20;
    if (issue.severity === 'medium') score -= 10;
    if (issue.severity === 'low') score -= 5;
  }
  return Math.max(0, score);
}

// Helper: extract simple keyword ideas from title + body text
function extractKeywordIdeas(titleText, bodyText) {
  const stopwords = new Set([
    'the','a','an','and','or','of','for','to','in','on','with','at','by','from',
    'this','that','is','are','was','were','it','as','be','can','will','you',
    'your','our','we','they','their','them','but','if','so','not','no','yes',
    'about','into','out','up','down','over','under','than','then','there','here'
  ]);

  const text = `${titleText} ${bodyText}`.toLowerCase();
  const words = text.match(/[a-z0-9\-]+/g) || [];
  const freq = {};
  for (const w of words) {
    if (stopwords.has(w) || w.length < 4) continue;
    freq[w] = (freq[w] || 0) + 1;
  }

  const seeds = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  const ideas = [];
  for (const seed of seeds) {
    ideas.push(
      seed,
      `${seed} guide`,
      `best ${seed}`,
      `${seed} tools`,
      `${seed} for beginners`
    );
  }

  return Array.from(new Set(ideas)).slice(0, 15);
}

// GET /api/audit?url=...
app.get('/api/audit', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    // Fetch the target page HTML
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; SEOAuditor/1.0; +https://example.com/bot)'
      }
    });
    const html = response.data;
    const $ = cheerio.load(html);

    const issues = [];

    // ---------- Title checks ----------
    const titleText = $('title').first().text().trim();
    if (!titleText) {
      issues.push({
        id: 'missing_title',
        severity: 'high',
        title: 'Missing title tag',
        text: 'The page is missing a title tag.',
        description: 'No title tag was found in the head section.',
        label: 'Missing title tag',
        category: 'metadata',
        impact:
          'Search engines may not understand the page topic, which can reduce rankings and click‑through rate.',
        recommended_action:
          'Add a unique, descriptive title of around 50–60 characters including the primary keyword once.'
      });
    } else if (titleText.length < 30 || titleText.length > 65) {
      issues.push({
        id: 'title_length',
        severity: 'medium',
        title: 'Suboptimal title length',
        text: 'The title is too short or too long.',
        description: `Current title is ${titleText.length} characters: "${titleText}".`,
        label: 'Suboptimal title length',
        category: 'metadata',
        impact:
          'Titles that are too short or too long can hurt CTR and may be truncated in search results.',
        recommended_action:
          'Rewrite the title to around 50–60 characters while keeping it compelling and keyword‑relevant.'
      });
    }

    // ---------- Meta description ----------
    const metaDesc =
      $('meta[name="description"]').attr('content')?.trim() ?? '';
    if (!metaDesc) {
      issues.push({
        id: 'missing_meta_description',
        severity: 'medium',
        title: 'Missing meta description',
        text: 'The page is missing a meta description.',
        description: 'No meta description tag was found in the head.',
        label: 'Missing meta description',
        category: 'metadata',
        impact:
          'Without a meta description, snippets may be less compelling, which can lower organic click‑through rate.',
        recommended_action:
          'Add a unique meta description (around 120–160 characters) summarizing the page and including the primary keyword.'
      });
    }

    // ---------- H1 checks ----------
    const h1s = $('h1');
    if (h1s.length === 0) {
      issues.push({
        id: 'missing_h1',
        severity: 'medium',
        title: 'Missing H1 heading',
        text: 'The page has no H1 heading.',
        description: 'No H1 tags were found on the page.',
        label: 'Missing H1 heading',
        category: 'content',
        impact:
          'Search engines and users get less clarity about the main topic of the page.',
        recommended_action:
          'Add a single, descriptive H1 that clearly states the core topic and includes the main keyword.'
      });
    } else if (h1s.length > 1) {
      issues.push({
        id: 'multiple_h1',
        severity: 'low',
        title: 'Multiple H1 headings',
        text: 'The page has multiple H1 headings.',
        description: `Found ${h1s.length} H1 tags.`,
        label: 'Multiple H1 headings',
        category: 'content',
        impact:
          'Multiple H1s can dilute topical focus and make the structure less clear.',
        recommended_action:
          'Keep one main H1 and convert additional H1s into H2 or H3 where appropriate.'
      });
    }

    // ---------- Image alt attributes ----------
    const allImages = $('img').toArray();
    const imagesWithoutAlt = allImages.filter(
      (el) => !$(el).attr('alt') || $(el).attr('alt').trim() === ''
    );
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        id: 'missing_image_alt',
        severity: 'low',
        title: 'Images without alt text',
        text: 'Some images are missing alt attributes.',
        description: `Found ${imagesWithoutAlt.length} images without meaningful alt text.`,
        label: 'Images without alt text',
        category: 'content',
        impact:
          'Missing alt text reduces accessibility and can limit image search visibility.',
        recommended_action:
          'Add concise, descriptive alt text to important images, especially those that convey content.'
      });
    }

    // ---------- Placeholder / empty links ----------
    const placeholderLinks = $('a[href]')
      .toArray()
      .filter((el) => {
        const href = $(el).attr('href') || '';
        return (
          href === '' ||
          href === '#' ||
          href.toLowerCase().startsWith('javascript:')
        );
      });
    if (placeholderLinks.length > 0) {
      issues.push({
        id: 'placeholder_links',
        severity: 'low',
        title: 'Placeholder or empty links',
        text: 'Some links are placeholders or have empty hrefs.',
        description: `Found ${placeholderLinks.length} links with empty, "#" or "javascript:" href values.`,
        label: 'Placeholder or empty links',
        category: 'links',
        impact:
          'Placeholder links can hurt user experience and send mixed signals about crawl paths.',
        recommended_action:
          'Replace placeholder links with real destinations or remove them until they are ready.'
      });
    }

    // ---------- Canonical tag ----------
    const canonical = $('link[rel="canonical"]').attr('href')?.trim();
    if (!canonical) {
      issues.push({
        id: 'missing_canonical',
        severity: 'low',
        title: 'Missing canonical tag',
        text: 'The page is missing a canonical tag.',
        description: 'No canonical link tag was found in the head.',
        label: 'Missing canonical tag',
        category: 'technical',
        impact:
          'Without a canonical URL, duplicate or similar pages can create indexation and consolidation issues.',
        recommended_action:
          'Add a canonical link pointing to the preferred version of the page.'
      });
    }

    // ---------- Word count (content depth) ----------
    const bodyText = $('body')
      .clone()
      .find('script, style, noscript').remove().end()
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    const wordCount = bodyText ? bodyText.split(' ').length : 0;

    if (wordCount < 300) {
      issues.push({
        id: 'low_word_count',
        severity: 'low',
        title: 'Low word count',
        text: 'The page has a low amount of indexable text content.',
        description: `Estimated word count is ${wordCount} words.`,
        label: 'Low word count',
        category: 'content',
        impact:
          'Thin content can struggle to rank and may not fully satisfy search intent.',
        recommended_action:
          'Expand the page with more unique, helpful content that addresses user questions in depth.'
      });
    }

    // ---------- Internal links ----------
    const internalLinks = $('a[href]')
      .toArray()
      .map(el => $(el).attr('href') || '')
      .filter(href => {
        try {
          if (href.startsWith('/')) return true;
          const targetHost = new URL(href, url).hostname;
          const currentHost = new URL(url).hostname;
          return targetHost === currentHost;
        } catch {
          return false;
        }
      });

    if (internalLinks.length < 5) {
      issues.push({
        id: 'few_internal_links',
        severity: 'low',
        title: 'Few internal links',
        text: 'The page has very few internal links.',
        description: `Found only ${internalLinks.length} internal links on this page.`,
        label: 'Few internal links',
        category: 'links',
        impact:
          'Too few internal links can limit crawl paths and reduce how well link equity flows through the site.',
        recommended_action:
          'Add contextual internal links to other relevant pages such as key categories, guides, or related articles.'
      });
    }

    // ---------- robots meta / noindex / nofollow / noarchive ----------
    const robotsMeta = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';
    const isNoindex = robotsMeta.includes('noindex');
    const isNofollow = robotsMeta.includes('nofollow');
    const isNoarchive = robotsMeta.includes('noarchive');

    if (isNoindex) {
      issues.push({
        id: 'noindex_meta',
        severity: 'high',
        title: 'Page set to noindex',
        text: 'The robots meta tag is preventing this page from being indexed.',
        description: `Robots meta content: "${robotsMeta}".`,
        label: 'Page set to noindex',
        category: 'technical',
        impact:
          'Pages with a noindex directive will not appear in search results, even if they have strong content and links.',
        recommended_action:
          'Remove the noindex directive from the robots meta tag if you want this page to be indexable by search engines.'
      });
    }

    if (isNofollow) {
      issues.push({
        id: 'nofollow_meta',
        severity: 'medium',
        title: 'Robots meta set to nofollow',
        text: 'The robots meta tag is set to nofollow.',
        description: `Robots meta content: "${robotsMeta}".`,
        label: 'Robots nofollow',
        category: 'technical',
        impact:
          'A nofollow directive at page level tells crawlers not to follow any links on the page, which can reduce link equity flow to other pages.',
        recommended_action:
          'Keep page-level nofollow only on pages where you explicitly do not want crawlers to follow links.'
      });
    }

    if (isNoarchive) {
      issues.push({
        id: 'noarchive_meta',
        severity: 'low',
        title: 'Robots meta set to noarchive',
        text: 'The robots meta tag is set to noarchive.',
        description: `Robots meta content: "${robotsMeta}".`,
        label: 'Robots noarchive',
        category: 'technical',
        impact:
          'Noarchive prevents search engines from showing a cached copy of the page; it affects how users see cached results rather than rankings directly.',
        recommended_action:
          'Use noarchive only if you have a specific reason not to show cached versions of the page.'
      });
    }

    // ---------- Outbound links with rel="nofollow" ----------
    const currentHost = (() => {
      try {
        return new URL(url).hostname;
      } catch {
        return null;
      }
    })();

    if (currentHost) {
      const outboundLinks = $('a[href]')
        .toArray()
        .map(el => {
          const href = $(el).attr('href') || '';
          const rel = ($(el).attr('rel') || '').toLowerCase();
          return { href, rel };
        })
        .filter(({ href }) => {
          try {
            const targetUrl = new URL(href, url);
            return targetUrl.hostname !== currentHost;
          } catch {
            return false;
          }
        });

      const outboundNofollow = outboundLinks.filter(link =>
        link.rel.split(/\s+/).includes('nofollow')
      );

      if (outboundLinks.length > 0 && outboundNofollow.length === outboundLinks.length) {
        issues.push({
          id: 'all_outbound_nofollow',
          severity: 'low',
          title: 'All outbound links are nofollow',
          text: 'Every outbound link on the page uses rel="nofollow".',
          description: `Detected ${outboundLinks.length} outbound links, all marked as nofollow.`,
          label: 'All outbound links nofollowed',
          category: 'links',
          impact:
            'Nofollow tells search engines not to pass authority through those links; overusing it can limit natural link equity flow and signals to other sites.',
          recommended_action:
            'Use rel="nofollow" selectively for untrusted, paid, or user-generated links, but allow normal editorial outbound links to pass authority.'
        });
      }
    }

    // ---------- Heading hierarchy (H2 presence) ----------
    const h2Count = $('h2').length;
    if (h2Count === 0 && h1s.length > 0 && wordCount >= 500) {
      issues.push({
        id: 'missing_h2',
        severity: 'low',
        title: 'No H2 subheadings',
        text: 'The page has a main H1 but no H2 subheadings.',
        description:
          'The content appears long enough to be structured with subheadings, but no H2 tags were found.',
        label: 'No H2 subheadings',
        category: 'content',
        impact:
          'Lack of subheadings can make content harder to scan and may reduce topical clarity for search engines.',
        recommended_action:
          'Break the content into logical sections and add descriptive H2 subheadings that reflect key topics.'
      });
    }

    // ---------- Above-the-fold / hero images without alt ----------
    const heroImagesWithoutAlt = allImages.filter(el => {
      const $el = $(el);
      const alt = ($el.attr('alt') || '').trim();
      if (alt) return false;

      const classes = ($el.attr('class') || '').toLowerCase();
      const id = ($el.attr('id') || '').toLowerCase();
      const isHeroClass =
        classes.includes('hero') ||
        classes.includes('banner') ||
        classes.includes('header') ||
        id.includes('hero') ||
        id.includes('banner');

      const widthAttr = parseInt($el.attr('width') || '0', 10);
      const heightAttr = parseInt($el.attr('height') || '0', 10);
      const isLargeByAttr = widthAttr * heightAttr >= 300 * 200;

      const index = allImages.indexOf(el);
      const isEarly = index > -1 && index < 3;

      return isHeroClass || isLargeByAttr || isEarly;
    });

    if (heroImagesWithoutAlt.length > 0) {
      issues.push({
        id: 'hero_image_missing_alt',
        severity: 'medium',
        title: 'Hero or above-the-fold images missing alt text',
        text: 'Key images near the top of the page are missing alt attributes.',
        description: `Detected ${heroImagesWithoutAlt.length} likely hero/above-the-fold images without meaningful alt text.`,
        label: 'Hero images missing alt',
        category: 'content',
        impact:
          'Missing alt text on prominent images hurts accessibility and makes it harder for search engines to understand the main visual context of the page.',
        recommended_action:
          'Add concise, descriptive alt text to hero and above-the-fold images that reflects the main purpose or message of the visual.'
      });
    }

    // ---------- Keyword ideas ----------
    const keywordIdeas = extractKeywordIdeas(titleText, bodyText);

    const overall_score = computeScore(issues);

    res.json({
      url,
      page_type: 'Landing page', // You can refine this later.
      topic: 'Sample SEO brief for this URL',
      overall_score,
      issues,
      keywords: keywordIdeas
    });
  } catch (error) {
    console.error('Audit error:', error.message);

    // Return a synthetic technical issue on failure
    const issues = [
      {
        id: 'fetch_error',
        severity: 'high',
        title: 'Unable to fetch or parse page',
        text: 'The auditor could not fetch or parse the page.',
        description:
          'There was an error fetching or parsing the target URL. It may be down, blocked, or returning a non‑HTML response.',
        label: 'Fetch/parsing error',
        category: 'technical',
        impact:
          'If crawlers cannot access or parse the page, it will not be indexed or ranked.',
        recommended_action:
          'Check that the URL is correct, returns a 200 status, is not blocked by robots.txt, and is accessible from external servers.'
      }
    ];

    res.status(500).json({
      url,
      page_type: null,
      topic: null,
      overall_score: computeScore(issues),
      issues,
      keywords: []
    });
  }
});

// (Optional) health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
