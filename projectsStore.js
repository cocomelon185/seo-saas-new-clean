// projectsStore.js - temporary in-memory store for Phase B

const { randomUUID } = require('crypto');

let projects = [];
let crawls = [];

function createProject({ name, domain }) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const project = {
    id,
    name,
    domain,
    created_at: now,
    last_crawl_at: null,
    last_crawl_status: null,
    last_crawl_score: null
  };
  projects.push(project);
  return project;
}

function listProjects() {
  return projects;
}

function getProject(id) {
  return projects.find(p => p.id === id) || null;
}

function updateProject(id, patch) {
  const p = getProject(id);
  if (!p) return null;
  Object.assign(p, patch);
  return p;
}

// Very simple crawl runs history
function addCrawlRun({ project_id, score, url_count }) {
  const id = randomUUID();
  const finished_at = new Date().toISOString();
  const run = { id, project_id, finished_at, score, url_count };
  crawls.push(run);
  return run;
}

function listCrawlsForProject(project_id) {
  return crawls.filter(c => c.project_id === project_id);
}

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  addCrawlRun,
  listCrawlsForProject
};

