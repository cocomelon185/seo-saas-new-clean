# /rank Route SEO Audit & Diff Plan

## Current State

### Blockers (prevent indexing)
| Location | Issue |
|----------|-------|
| `apps/web/public/robots.txt` | `Disallow: /rank` blocks crawlers |
| `robots.txt` (root) | Same |
| `server.js` | `/rank` in `noindexPrefixes` → meta robots = noindex,nofollow |
| `postbuild-seo.mjs` | `/rank` in `noindexPrefixes` → pre-rendered HTML gets noindex |
| `RankPage.jsx` | `seoRobots="noindex,nofollow"` in client-side SEO |

### Missing for indexability
| Item | Status |
|------|--------|
| Unique `<title>` | ❌ Falls back to default; server/postbuild use noindex meta |
| Meta description | ❌ Same |
| OpenGraph (og:title, og:description, og:url, og:type, og:image) | ⚠️ Partial – server injects og:title/description but not og:image; og:url uses request host |
| Twitter cards (twitter:card, twitter:title, twitter:description) | ⚠️ twitter:card in app.html; server doesn’t inject twitter:title/description |
| Canonical URL | ⚠️ `absoluteUrlFor(req)` uses request host → canonical can be www or non-canonical host |

### Sitemap & Routing
| Item | Status |
|------|--------|
| `/rank` in sitemap.xml | ❌ Absent in `apps/web/public/sitemap.xml` and root `sitemap.xml` |
| Canonical host redirects | ❌ No redirect from www or other hosts to rankypulse.com |

### Bot content
| Item | Status |
|------|--------|
| Server/pre-rendered body | ⚠️ app.html has only `<div id="root"></div>` – no semantic content for non-JS crawlers |

---

## Minimal Diff Plan

### 1. `server.js`
- **Add** `/rank` to `publicMeta` with:
  - `title`: "Keyword Rank Checker | RankyPulse"
  - `description`: "Check where your domain ranks for keywords. Track position over time and get actionable SEO recommendations."
- **Remove** `/rank` from `noindexPrefixes`.
- **Use canonical base URL** for indexable routes: for paths in sitemap (or a new "canonicalPaths" set), use `https://rankypulse.com` instead of request host in `absoluteUrlFor` when injecting canonical/og:url. Add helper `canonicalBaseUrl(req)` that returns `https://rankypulse.com` for canonical routes.
- **Add** og:image and twitter:image injection in `injectMeta` (or extend `getMetaForPath` with optional `ogImage`) for /rank. Use `https://rankypulse.com/rankypulse-logo.svg` or similar if no dedicated og-image exists.
- **Add** middleware **before** static/HTML handlers: if `req.get('host') !== 'rankypulse.com'` (and not localhost), redirect 301 to `https://rankypulse.com${req.path}`.

### 2. `apps/web/scripts/postbuild-seo.mjs`
- **Add** `/rank` entry to `publicMeta` (same title/description as server).
- **Remove** `/rank` from `noindexPrefixes`.
- Ensure `getMetaForPath("/rank")` returns `index, follow` for robots.

### 3. `apps/web/public/sitemap.xml` and root `sitemap.xml`
- **Add**:
  ```xml
  <url>
      <loc>https://rankypulse.com/rank</loc>
      <lastmod>2026-02-14</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.9</priority>
  </url>
  ```
  After `/audit` entry (or in same logical grouping).

### 4. `apps/web/public/robots.txt` and root `robots.txt`
- **Remove** line: `Disallow: /rank`

### 5. `apps/web/src/pages/RankPage.jsx`
- **Change** `seoRobots="noindex,nofollow"` → `seoRobots="index, follow"` (or remove to inherit from document).
- **Update** `seoDescription` to match server meta (richer description).
- Keep `seoTitle`, `seoCanonical` as-is for client-side consistency.

### 6. Canonical host redirects

**Vercel** (`vercel.json` / `apps/web/vercel.json`):
- **Add** `redirects` (before `rewrites` if both exist) with host-based rules:
  ```json
  "redirects": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "www.rankypulse.com" }],
      "destination": "https://rankypulse.com/:path*",
      "permanent": true
    }
  ]
  ```
  Add similar entries for `rank.rankypulse.com` → `https://rankypulse.com` if that subdomain ever serves pages.

**Netlify** (`_redirects`):
- Add:
  ```
  https://www.rankypulse.com/* https://rankypulse.com/:splat 301
  ```

### 7. Bot-visible content (minimal)
- **Option A**: In `postbuild-seo.mjs`, for `/rank` (and other indexable app routes), inject a `<noscript>` block inside `<body>` before `<div id="root">`:
  ```html
  <noscript><h1>Keyword Rank Checker</h1><p>Check where your domain ranks for keywords. Track position over time and get actionable SEO recommendations from RankyPulse.</p></noscript>
  ```
- **Option B**: Add the same via server.js when serving `/rank` HTML (inject before `</body>` or after `<body>`).

### 8. OpenGraph / Twitter image
- Ensure `injectMeta` (server) and `postbuild-seo` add `og:image` and `twitter:image` for /rank. Use existing asset: `https://rankypulse.com/rankypulse-logo.svg` or a dedicated og-image if available. Extend `publicMeta` entry with `ogImage` and wire into inject logic.

---

## Files to Modify (Summary)

| File | Changes |
|------|---------|
| `server.js` | publicMeta +rank, remove from noindexPrefixes, canonicalBaseUrl, host redirect middleware, og:image injection |
| `apps/web/scripts/postbuild-seo.mjs` | publicMeta +rank, remove from noindexPrefixes |
| `apps/web/public/sitemap.xml` | +rank URL |
| `sitemap.xml` (root) | +rank URL |
| `apps/web/public/robots.txt` | remove Disallow: /rank |
| `robots.txt` (root) | remove Disallow: /rank |
| `apps/web/src/pages/RankPage.jsx` | seoRobots → index,follow; improve seoDescription |
| `vercel.json` | add redirects for www → apex |
| `apps/web/public/_redirects` | add www → apex (for Netlify) |
| `postbuild-seo.mjs` / `server.js` | noscript fallback + og:image for /rank |

---

## Product behavior

- No change to `/rank` functionality, auth, or UX.
- Only SEO meta, sitemap, robots, canonical, and redirects are updated.
