// ========== ERROR HANDLING HELPERS ==========

// Helper: Validate URL format
function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

// Helper: Show error message to user
function showError(message) {
  const errorEl = document.createElement('div');
  errorEl.style.cssText = `
    padding: 12px;
    margin: 12px 0;
    border-radius: 8px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.5);
    color: #fca5a5;
    font-size: 13px;
    animation: slideIn 0.3s ease-out;
  `;
  errorEl.textContent = message;

  const resultsCol = document.querySelector('.results-column');
  if (resultsCol) {
    resultsCol.insertBefore(errorEl, resultsCol.firstChild);
  }

  // Auto-remove after 8 seconds
  setTimeout(() => errorEl.remove(), 8000);
}

// Add slide-in animation
if (!document.querySelector('style[data-error-animation]')) {
  const style = document.createElement('style');
  style.setAttribute('data-error-animation', 'true');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// ========== MAIN LOGIC ==========

// Helper: run audit for a URL and update main score/quick wins/keywords UI
async function runPageAuditAndUpdateUI(url) {
  const res = await fetch('/api/analysis?url=' + encodeURIComponent(url));
  
  if (!res.ok) {
    if (res.status === 404) throw new Error('Site not found (404)');
    if (res.status === 403) throw new Error('Site blocked access (403)');
    throw new Error(`Audit failed: ${res.status}`);
  }
  
  const data = await res.json();

  // 1) Score with color bands
  const scoreValueEl = document.getElementById('scoreValue');
  const score = data.score ?? 0;
  
  if (scoreValueEl) {
    scoreValueEl.textContent = score;
    
    // Reset and add color class based on score band
    scoreValueEl.className = 'score-number';
    if (score >= 85) {
      scoreValueEl.classList.add('score-excellent');
    } else if (score >= 67) {
      scoreValueEl.classList.add('score-good');
    } else if (score >= 50) {
      scoreValueEl.classList.add('score-getting-there');
    } else {
      scoreValueEl.classList.add('score-needs-work');
    }
  }

  // 2) Update score band label and pill
  const scoreBandLabel = document.getElementById('scoreBandLabel');
  const scoreBandText = document.getElementById('scoreBandText');
  const scoreBandDot = document.getElementById('scoreBandDot');
  const scoreBandPill = document.getElementById('scoreBandPill');
  
  let bandLabel = 'Needs work';
  let bandColor = '#ef4444';
  let pillBg = 'rgba(239, 68, 68, 0.1)';
  let pillBorder = 'rgba(239, 68, 68, 0.3)';
  
  if (score >= 85) {
    bandLabel = 'Excellent';
    bandColor = '#10b981';
    pillBg = 'rgba(16, 185, 129, 0.1)';
    pillBorder = 'rgba(16, 185, 129, 0.3)';
  } else if (score >= 67) {
    bandLabel = 'Good';
    bandColor = '#3b82f6';
    pillBg = 'rgba(59, 130, 246, 0.1)';
    pillBorder = 'rgba(59, 130, 246, 0.3)';
  } else if (score >= 50) {
    bandLabel = 'Getting there';
    bandColor = '#f59e0b';
    pillBg = 'rgba(245, 158, 11, 0.1)';
    pillBorder = 'rgba(245, 158, 11, 0.3)';
  }

  if (scoreBandLabel) {
    scoreBandLabel.innerHTML = `
      <span style="color:${bandColor}">${bandLabel}</span>
      <span class="info-icon" title="Score based on content depth, meta tags, and structure.">i</span>
    `;
  }
  if (scoreBandText) scoreBandText.textContent = bandLabel;
  if (scoreBandDot) scoreBandDot.style.background = bandColor;
  if (scoreBandPill) {
    scoreBandPill.style.background = pillBg;
    scoreBandPill.style.borderColor = pillBorder;
  }

  // 3) Update Quick Wins
  const quickList = document.getElementById('quickWinsList');
  if (quickList) {
    quickList.innerHTML = '';
    const issues = data.issues || [];
    
    if (issues.length === 0) {
      quickList.innerHTML = '<div class="quick-item" style="color:#10b981">No major issues found! 🎉</div>';
    } else {
      issues.slice(0, 5).forEach(issue => {
        const div = document.createElement('div');
        div.className = 'quick-item';
        div.innerHTML = `
          <div class="quick-icon">!</div>
          <div class="quick-text">${issue}</div>
        `;
        quickList.appendChild(div);
      });
    }
  }

  // 4) Update Keyword Ideas
  const keywordRow = document.getElementById('keywordIdeas');
  if (keywordRow) {
    keywordRow.innerHTML = '';
    const keywords = data.keywords || [];
    
    if (keywords.length === 0) {
      keywordRow.innerHTML = '<span class="chip">No keywords found</span>';
    } else {
      keywords.slice(0, 6).forEach(kw => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = kw;
        keywordRow.appendChild(chip);
      });
    }
  }

  // 5) Update Content Brief
  const briefText = document.getElementById('contentBrief');
  if (briefText && data.brief) {
    // Show a simplified version of the brief
    briefText.innerHTML = `
      <strong>Topic:</strong> ${data.brief.topic || 'Unknown'}<br>
      <strong>Intent:</strong> ${data.brief.intent || 'Informational'}<br>
      <strong>Target Length:</strong> ${data.brief.target_word_count || '1000+'} words
    `;
  }
}

