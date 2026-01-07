async function runAudit(urlToAudit) {
  try {
    const response = await fetch(`/api/audit?url=${encodeURIComponent(urlToAudit)}`);
    if (!response.ok) {
      throw new Error(`Audit request failed: ${response.status}`);
    }

    const data = await response.json(); // { url, page_type, topic, overall_score, issues, notes }
    console.log('Audit result:', data);
    return data;
  } catch (error) {
    console.error('Error running audit:', error);
    throw error;
  }
}

// --- Wire audit UI ---

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

      // Map severity -> badge CSS classes
      const severityClass = (severity) => {
        if (severity === 'high') return 'severity-badge severity-high';
        if (severity === 'medium') return 'severity-badge severity-medium';
        return 'severity-badge severity-low';
      };

      const issuesHtml = (data.issues || [])
        .map(issue => `
          <li>
            <span class="${severityClass(issue.severity)}">${issue.severity}</span>
            <span>[${(issue.status || '').toUpperCase()}] ${issue.label}</span>
          </li>
        `)
        .join('');

      const notesText = (data.notes && data.notes.length > 0) ? data.notes[0] : '';

      auditResult.innerHTML = `
        <div><strong>URL:</strong> ${data.url}</div>
        <div><strong>Page type:</strong> ${data.page_type}</div>
        <div><strong>Topic:</strong> ${data.topic}</div>
        <div><strong>Score:</strong> ${data.overall_score}/100</div>
        <div style="margin-top:6px;"><strong>Issues:</strong></div>
        <ul style="margin-top:4px;">
          ${issuesHtml || '<li>No issues found.</li>'}
        </ul>
        ${notesText ? `<p style="margin-top:8px; font-size:11px; color:#9ca3af;">${notesText}</p>` : ''}
      `;
    } catch (err) {
      console.error(err);
      auditResult.textContent = 'Error running audit. Check console.';
    }
  });
}
