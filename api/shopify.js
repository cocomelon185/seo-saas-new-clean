import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

let _db = null;
function getDb() {
  if (_db) return _db;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbPath = path.join(__dirname, "..", "database.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.prepare(`
    CREATE TABLE IF NOT EXISTS oauth_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT,
      owner_id TEXT,
      site TEXT,
      shop TEXT,
      state TEXT,
      created_at TEXT
    )
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS shopify_connections (
      owner_id TEXT PRIMARY KEY,
      shop TEXT,
      access_token TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();
  _db = db;
  return db;
}

function normalizeShop(shop) {
  const s = String(shop || "").trim();
  if (!s) return "";
  if (s.includes("://")) {
    try {
      const u = new URL(s);
      return u.host;
    } catch {
      return "";
    }
  }
  return s;
}

function verifyHmac(query) {
  const { hmac, ...rest } = query;
  const msg = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${Array.isArray(rest[k]) ? rest[k].join(",") : rest[k]}`)
    .join("&");
  const digest = crypto
    .createHmac("sha256", process.env.SHOPIFY_CLIENT_SECRET)
    .update(msg)
    .digest("hex");
  return digest === hmac;
}

export async function shopifyAuthStart(req, res) {
  const owner = String(req.query?.owner || "").trim();
  const shop = normalizeShop(req.query?.shop);
  if (!owner || !shop) return res.status(400).send("Missing owner or shop");
  const state = Math.random().toString(36).slice(2);
  const db = getDb();
  db.prepare("INSERT INTO oauth_states (provider, owner_id, shop, state, created_at) VALUES (?, ?, ?, ?, ?)")
    .run("shopify", owner, shop, state, new Date().toISOString());
  const redirectUri = `${req.protocol}://${req.get("host")}/api/shopify/auth/callback`;
  const scopes = "read_content,write_content,read_products,write_products,read_online_store_pages,write_online_store_pages,read_blog,write_blog,read_collections,write_collections";
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${encodeURIComponent(process.env.SHOPIFY_CLIENT_ID)}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
  return res.redirect(authUrl);
}

export async function shopifyAuthCallback(req, res) {
  const { code, state, shop } = req.query || {};
  if (!code || !state || !shop) return res.status(400).send("Missing params");
  if (!verifyHmac(req.query)) return res.status(400).send("Invalid hmac");
  const db = getDb();
  const row = db.prepare("SELECT owner_id FROM oauth_states WHERE provider = ? AND state = ? ORDER BY id DESC LIMIT 1")
    .get("shopify", state);
  if (!row) return res.status(400).send("Invalid OAuth state");

  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code
    })
  });
  const token = await tokenRes.json().catch(() => null);
  if (!tokenRes.ok) return res.status(500).send("Token exchange failed");
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO shopify_connections (owner_id, shop, access_token, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(owner_id) DO UPDATE SET
      shop=excluded.shop,
      access_token=excluded.access_token,
      updated_at=excluded.updated_at
  `).run(row.owner_id, String(shop), token.access_token, now, now);
  return res.redirect("/audit?shopify=connected");
}

export async function shopifyStatus(req, res) {
  const owner = String(req.headers["x-rp-anon-id"] || "").trim();
  if (!owner) return res.json({ connected: false });
  const db = getDb();
  const row = db.prepare("SELECT shop FROM shopify_connections WHERE owner_id = ?").get(owner);
  return res.json({ connected: Boolean(row), shop: row?.shop || null });
}

export async function shopifyDisconnect(req, res) {
  const owner = String(req.headers["x-rp-anon-id"] || "").trim();
  if (!owner) return res.status(400).json({ ok: false });
  const db = getDb();
  db.prepare("DELETE FROM shopify_connections WHERE owner_id = ?").run(owner);
  return res.json({ ok: true });
}

async function shopifyFetch(owner) {
  const db = getDb();
  return db.prepare("SELECT * FROM shopify_connections WHERE owner_id = ?").get(owner);
}

export async function shopifyPushFix(req, res) {
  const owner = String(req.headers["x-rp-anon-id"] || "").trim();
  const url = String(req.body?.url || "").trim();
  const issue = String(req.body?.issue_id || "").trim();
  const fix = String(req.body?.fix || "").trim();
  if (!owner || !url || !fix) return res.status(400).json({ ok: false, error: "Missing owner, url, or fix" });
  const conn = await shopifyFetch(owner);
  if (!conn) return res.status(404).json({ ok: false, error: "Not connected" });

  const shop = conn.shop;
  const token = conn.access_token;
  const pathName = new URL(url).pathname;
  const isProduct = pathName.includes("/products/");
  const isPage = pathName.includes("/pages/");
  const isBlog = pathName.includes("/blogs/");
  const isArticle = pathName.includes("/articles/");
  const isCollection = pathName.includes("/collections/");
  const handle = pathName.split("/").filter(Boolean).pop();
  const apiBase = `https://${shop}/admin/api/2023-10`;

  if (isProduct) {
    const productsRes = await fetch(`${apiBase}/products.json?handle=${encodeURIComponent(handle)}`, {
      headers: { "X-Shopify-Access-Token": token }
    });
    const data = await productsRes.json().catch(() => null);
    const product = data?.products?.[0];
    if (!product) return res.status(404).json({ ok: false, error: "Product not found" });
    const update = {};
    if (issue === "missing_title" || issue === "title_too_long") update.title = fix;
    if (issue === "missing_h1") update.body_html = `<h1>${fix}</h1>\n${product.body_html || ""}`;
    if (Object.keys(update).length) {
      await fetch(`${apiBase}/products/${product.id}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({ product: { id: product.id, ...update } })
      });
    }
    if (issue === "missing_meta_description") {
      await fetch(`${apiBase}/products/${product.id}/metafields.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({
          metafield: {
            namespace: "global",
            key: "description_tag",
            type: "single_line_text_field",
            value: fix
          }
        })
      });
    }
    return res.json({ ok: true });
  }

  if (isPage) {
    const pagesRes = await fetch(`${apiBase}/pages.json?handle=${encodeURIComponent(handle)}`, {
      headers: { "X-Shopify-Access-Token": token }
    });
    const data = await pagesRes.json().catch(() => null);
    const page = data?.pages?.[0];
    if (!page) return res.status(404).json({ ok: false, error: "Page not found" });
    const update = {};
    if (issue === "missing_title" || issue === "title_too_long") update.title = fix;
    if (issue === "missing_h1") update.body_html = `<h1>${fix}</h1>\n${page.body_html || ""}`;
    if (Object.keys(update).length) {
      await fetch(`${apiBase}/pages/${page.id}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({ page: { id: page.id, ...update } })
      });
    }
    if (issue === "missing_meta_description") {
      await fetch(`${apiBase}/pages/${page.id}/metafields.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({
          metafield: {
            namespace: "global",
            key: "description_tag",
            type: "single_line_text_field",
            value: fix
          }
        })
      });
    }
    return res.json({ ok: true });
  }

  if (isBlog || isArticle) {
    const parts = pathName.split("/").filter(Boolean);
    const blogHandle = isArticle ? parts[parts.indexOf("blogs") + 1] : parts[parts.indexOf("blogs") + 1];
    const articleHandle = isArticle ? parts[parts.indexOf("articles") + 1] : null;
    const blogsRes = await fetch(`${apiBase}/blogs.json`, {
      headers: { "X-Shopify-Access-Token": token }
    });
    const blogsData = await blogsRes.json().catch(() => null);
    const blog = blogsData?.blogs?.find((b) => b.handle === blogHandle) || null;
    if (!blog) return res.status(404).json({ ok: false, error: "Blog not found" });

    if (articleHandle) {
      const articlesRes = await fetch(`${apiBase}/blogs/${blog.id}/articles.json?handle=${encodeURIComponent(articleHandle)}`, {
        headers: { "X-Shopify-Access-Token": token }
      });
      const articlesData = await articlesRes.json().catch(() => null);
      const article = articlesData?.articles?.[0];
      if (!article) return res.status(404).json({ ok: false, error: "Article not found" });
      const update = {};
      if (issue === "missing_title" || issue === "title_too_long") update.title = fix;
      if (issue === "missing_h1") update.body_html = `<h1>${fix}</h1>\n${article.body_html || ""}`;
      if (Object.keys(update).length) {
        await fetch(`${apiBase}/blogs/${blog.id}/articles/${article.id}.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
          body: JSON.stringify({ article: { id: article.id, ...update } })
        });
      }
      if (issue === "missing_meta_description") {
        await fetch(`${apiBase}/articles/${article.id}/metafields.json`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
          body: JSON.stringify({
            metafield: {
              namespace: "global",
              key: "description_tag",
              type: "single_line_text_field",
              value: fix
            }
          })
        });
      }
      return res.json({ ok: true });
    }
  }

  if (isCollection) {
    const collectionsRes = await fetch(`${apiBase}/custom_collections.json?handle=${encodeURIComponent(handle)}`, {
      headers: { "X-Shopify-Access-Token": token }
    });
    const collectionsData = await collectionsRes.json().catch(() => null);
    const collection = collectionsData?.custom_collections?.[0];
    if (!collection) return res.status(404).json({ ok: false, error: "Collection not found" });
    const update = {};
    if (issue === "missing_title" || issue === "title_too_long") update.title = fix;
    if (issue === "missing_h1") update.body_html = `<h1>${fix}</h1>\n${collection.body_html || ""}`;
    if (Object.keys(update).length) {
      await fetch(`${apiBase}/custom_collections/${collection.id}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({ custom_collection: { id: collection.id, ...update } })
      });
    }
    if (issue === "missing_meta_description") {
      await fetch(`${apiBase}/custom_collections/${collection.id}/metafields.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({
          metafield: {
            namespace: "global",
            key: "description_tag",
            type: "single_line_text_field",
            value: fix
          }
        })
      });
    }
    return res.json({ ok: true });
  }

  return res.status(400).json({ ok: false, error: "Unsupported URL type" });
}
