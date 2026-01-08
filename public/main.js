// main.js – audit UI + checklist + progress (updated for competitive scoring)

async function runAudit(urlToAudit) {
  try {
    // Call the new competitive scoring endpoint
    const response = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlToAudit }),
    });
    
    if (!response.ok) {
      throw new Error(`Audit request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Audit result:', data);
    return data;
  } catch (error) {
    console.error('Error running audit:', error);
    throw error;
  }
}

// SMART QUICK WINS SELECTOR (same logic as script.js)
function selectQuickWins(issues) {
  const quickWinPriority = [
    'missing h1 heading',
    'no meta description',
    'no title tag found',
    'title length needs tweaking',
    'title is too short',
    'title is too long',
    'missing canonical tag',
    'add more internal links',
    'missing subheadings',
    'meta description could be better',
    'meta description too short',
    'meta description too long',
  ];

  const eligible = issues.filter((i) => 
    i.severity.toLowerCase() === 'high' || i.severity.toLowerCase() === 'medium'
  );

  const sorted = eligible.sort((a, b) => {
    const summaryA = a.summary.toLowerCase();
    const summaryB = b.summary.toLowerCase();
    
    let indexA = quickWinPriority.findIndex((keyword) => summaryA.includes(keyword));
    let indexB = quickWinPriority.findIndex((keyword) => summaryB.includes(keyword));
    
    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;
    
    if (indexA === indexB) {
      const severityRank = { high: 0, medium: 1 };
      return (severityRank[a.severity.toLowerCase()] ?? 2) - (severityRank[b.severity.toLowerCase()] ?? 2);
    }
    
    return indexA - indexB;
  });

  return sorted.slice(0, 3);
}

// ----- Helpers for checklist state -----

function storageKey(url) {
  return `audit-issues:${url}`;
}

function saveIssueState(url, container) {
  const checkboxes = container.querySelectorAll('.audit-issue-checkbox');
  const state = Array.from(checkboxes).map(cb => cb.checked);
  try {
    localStorage.setItem(storageKey(url), JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save issue state:', e);
  }
}

function loadIssueState(url, container) {
  try {
    const raw = localStorage.getItem(storageKey(url));
    if (!raw) return;
    const state = JSON.parse(raw);
    const checkboxes = container.querySelectorAll('.audit-issue-checkbox');
    checkboxes.forEach((cb, i) => {
      const checked = !!state[i];
      cb.checked = checked;
      const li = cb.closest('li');
      if (li) {
        li.classList.toggle('issue-done', checked);
      }
    });
  } catch (e) {
    console.warn('Could not load issue state:', e);
  }
}

function updateCompletedCount(url, container) {
  const checkboxes = container.querySelectorAll('.audit-issue-checkbox');
  const total = checkboxes.length;
  const done = Array.from(checkboxes).filter(cb => cb.checked).length;

  const counterEl = container.querySelector('#audit-issues-counter');
  if (counterEl) {
    counterEl.textContent = total ? `(${done}/${total} completed)` : '';
  }

  if (total > 0) {
    fetch('/api/audit/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, completed: done, total })
    }).catch(err => {
      console.warn('Error sending audit progress:', err);
    });
  }
}

// ----- Wire audit UI with SMART QUICK WINS -----

const auditInput = document.getElementById('audit-url');
const auditButton = document.getElementById('audit-run-btn');
const auditResult = document.getElementById('audit-result');

if (auditInput && auditButton && auditResult) {
  auditButton.addEventListener('click', async () => {
    const url = auditInput.value.trim();
    if (!url) return;

    auditResult.textContent = 'Running audit...';

    try {
      const data = await runAudit(url);

      const severityClass = (severity) => {
        const sev = severity.toLowerCase();
        if (sev === 'high') return 'severity-badge severity-high';
        if (sev === 'medium') return 'severity-badge severity-medium';
        return 'severity-badge severity-low';
      };

      // Use smart quick wins selector (max 3, prioritized)
      const quickWinIssues = selectQuickWins(data.issues || []);
      const quickWinKeywords = (data.keywords || []).slice(0, 5);

      const quickWinsIssuesHtml = quickWinIssues
        .map(issue => `
          <li>
            <span class="${severityClass(issue.severity)}">${issue.severity}</span>
            <span>${issue.summary}</span>
          </li>
        `)
        .join('');

      const quickWinsKeywordsHtml = quickWinKeywords
        .map(kw => `<span class="kw-pill">${kw}</span>`)
        .join(' ');

      const issuesHtml = (data.issues || [])
        .map((issue, index) => `
          <li data-issue-index="${index}">
            <input
              type="checkbox"
              class="audit-issue-checkbox"
              id="audit-issue-${index}"
            />
            <label for="audit-issue-${index}">
              <span class="${severityClass(issue.severity)}">${issue.severity}</span>
              <span>${issue.summary}</span>
            </label>
            <div class="issue-details">
              <p><strong>Impact:</strong> ${issue.impact || 'Not specified'}</p>
              <p><strong>Recommended action:</strong> ${issue.recommended_action || 'Not specified'}</p>
            </div>
          </li>
        `)
        .join('');

      const keywordsHtml = (data.keywords || [])
        .map(kw => `<span class="kw-pill">${kw}</span>`)
        .join(' ');

      auditResult.innerHTML = `
        <div><strong>URL:</strong> ${data.url}</div>
        <div><strong>Page type:</strong> ${data.page_type}</div>
        <div><strong>Topic:</strong> ${data.topic}</div>
        <div><strong>Score:</strong> ${data.overall_score}/100</div>

        <div style="margin-top:8px; padding:8px; border:1px solid #e5e7eb; border-radius:4px; background:#f9fafb;">
          <strong>Quick wins (next 10–15 minutes):</strong>
          <ul style="margin-top:4px; padding-left:18px;">
            ${quickWinsIssuesHtml || '<li>No critical issues found. Great work!</li>'}
          </ul>
          ${quickWinsKeywordsHtml
            ? `<div style="margin-top:4px; font-size:11px;"><strong>Keyword ideas to use:</strong> ${quickWinsKeywordsHtml}</div>`
            : ''
          }
        </div>

        <div style="margin-top:6px;">
          <strong>Keyword ideas:</strong>
          <div class="kw-container" style="margin-top:4px; font-size:11px;">
            ${keywordsHtml || 'No keyword ideas generated.'}
          </div>
        </div>

        <div style="margin-top:6px;">
          <strong>Issues:</strong>
          <span id="audit-issues-counter" style="margin-left:6px; font-size:11px; color:#9ca3af;"></span>
        </div>
        <ul style="margin-top:4px;">
          ${issuesHtml || '<li>No issues found.</li>'}
        </ul>
      `;

      const issueItems = auditResult.querySelectorAll('li');
      issueItems.forEach(li => {
        const checkbox = li.querySelector('.audit-issue-checkbox');
        if (!checkbox) return;
        checkbox.addEventListener('change', () => {
          li.classList.toggle('issue-done', checkbox.checked);
          saveIssueState(data.url, auditResult);
          updateCompletedCount(data.url, auditResult);
        });
      });

      loadIssueState(data.url, auditResult);
      updateCompletedCount(data.url, auditResult);

    } catch (err) {
      console.error(err);
      auditResult.textContent = 'Error running audit. Check console.';
    }
  });
}

// ========== FINISH LINE SECTION 1 ==========


// ----- Create content that ranks (brief generator) -----

document.addEventListener('DOMContentLoaded', () => {
  const briefType = document.getElementById('brief-input-type');
  const briefValue = document.getElementById('brief-input-value');
  const briefBtn = document.getElementById('brief-generate-btn');

  const briefError = document.getElementById('brief-error');
  const briefResults = document.getElementById('brief-results');
  const briefTopicIntent = document.getElementById('brief-topic-intent');
  const briefOutline = document.getElementById('brief-outline');
  const briefChecklist = document.getElementById('brief-checklist');
  const briefPrimaryKeywords = document.getElementById('brief-primary-keywords');
  const briefSecondaryKeywords = document.getElementById('brief-secondary-keywords');
  const briefInternalLinks = document.getElementById('brief-internal-links');

  if (!briefBtn || !briefValue || !briefType) return;

  briefBtn.addEventListener('click', () => {
    const type = briefType.value;
    const value = briefValue.value.trim();

    if (!value) {
      if (briefError) {
        briefError.textContent = 'Enter a keyword or URL to generate a brief.';
        briefError.style.display = 'block';
      }
      if (briefResults) briefResults.style.display = 'none';
      return;
    }

    if (briefError) briefError.style.display = 'none';

    const topic = type === 'keyword' ? value : `Content for ${value}`;
    if (briefTopicIntent) {
      briefTopicIntent.textContent =
        `Topic: ${topic} · Intent: Informational · Target length: ~1,200–1,800 words`;
    }

    if (briefOutline) {
      briefOutline.innerHTML = `
        <li>Intro: define ${topic} and who it is for.</li>
        <li>Why ${topic} matters for your audience.</li>
        <li>Step‑by‑step walkthrough or framework.</li>
        <li>Common mistakes, FAQs, and objections.</li>
        <li>Summary and clear call‑to‑action.</li>
      `;
    }

    if (briefChecklist) {
      briefChecklist.innerHTML = `
        <li>Include the main keyword in title, H1, and first 100 words.</li>
        <li>Add at least 3–5 internal links to relevant pages.</li>
        <li>Use clear H2/H3 headings for each section.</li>
        <li>Answer 3–5 common questions your reader has.</li>
        <li>Add a specific CTA that matches search intent.</li>
      `;
    }

    if (briefPrimaryKeywords) {
      briefPrimaryKeywords.innerHTML = `
        <li>${topic}</li>
        <li>${topic} guide</li>
        <li>best ${topic}</li>
      `;
    }

    if (briefSecondaryKeywords) {
      briefSecondaryKeywords.innerHTML = `
        <li>${topic} tips</li>
        <li>${topic} checklist</li>
        <li>${topic} examples</li>
      `;
    }

    if (briefInternalLinks) {
      briefInternalLinks.innerHTML = `
        <li>Link to your main product or pricing page.</li>
        <li>Link to 1–2 related guides or case studies.</li>
        <li>Link to your contact or demo page.</li>
      `;
    }

    if (briefResults) briefResults.style.display = 'block';
  });
});

// ========== FINISH LINE SECTION 2 - FILE COMPLETE ==========