// Wire up the top "Run analysis" button with ERROR HANDLING
document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('runButton');
  const urlInput = document.getElementById('inputUrl');
  const contentInput = document.getElementById('inputContent');

  if (runBtn) {
    runBtn.addEventListener('click', async () => {
      const url = urlInput?.value.trim() || '';
      const content = contentInput?.value.trim() || '';

      // Validation: at least one input required
      if (!url && !content) {
        showError('⚠️ Please enter a URL or paste content to analyze.');
        return;
      }

      // Validation: if URL provided, validate format
      if (url && !isValidUrl(url)) {
        showError('❌ Invalid URL. Make sure it starts with https:// or http://');
        return;
      }

      runBtn.disabled = true;
      const originalText = runBtn.textContent;
      runBtn.textContent = 'Running...';
      
      // Show loader
      const loader = document.getElementById('loader');
      if (loader) loader.style.display = 'flex';

      try {
        // Set timeout for request (30 seconds)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        await runPageAuditAndUpdateUI(url);
        
        clearTimeout(timeout);
      } catch (err) {
        // Parse error and show friendly message
        if (err.name === 'AbortError') {
          showError('⏱️ Request timed out (30+ seconds). The site might be very slow. Try again?');
        } else if (err instanceof TypeError) {
          showError('❌ Network error. Check your internet connection.');
        } else if (err.message.includes('404')) {
          showError('❌ Site not found (404). Check the URL and try again.');
        } else if (err.message.includes('403')) {
          showError('⚠️ The site blocked crawler access. Try a different URL.');
        } else if (err.message.includes('Audit failed')) {
          showError('❌ Backend error. Make sure the FastAPI server is running on port 8001.');
        } else {
          showError(`❌ Error: ${err.message || 'Something went wrong. Try again?'}`);
        }
        console.error('Analysis error:', err);
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = originalText;
        if (loader) loader.style.display = 'none';
      }
    });
  }
});

// ========== MODE TOGGLE FUNCTIONALITY ==========
let selectedMode = 'both'; // Track which mode is selected

document.addEventListener('DOMContentLoaded', () => {
  const modeOptions = document.querySelectorAll('.toggle-option');
  
  modeOptions.forEach(option => {
    option.addEventListener('click', () => {
      // 1. Remove active class from all
      modeOptions.forEach(opt => opt.classList.remove('active'));
      
      // 2. Add active class to clicked
      option.classList.add('active');
      
      // 3. Update state
      selectedMode = option.getAttribute('data-mode');
      console.log('Mode selected:', selectedMode);
    });
  });
});
