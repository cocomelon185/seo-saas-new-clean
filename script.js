function normalizeUrl(url) {
  if (!url) return '';
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

function isValidUrl(url) {
  try {
    const normalizedUrl = normalizeUrl(url);
    const urlObject = new URL(normalizedUrl);
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_URL = window.DEFAULT_ANALYZE_URL || 'https://your-website.com';
  const KEYWORDS_SELECTOR = '#seo-keywords';
  const analyzeBtn = document.getElementById('analyzeBtn');
  const urlInput = document.getElementById('urlInput');
  const resultCard = document.querySelector('.result-card');
  const scoreEl = document.getElementById('seo-score');
  const keywordsEl = document.getElementById('seo-keywords');
  const titleEl = document.getElementById('title-analysis');
  const metaEl = document.getElementById('meta-desc');
  const suggestionsEl = document.getElementById('seo-suggestions');

  if (!analyzeBtn) {
    console.error('Analyze button not found');
    return;
  }

  analyzeBtn.addEventListener('click', async () => {
    const rawUrl = urlInput ? urlInput.value : '';
    const normalizedUrl = normalizeUrl(rawUrl);

    if (!isValidUrl(normalizedUrl)) {
      alert('Please enter a valid URL (example: example.com or https://example.com)');
      return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await res.json();

      if (resultCard) resultCard.style.display = 'block';
      if (scoreEl && typeof data.score === 'number') {
        scoreEl.textContent = data.score + '/100';
      }
      if (keywordsEl && data.keywords) {
        keywordsEl.textContent = Array.isArray(data.keywords)
          ? data.keywords.join(', ')
          : String(data.keywords);
      }
      if (titleEl && data.titleAnalysis) {
        titleEl.textContent = data.titleAnalysis;
      }
      if (metaEl && (data.metaDescriptionCheck || data.metaDesc)) {
        metaEl.textContent = data.metaDescriptionCheck || data.metaDesc;
      }
      if (suggestionsEl && Array.isArray(data.suggestions)) {
        suggestionsEl.innerHTML = '';
        data.suggestions.forEach(s => {
          const li = document.createElement('li');
          li.textContent = s;
          suggestionsEl.appendChild(li);
        });
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to analyze URL');
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze Now';
    }
  });

  // Add click handlers for feature and pricing cards - targeting <li> elements
  console.log('Adding card click handlers...');
  
  const heroSection = document.querySelector('.hero');
  const scrollToAnalyzer = () => {
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth' });
    }
    if (urlInput) {
      urlInput.focus({ preventScroll: true });
    }
  };

  const triggerAnalysis = (focusEl) => {
    if (!analyzeBtn) return;
    if (urlInput && (!urlInput.value || !isValidUrl(normalizeUrl(urlInput.value)))) {
      urlInput.value = DEFAULT_URL;
    }
    analyzeBtn.click();
    if (focusEl) {
      focusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Features section - target li elements
  const featuresSection = document.querySelector('.features');
  if (featuresSection) {
    const featureLis = featuresSection.querySelectorAll('ul > li');
    console.log('Found feature items:', featureLis.length);
    
    featureLis.forEach(li => {
      li.style.cursor = 'pointer';
      li.addEventListener('click', function(e) {
        e.stopPropagation();
        const strong = this.querySelector('strong');
        const title = strong ? strong.textContent.trim() : 'Feature';
        const key = this.dataset.feature || title;
        if (key === 'content') {
          scrollToAnalyzer();
        } else if (key === 'keyword') {
          const focusTarget = document.querySelector(KEYWORDS_SELECTOR)?.closest('.result-card') || resultCard;
          triggerAnalysis(focusTarget);
        } else {
          triggerAnalysis(resultCard || null);
        }
      });
      console.log('Added handler for feature');
    });
  }
  
  // Pricing section - target li elements
  const pricingSection = document.querySelector('.pricing');
  if (pricingSection) {
    const pricingLis = pricingSection.querySelectorAll('ul > li');
    console.log('Found pricing items:', pricingLis.length);
    
    pricingLis.forEach(li => {
      li.style.cursor = 'pointer';
      li.addEventListener('click', function(e) {
        e.stopPropagation();
        const h3 = this.querySelector('h3');
        const title = h3 ? h3.textContent.trim() : 'Plan';
        const planKey = (this.dataset.plan || title).toLowerCase();
        const planAnchors = { free: '#free', pro: '#pro' };
        const plan = planAnchors[planKey] || '';
        const target = plan ? `pricing.html${plan}` : 'pricing.html';
        window.location.href = target;
      });
      console.log('Added handler for pricing');
    });
  }
  
  console.log('Card handlers setup complete!');
});
