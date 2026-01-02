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
  const analyzeBtn = document.getElementById('analyzeBtn');
  const urlInput = document.getElementById('urlInput');
  const resultCard = document.querySelector('.result-card');

  // URL Analysis (existing feature)
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
      const rawUrl = urlInput ? urlInput.value : '';
      const normalizedUrl = normalizeUrl(rawUrl);

      if (!isValidUrl(normalizedUrl)) {
        alert('Please enter a valid URL');
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

        if (!res.ok) throw new Error('Analysis failed');
        const data = await res.json();

        if (resultCard) resultCard.style.display = 'block';
        document.getElementById('seo-score').textContent = data.score + '/100';
        document.getElementById('seo-keywords').textContent = data.keywords.join(', ');
        document.getElementById('title-analysis').textContent = data.titleAnalysis;
        document.getElementById('meta-desc').textContent = data.metaDescriptionCheck || data.metaDesc;

        const ul = document.getElementById('seo-suggestions');
        ul.innerHTML = '';
        data.suggestions.forEach(s => {
          const li = document.createElement('li');
          li.textContent = s;
          ul.appendChild(li);
        });
      } catch (err) {
        alert(err.message || 'Failed to analyze URL');
      } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Now';
      }
    });
  }

  // Feature Cards Click Handlers
  const keywordResearchBtn = document.getElementById('keywordResearchBtn');
  if (keywordResearchBtn) {
    keywordResearchBtn.addEventListener('click', handleKeywordResearch);
  }

  // Pricing Cards
  const pricingSection = document.querySelector('.pricing');
  if (pricingSection) {
    const pricingLis = pricingSection.querySelectorAll('ul > li');
    
    pricingLis.forEach(li => {
      li.style.cursor = 'pointer';
      li.addEventListener('click', function() {
        const h3 = this.querySelector('h3');
        const title = h3 ? h3.textContent.trim() : '';
        
        if (title.includes('Free')) {
          // alert('Free Tier - $0/month\n\n✓ Basic SEO analysis\n✓ 10 URLs/month\n✓ Email support\n\nSign up coming soon!');
        } else if (title.includes('Pro')) {
          // alert('Pro Tier - $29/month\n\n✓ Advanced analysis\n✓ Unlimited URLs\n✓ Priority support\n✓ API access\n\nUpgrade coming soon!');
        }
      });
    });
  }
});

// Content Analysis Feature
async function handleContentAnalysis() {
  

  
  if (!content || content.trim().length === 0) {
    return;
  }
  
  try {
    const res = await fetch('/api/content-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim() })
    });
    
    if (!res.ok) throw new Error('Analysis failed');
    
    const data = await res.json();
    
    let result = '📊 Content Analysis Results\n\n';
    result += `📝 Word Count: ${data.wordCount}\n`;
    result += `📏 Characters: ${data.charCount}\n`;
    result += `📄 Sentences: ${data.sentences}\n`;
    result += `📖 Readability: ${data.readabilityScore}/100\n\n`;
    result += '📌 Suggestions:\n';
    data.suggestions.forEach(s => result += `• ${s}\n`);
    
    alert(result);
  } catch (error) {
    alert('❌ Analysis failed: ' + error.message);
  }
}

// Keyword Research Feature
async function handleKeywordResearch() {
  const keywordInput = document.getElementById('keywordInput');
  const keyword = keywordInput.value.trim();

  if (!keyword) {
    document.getElementById('error-message').textContent = 'Please enter a keyword.';
    document.getElementById('error-message').style.display = 'block';
    return;
  }
  try {
    const res = await fetch('/api/keyword-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: keyword.trim() })
    });
    
    if (!res.ok) throw new Error('Research failed');
    
    const data = await res.json();
    
    document.getElementById('main-keyword').textContent = data.mainKeyword;

    const relatedKeywordsList = document.getElementById('related-keywords-list');
    relatedKeywordsList.innerHTML = '';
    data.relatedKeywords.forEach((kw) => {
      const li = document.createElement('li');
      li.textContent = `${kw.keyword} — volume: ${kw.volume}, difficulty: ${kw.difficulty}`;
      relatedKeywordsList.appendChild(li);
    });

    const keywordSuggestionsList = document.getElementById('keyword-suggestions');
    keywordSuggestionsList.innerHTML = '';
    data.suggestions.forEach(suggestion => {
      const li = document.createElement('li');
      li.textContent = suggestion;
      keywordSuggestionsList.appendChild(li);
    });

    document.getElementById('keyword-research-result').style.display = 'block';
    document.getElementById('keyword-research-result').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    alert('❌ Research failed: ' + error.message);
  }
}
