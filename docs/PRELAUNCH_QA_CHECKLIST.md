# Pre-Launch QA Checklist

Use this checklist before every production launch.

## 1) Required Pass Gates

- [ ] CI workflow passes on latest `main` commit.
- [ ] Pre-launch QA workflow passes on latest `main` commit.
- [ ] No open P0/P1 bugs in release scope.
- [ ] Rollback owner and rollback command are confirmed.

## 2) Local Verification Commands

Run from repo root:

```bash
npm ci
npm --prefix apps/web ci
npm run qa:build
npm run qa:test
npm run qa:summary
npm run qa:prelaunch
```

Optional but recommended:

```bash
npm --prefix apps/web run lint
```

Production-only Sentry gate:

```bash
SENTRY_DSN=... \
VITE_SENTRY_DSN=... \
SENTRY_ENVIRONMENT=production \
SENTRY_RELEASE=<git-sha> \
VITE_SENTRY_RELEASE=<git-sha> \
SENTRY_CHECK_BASE_URL=https://rankypulse.com \
npm run qa:sentry
```

## 3) Playwright Coverage Gate

- [ ] Critical flows pass:
  - [ ] Home -> start audit -> audit results
  - [ ] Rank check -> queue action
  - [ ] Auth sign-in invalid credentials handling
  - [ ] Shared report route
- [ ] No runtime `pageerror` in critical flows.
- [ ] Playwright artifacts generated and retained for failed runs.

Reference tests:

- `apps/web/tests/e2e/prelaunch-flows.spec.js`
- `apps/web/tests/p0-flows.spec.js`
- `apps/web/tests/rank-route-smoke.spec.js`

## 4) Sentry Readiness Gate

Environment variables:

- [ ] `SENTRY_DSN` configured for backend.
- [ ] `VITE_SENTRY_DSN` configured for frontend.
- [ ] `SENTRY_ENVIRONMENT=production` in production deployment.
- [ ] `SENTRY_RELEASE` and `VITE_SENTRY_RELEASE` set to deploy commit SHA.
- [ ] `SENTRY_TRACES_SAMPLE_RATE` explicitly set for production.

Validation:

- [ ] Trigger frontend test event from `/start` using "Trigger frontend Sentry test error".
- [ ] Trigger backend test event via:

```bash
curl -i http://127.0.0.1:3000/api/test-error
```

- [ ] Confirm both events appear in Sentry under correct environment + release.
- [ ] Alert routing verified (Slack/email/PagerDuty) with at least one test alert.

## 5) CI/CD Protection Gate

- [ ] Branch protection requires successful status checks:
  - [ ] `CI / ci-tests`
  - [ ] `Pre-Launch QA Gate / qa-prelaunch`
- [ ] Direct pushes to protected production branch are disabled.
- [ ] Deploy only from protected branch/tag.

## 6) Launch Decision

Launch only if all required gates are checked.

If any required gate fails:

1. Stop release.
2. Open incident/bug ticket with owner and ETA.
3. Re-run full pre-launch QA gate after fix.
