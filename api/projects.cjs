const express = require('express');
const router = express.Router();

const {
  createProject,
  listProjects,
  getProject,
  updateProject,
  addCrawlRun,
  listCrawlsForProject
} = require('../projectsStore.cjs');
const { classifySaasPage } = require('../saasPageTypeDetector.cjs');
const { cleanTopic } = require('../utils/cleanTopic.cjs');

// Very small "homepage crawl": just classify and score the root URL.
function scoreFromClassification(url) {
  const classification = classifySaasPage({ url });
  const pageType = classification.pageType || 'blog';
  const rawTopic = classification.title || classification.h1 || url;
  const topic = cleanTopic(rawTopic) || 'Untitled page';

  // reuse same heuristic as /api/audit
  let base = 60;
  if (pageType === 'pricing') base += 5;
  if (pageType === 'feature') base += 3;
  if (pageType === 'comparison') base += 2;
  if (!topic || topic.split(/\s+/).length < 2) base -= 10;
  base = Math.max(0, Math.min(100, base));
  return { score: Math.round(base), pageType, topic };
}

// POST /api/projects  { name, domain }
router.post('/', (req, res) => {
  const { name, domain } = req.body || {};
  if (!name || !domain) {
    return res.status(400).json({ error: 'name and domain are required.' });
  }

  const project = createProject({ name, domain });
  res.status(201).json(project);
});

// GET /api/projects
router.get('/', (req, res) => {
  res.json(listProjects());
});

// POST /api/projects/:id/crawl  (one-time crawl)
router.post('/:id/crawl', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const homepageUrl = project.domain.startsWith('http')
    ? project.domain
    : `https://${project.domain}`;

  const { score, pageType, topic } = scoreFromClassification(homepageUrl);

  const now = new Date().toISOString();
  updateProject(project.id, {
    last_crawl_at: now,
    last_crawl_status: 'completed',
    last_crawl_score: score
  });

  const run = addCrawlRun({
    project_id: project.id,
    score,
    url_count: 1
  });

  res.json({
    project_id: project.id,
    homepage_url: homepageUrl,
    page_type: pageType,
    topic,
    score,
    crawl_run: run
  });
});

// GET /api/projects/:id/crawls
router.get('/:id/crawls', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  res.json(listCrawlsForProject(project.id));
});

module.exports = router;

