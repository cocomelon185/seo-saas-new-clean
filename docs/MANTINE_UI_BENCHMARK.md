# Mantine-First Visual Benchmark (Launch Sprint)

## Goal
Use one UI system (Mantine) and model RankyPulse visual direction on proven SEO/SaaS UX patterns used by category leaders.

## Research Sources
- Semrush product + navigation patterns: https://www.semrush.com/
- Ahrefs product + navigation patterns: https://ahrefs.com/
- HubSpot Website Grader funnel pattern (single-input, immediate value): https://website.grader.com/
- Trustpilot user feedback (Semrush): https://www.trustpilot.com/review/semrush.com
- Trustpilot user feedback (Ahrefs): https://www.trustpilot.com/review/ahrefs.com
- Independent comparative review context (Semrush/Ahrefs): https://www.forbes.com/advisor/business/software/semrush-vs-ahrefs/
- Mantine core docs: https://mantine.dev/
- Mantine AppShell pattern: https://mantine.dev/core/app-shell/
- Mantine UI blocks/templates: https://ui.mantine.dev/
- Mantine charts: https://mantine.dev/charts/line-chart/

## What User Feedback Suggests
- Positive when tools are fast, data-rich, and actionable.
- Negative when interfaces feel overloaded or unclear for non-experts.
- Strong conversion pattern: users respond better to "single clear next step" than feature-dense first screens.

## Visual Direction Chosen
- Benchmark style: "Semrush/Ahrefs-grade utility UI + cleaner Linear-style spacing."
- Single-brand palette: violet-led with cool slate neutrals.
- High clarity hierarchy:
  - One main CTA per viewport
  - KPI cards above deep detail
  - Charts paired with concrete actions
  - Reduced clutter in top navigation

## Mantine Mapping for RankyPulse
- Navigation and page frame: `Container`, `Group`, `Paper`, `Drawer`, `Burger`
- Conversion sections: `Card`, `TextInput`, `Button`, `Badge`
- Credibility and progression: `RingProgress`, `LineChart`, `List`, `ThemeIcon`
- Reusable visual standards: Mantine theme (`primaryColor`, fonts, shadows, radius)

## Implementation Rules
- Keep backend/API/business logic unchanged.
- UI refactor only; preserve routes/events.
- Maintain existing GA4/Sentry and funnel tracking behavior.
- Roll out in slices:
  1. Marketing shell + landing + start
  2. Auth + pricing + comparison pages
  3. App shell + audit/rank/improve workspace

## Acceptance Criteria
- Consistent visual language across all high-traffic pages.
- No visual "patchwork" between sections.
- Mobile and desktop layouts remain stable.
- Lint/build remain green after each slice.
