# RankyPulse Live Test Plan

## Goal
Validate the end‑to‑end customer journey (discover → signup → verify → audit → upgrade → billing → reports) before real users and paid traffic.

## Test Accounts
Use plus‑addressing so we can track each tester:
- Example: `you+tester1@gmail.com`, `you+tester2@gmail.com`
- Create 1–2 accounts per tester (email + Google if available).

## Preflight (Owner)
1. Confirm test Razorpay plan IDs are in Railway shared variables.
2. Confirm backend status:
   - `https://api.rankypulse.com/api/billing/config`
   - Expect: `razorpay_configured: true`
3. Verify email sending works (Resend + normal signup).
4. Share this test plan + checklist with testers.
5. If running the automated H1 scan, exclude `app.html` (build shell, not a route).
6. Lighthouse render-blocking: we inline critical CSS for fast, stable first paint, and async-load the rest. Lighthouse may still flag render-blocking because any CSS in `<head>` counts, but we accept that to avoid flashes of unstyled content and protect user experience.

## Core Flow (All Testers)
1. Home → Pricing → CTA routes
2. Sign up → Verify email → Access audit
3. Run audit → view results → share/export
4. Pricing → select plan → checkout (₹1 test)
5. Upgrade success → next steps clear
6. Account settings → verify status + billing details

## Scenarios (Checklist)
### 1) Signup + Verification
- Create account with email and password
- Verify email from inbox (check spam/promotions)
- Confirm audit access unlocks
- Try **resend verification**

### 2) Audit Flow
- Run audit with a valid URL
- Try invalid URL → confirm helpful error
- Results page loads without crashes

### 3) Pricing + Upgrade
- Toggle Monthly/Annual
- CTA routes to signup/checkout
- Payment flow opens and completes (₹1 test)
- Upgrade success page explains next steps

### 4) Report + Export
- Open shared report page
- Export PDF
- Upgrade CTA explains value

### 5) Login/Logout
- Login with password
- Logout and login again
- Login with Google (if enabled)

## Pass/Fail Criteria
- No crashes / broken CTAs
- Verification always works
- Payment success leads to upgrade success page
- Pages load quickly and cleanly
- No console errors visible to users

## Bug Report Template
- **Title:**
- **Steps to reproduce:**
- **Expected vs Actual:**
- **Device/Browser:**
- **Screenshot/Video:**

## Post‑Test Cleanup (Owner)
1. Revert Razorpay plan IDs back to real plans in Railway.
2. Redeploy backend.
3. Refund ₹1 payments (optional).
4. Fix P0/P1 issues before launch.

---

# Tester Quick Checklist (Send This)
**RankyPulse Live Test**

1. Home → Pricing → CTA routes
2. Sign up → verify email → audit unlocks
3. Run audit (valid + invalid URL)
4. Pricing → checkout ₹1 → upgrade success
5. Export PDF + check upgrade CTA
6. Logout/login again

**Report bugs with:** title + steps + expected/actual + screenshot.
