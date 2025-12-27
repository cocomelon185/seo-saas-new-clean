SEO SaaS - Clean Starter

Overview

This repository contains a lightweight SEO SaaS starter app. The commit adds deployment and security hygiene files and prepares the project for platforms like Vercel.

Local setup

1. Copy .env.example to .env and fill in the real values (do NOT commit .env):

   cp .env.example .env
   # Edit .env and add your keys

2. Install dependencies:

   npm install

3. Run the app locally:

   npm start
   # or
   node server.js

Vercel deployment

1. In the Vercel dashboard, create a new project and connect this repository.
2. In Project Settings -> Environment Variables, add the following variables (do NOT paste them into the repo):
   - OPENAI_API_KEY
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
3. Use the default build & output settings for a Node.js app. The start command is `node server.js`.

Security notes

- Never commit secrets. The repository now contains a .env.example file and a .gitignore that ignores .env and related files.
- Do not store long-lived secrets in client-side code. The frontend includes placeholders for SUPABASE values; treat them as public-only (if you must use them client-side) or proxy calls through a server to keep private keys secret.
- The backend now uses helmet, compression, and rate limiting. Ensure you keep dependencies up to date and review any third-party code before upgrading.

Removing tracked node_modules and database file

This commit adds .gitignore for node_modules/ and database.db, but the Git index may still contain previously tracked copies. To remove those tracked files locally and push the change, run:

  git rm --cached database.db || true
  git rm -r --cached node_modules || true
  git commit -m "Remove tracked database.db and node_modules from repo" || true
  git push

If any of these files were large, you may also need to contact your Git host or use git filter-repo / BFG to remove history (this is a destructive operation — do not perform it without understanding the consequences).

Review after commit

Please review package.json after this change — I merged in common server-hardening dependencies (helmet, compression, express-rate-limit) and ensured the start script is `node server.js`. If your project has additional dependencies or scripts, merge them manually or tell me to re-run the update with a merge strategy.

If you want, I can also open a PR instead of writing directly to main, or attempt to remove tracked files via the GitHub API if you prefer (that may still require local cleanup as noted).
