export const ISSUE_CATALOG = {
  title_too_long: {
    title: "Title tag is too long",
    priority: "fix_now",
    why: "Long titles can truncate in search results and dilute keyword focus.",
    what: "Shorten the title to ~50–60 characters while keeping the primary keyword near the front.",
    example_fix: "Old: 'Best Affordable SEO Site Audit Tool For Small Businesses And Agencies'\nNew: 'SEO Site Audit Tool for Small Agencies | RankyPulse'"
  },
  missing_meta_description: {
    title: "Missing meta description",
    priority: "fix_next",
    why: "A missing description reduces click-through control and may lead to irrelevant snippets.",
    what: "Add a concise description (120–160 chars) summarizing value and matching search intent.",
    example_fix: "Example: 'Instant SEO audits with clear fixes. Scan a page and get prioritized actions in seconds.'"
  },
  missing_h1: {
    title: "Missing H1 heading",
    priority: "fix_next",
    why: "H1 helps users and search engines understand the main topic of the page.",
    what: "Add a single, descriptive H1 that matches the page intent and primary query.",
    example_fix: "Example H1: 'SEO Audit Report for Your Page'"
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
