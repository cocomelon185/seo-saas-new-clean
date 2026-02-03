# Phase 4 — Distribution & Growth: Proof of Implementation

Phase 4 roadmap targets:
1. Landing page focused on instant audit (URL input above the fold).
2. Shareable reports for client and team use.
3. Content marketing tied directly to audit use cases.

## 1) Landing page instant audit input
- Landing page now includes a URL input form above the fold.
- Submit routes directly to `/audit?url=...`.
- File: `apps/web/src/pages/Landing.jsx`

## 2) Shareable reports
- API: `api/shared-reports.js` (create + fetch shared reports).
- Frontend route: `/r/:reportId` in `apps/web/src/App.jsx`.
- UI: `apps/web/src/pages/SharedReportPage.jsx`, `apps/web/src/components/ShareAuditButton.jsx`.
- E2E coverage: `apps/web/tests/phase4.e2e.spec.js` (shared report acquisition).

## 3) Content marketing tied to audit use cases
- Dedicated use-case pages with audit CTAs:
  - `/use-cases/saas-landing-audit` → `apps/web/src/pages/SaasLandingAuditPage.jsx`
  - `/use-cases/blog-audit-checklist` → `apps/web/src/pages/BlogAuditChecklistPage.jsx`
  - `/use-cases/agency-audit-workflow` → `apps/web/src/pages/AgencyAuditWorkflowPage.jsx`
- Linked from landing page section in `apps/web/src/pages/Landing.jsx`.

## Verification steps (manual)
1. Open `/` and confirm URL input appears above the fold.
2. Submit a URL and confirm navigation to `/audit?url=...`.
3. Open each use-case page and verify a CTA to `/start` or `/audit`.
4. Open a shared report (`/r/<id>`) and verify report content + CTA.

## Automated checks
- `apps/web/tests/phase4.e2e.spec.js` now includes:
  - Landing page URL input routes to `/audit`.
  - Use-case pages are reachable and include a clear audit CTA.
