
import { URL } from "node:url";


function __rpFixtureEnabled() {
  const v = process.env.__RP_HTTP_HYGIENE_FIXTURE__;
  return v === "1" || v === "true" || v === "yes";
}

function __rpHeadersGet(headersObj, key) {
  if (!headersObj) return null;
  const k = String(key || "");
  const lk = k.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(headersObj, lk)) return headersObj[lk];
  if (Object.prototype.hasOwnProperty.call(headersObj, k)) return headersObj[k];
  for (const kk of Object.keys(headersObj)) {
    if (String(kk).toLowerCase() === lk) return headersObj[kk];
  }
  return null;
}

function __rpMakeResponse(hit, fallbackUrl) {
  const status = Number((hit && hit.status) ?? 200);
  const headersObj = (hit && hit.headers) ? hit.headers : {};
  const body = (hit && hit.body) ?? "";
  const finalUrl = (hit && (hit.final_url || hit.url)) || fallbackUrl;

  return {
    ok: status >= 200 && status < 300,
    status,
    url: finalUrl,
    headers: { get: (k) => __rpHeadersGet(headersObj, k) },
    text: async () => String(body),
  };
}

async function __rpFetch(url, opts = {}) {
  if (__rpFixtureEnabled()) {
    try {
      const fx = globalThis.__RP_HTTP_HYGIENE_FIXTURE__;

      // If mock is a function: (url, opts) => hit|null
      if (typeof fx === "function") {
        const hit = await fx(url, opts);
        if (hit) return __rpMakeResponse(hit, String(url));
      }

      // If mock is an object or array:
      if (fx && (typeof fx === "object")) {
        const u = String(url);

        // Shape A: map keyed by URL
        if (!Array.isArray(fx) && fx[u]) {
          return __rpMakeResponse(fx[u], u);
        }

        // Shape B: { responses: [...] }
        const arr = Array.isArray(fx) ? fx : (Array.isArray(fx.responses) ? fx.responses : null);
        if (arr) {
          const hit = arr.find(r => String(r.url) === u);
          if (hit) return __rpMakeResponse(hit, u);
        }
      }
    } catch (e) {
      // fall through to real fetch
    }
  }

  return fetch(url, opts);
}


function normUrl(u) {
  try {
    const x = new URL(u);
    x.hash = "";
    const host = normHost(x.hostname);
    const port = x.port ? `:${x.port}` : "";
    const path = x.pathname || "/";
    const search = x.search || "";
    return `${x.protocol}//${host}${port}${path}${search}`;
  } catch {
    return String(u || "");
  }
}

function normHost(h) {
  if (!h) return "";
  return String(h).toLowerCase().replace(/^\s+|\s+$/g, "").replace(/^www\./, "");
}

function toHttps(url) {
  try {
    const u = new URL(url);
    u.protocol = "https:";
    return u.toString();
  } catch {
    return null;
  }
}

async function fetchOnce(url, method, timeoutMs, userAgent) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await __rpFetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": userAgent,
        "accept": "*/*",
      },
    });
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    const err = new Error(String(e && e.name ? e.name : e));
    err.name = e && e.name ? e.name : "FetchError";
    throw err;
  }
}

async function fetchChain(startUrl, { maxHops = 5, method = "HEAD", timeoutMs = 15000, userAgent = "RankyPulseBot/1.0" } = {}) {
  const chain = [];
  const seen = new Map();
  const repeats = [];

  let current = startUrl;

  for (let hop = 0; hop <= maxHops; hop++) {
    const key = normUrl(current);
    if (seen.has(key)) repeats.push({ url: current, norm: key, first_hop: seen.get(key), repeat_hop: hop });
    else seen.set(key, hop);

    let res;
    try {
      res = await fetchOnce(current, method, timeoutMs, userAgent);
    } catch (e) {
      if (method === "HEAD") {
        try {
          res = await fetchOnce(current, "GET", timeoutMs, userAgent);
        } catch (e2) {
          chain.push({ url: current, status: 0, location: null, error: String(e2 && e2.name ? e2.name : e2) });
          return { chain, finalUrl: current, finalStatus: 0, repeats, maxHops };
        }
      } else {
        chain.push({ url: current, status: 0, location: null, error: String(e && e.name ? e.name : e) });
        return { chain, finalUrl: current, finalStatus: 0, repeats, maxHops };
      }
    }

    const status = res.status || 0;
    const location = res.headers ? res.headers.get("location") : null;
    const xRobotsTag = res.headers ? (res.headers.get("x-robots-tag") || res.headers.get("X-Robots-Tag")) : null;

    chain.push({ url: current, status, location: location || null, x_robots_tag: xRobotsTag || null });

    const isRedirect = status >= 300 && status <= 399 && location;
    if (!isRedirect) return { chain, finalUrl: current, finalStatus: status, repeats, maxHops };

    let next;
    try { next = new URL(location, current).toString(); }
    catch { return { chain, finalUrl: current, finalStatus: status, repeats, maxHops }; }
    current = next;
  }

  return {
    chain,
    finalUrl: chain[chain.length - 1]?.url || startUrl,
    finalStatus: chain[chain.length - 1]?.status || 0,
    repeats,
    maxHops
  };
}

function extractCanonicalHref(html) {
  const m = /<link[^>]+rel=["']?canonical["']?[^>]*>/i.exec(html || "");
  if (!m) return "";
  const tag = m[0];
  const m2 = /href=["']([^"']+)["']/i.exec(tag);
  return m2 ? String(m2[1]).trim() : "";
}

function resolveUrlMaybe(href, base) {
  try {
    return new URL(href, base).toString();
  } catch {
    return "";
  }
}

function extractTitle(html) {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html || "");
  if (!m) return "";
  return String(m[1]).replace(/\s+/g, " ").trim().slice(0, 200);
}

function parseRobotsDirectives(v) {
  const raw = String(v || "");
  const t = raw.toLowerCase();
  const has = (k) => t.includes(k);
  return {
    raw,
    noindex: has("noindex"),
    index: has("index"),
    nofollow: has("nofollow"),
    follow: has("follow"),
    nosnippet: has("nosnippet"),
    noarchive: has("noarchive"),
  };
}

function extractMetaRobots(html) {
  const m = /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html || "");
  return m ? String(m[1]).trim() : "";
}

function isPaginatedUrl(u) {
  try {
    const x = new URL(u);
    const page = x.searchParams.get("page") || x.searchParams.get("p") || x.searchParams.get("paged");
    if (page && /^\d+$/.test(page) && Number(page) > 1) return true;
    if (/\/page\/(\d+)\/?$/i.test(x.pathname)) {
      const m = /\/page\/(\d+)\/?$/i.exec(x.pathname);
      if (m && Number(m[1]) > 1) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function urlVariantTrailingSlash(u) {
  try {
    const x = new URL(u);
    if (x.pathname === "/") return u;
    if (x.pathname.endsWith("/")) x.pathname = x.pathname.slice(0, -1);
    else x.pathname = x.pathname + "/";
    return x.toString();
  } catch {
    return "";
  }
}

function urlVariantIndexHtml(u) {
  try {
    const x = new URL(u);
    if (x.pathname.endsWith("/")) {
      x.pathname = x.pathname + "index.html";
    } else if (/index\.html$/i.test(x.pathname)) {
      x.pathname = x.pathname.replace(/index\.html$/i, "");
    } else {
      x.pathname = x.pathname + "/index.html";
    }
    return x.toString();
  } catch {
    return "";
  }
}

function findPhrases(text, phrases) {
  const t = String(text || "").toLowerCase();
  const hits = [];
  for (const ph of phrases) {
    if (t.includes(ph)) hits.push(ph);
  }
  return hits;
}

async function fetchHtml(url, timeoutMs, userAgent) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await __rpFetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": userAgent,
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const txt = await res.text();
    clearTimeout(t);
    const clip = txt.length > 300000 ? txt.slice(0, 300000) : txt;
    const xRobotsTag = res.headers ? (res.headers.get("x-robots-tag") || res.headers.get("X-Robots-Tag")) : null;
    return { ok: true, status: res.status || 0, finalUrl: res.url || url, html: clip, bytes: txt.length, x_robots_tag: xRobotsTag || null };
  } catch (e) {
    clearTimeout(t);
    return { ok: false, status: 0, finalUrl: url, html: "", bytes: 0, error: String(e && e.name ? e.name : e) };
  }
}

function mkIssue(issue_id, title, why, evidence, priority = "fix_now") {
  return {
    issue_id,
    title,
    priority,
    why,
    evidence,
  };
}

async function detectHttpStatusRedirectHygiene(ctx) {
  const targetUrl = ctx?.url || ctx?.input?.url || ctx?.targetUrl;
  if (!targetUrl) return [];

  const issues = [];
  let html = "";
  let finalNorm = "";
  let canonNorm = "";
  let canonicalUrl = "";

  const start = String(targetUrl);
  const startUrlObj = (() => { try { return new URL(start); } catch { return null; } })();
  if (!startUrlObj) return issues;

  const startHost = normHost(startUrlObj.hostname);

  const primary = await fetchChain(start, {
    maxHops: 5,
    method: "HEAD",
    timeoutMs: ctx?.timeouts?.httpMs || 15000,
    userAgent: ctx?.userAgent || "RankyPulseBot/1.0",
  });

  const chain = primary.chain || [];
  const repeats = primary.repeats || [];
  const maxHops = primary.maxHops || 5;
  const likelyTooManyRedirects = chain.length >= (maxHops + 1) && chain[chain.length - 1]?.status >= 300 && chain[chain.length - 1]?.status <= 399;

  if ((Array.isArray(repeats) && repeats.length) || likelyTooManyRedirects) {
    issues.push(
      mkIssue(
        "http_redirect_loop",
        "Redirect loop detected",
        "The URL appears to redirect in a loop or exceeds the redirect limit. This can block crawlers and break user navigation.",
        {
          start_url: start,
          final_url: finalUrl,
          final_status: finalStatus,
          max_hops: maxHops,
          repeats,
          chain,
        },
        "fix_now"
      )
    );
  }

  const hops = Math.max(0, chain.length - 1);
  const finalUrl = primary.finalUrl || start;
  finalNorm = normUrl(finalUrl);
  const finalStatus = primary.finalStatus || 0;

  if (finalStatus !== 200) {
    const statusBucket = finalStatus === 0 ? "Fetch failed" : `HTTP ${finalStatus}`;
    issues.push(
      mkIssue(
        "http_non_200",
        "Non-200 response",
        `The final response is not 200 OK (${statusBucket}).`,
        {
          start_url: start,
          final_url: finalUrl,
          final_status: finalStatus,
          chain,
        },
        finalStatus >= 500 || finalStatus === 0 ? "fix_now" : "fix_next"
      )
    );
  }

  if (hops > 1) {
    issues.push(
      mkIssue(
        "http_redirect_chain_too_long",
        "Redirect chain too long",
        "The URL redirects more than 1 hop. Longer chains waste crawl budget and slow down users.",
        {
          start_url: start,
          final_url: finalUrl,
          hops,
          chain,
        },
        "fix_next"
      )
    );
  }

  const finalUrlObj = (() => { try { return new URL(finalUrl); } catch { return null; } })();
  if (finalUrlObj) {
    const finalHost = normHost(finalUrlObj.hostname);
    if (finalHost && startHost && finalHost !== startHost) {
      issues.push(
        mkIssue(
          "http_redirect_different_host",
          "Redirect to different host",
          "The final URL resolves to a different hostname. This is often a misconfiguration, tracking hop, or wrong canonical domain.",
          {
            start_url: start,
            start_host: startHost,
            final_url: finalUrl,
            final_host: finalHost,
            chain,
          },
          "fix_next"
        )
      );
    }
  }

  const httpsVersion = toHttps(start);
  if (httpsVersion) {
    const httpIsHttp = startUrlObj.protocol === "http:";
    const httpsProbe = await fetchChain(httpsVersion, {
      maxHops: 5,
      method: "HEAD",
      timeoutMs: ctx?.timeouts?.httpMs || 15000,
      userAgent: ctx?.userAgent || "RankyPulseBot/1.0",
    });

    const httpsFinalUrl = httpsProbe.finalUrl || httpsVersion;
    const httpsFinalStatus = httpsProbe.finalStatus || 0;
    const httpsFinalObj = (() => { try { return new URL(httpsFinalUrl); } catch { return null; } })();

    const httpsAvailable = httpsFinalStatus >= 200 && httpsFinalStatus < 400 && httpsFinalObj && httpsFinalObj.protocol === "https:";
    const httpFinalObj = (() => { try { return new URL(finalUrl); } catch { return null; } })();
    const httpStillHttp = httpFinalObj && httpFinalObj.protocol === "http:";

    if (httpIsHttp && httpsAvailable && httpStillHttp) {
      issues.push(
        mkIssue(
          "http_https_not_enforced",
          "HTTP → HTTPS not enforced",
          "The page is served over HTTP even though HTTPS is available. Redirect HTTP to HTTPS to avoid duplicate URLs and security warnings.",
          {
            start_url: start,
            http_final_url: finalUrl,
            http_final_status: finalStatus,
            https_probe_url: httpsVersion,
            https_final_url: httpsFinalUrl,
            https_final_status: httpsFinalStatus,
            http_chain: chain,
            https_chain: httpsProbe.chain || [],
          },
          "fix_now"
        )
      );
    }
  }


  if (finalStatus === 200) {
    const htmlRes = await fetchHtml(finalUrl, ctx?.timeouts?.httpMs || 15000, ctx?.userAgent || "RankyPulseBot/1.0");
    if (htmlRes && htmlRes.ok && typeof htmlRes.html === "string") html = htmlRes.html;
    const xrtRaw = (htmlRes && htmlRes.x_robots_tag) ? htmlRes.x_robots_tag : ((chain && chain.length) ? (chain[chain.length - 1]?.x_robots_tag || "") : "");
    if (htmlRes && htmlRes.ok && htmlRes.status === 200) {
      const html = htmlRes.html || "";
      const title = extractTitle(html);
      const phrases = [
        "page not found",
        "not found",
        "does not exist",
        "doesn't exist",
        "error 404",
        "404 error",
        "the page you requested",
        "cannot be found",
        "we can't find",
        "we cannot find",
      ];
      const titleHits = findPhrases(title, ["404", "not found", "page not found"]);
      const bodyHits = findPhrases(html, phrases);
      const canonicalHref = extractCanonicalHref(html);
      canonicalUrl = canonicalHref ? resolveUrlMaybe(canonicalHref, htmlRes.finalUrl || finalUrl) : "";
  canonNorm = canonicalUrl ? normUrl(canonicalUrl) : "";
      const finalObj = (() => { try { return new URL(finalUrl); } catch { return null; } })();
      const canonObj = (() => { try { return new URL(canonicalUrl); } catch { return null; } })();
      const finalHost2 = finalObj ? normHost(finalObj.hostname) : "";
      const canonHost2 = canonObj ? normHost(canonObj.hostname) : "";
      const canonHostMismatch = !!(canonHost2 && finalHost2 && canonHost2 !== finalHost2);
      const canonUrlMismatch = !!(canonNorm && finalNorm && canonNorm !== finalNorm);

      // X-ROBOTS-TAG + META ROBOTS (indexability) cross-check
      const metaRobots = extractMetaRobots(html);
      const xrt = parseRobotsDirectives(xrtRaw);
      const mrd = parseRobotsDirectives(metaRobots);
      const noindex = !!(xrt.noindex || mrd.noindex);
      const xRobotsHeaderPresent = !!(xrt.raw && xrt.raw.trim());
      if (xRobotsHeaderPresent && mrd.raw && ((xrt.noindex && mrd.index) || (xrt.index && mrd.noindex))) {
        issues.push(mkIssue(
          "x_robots_tag_contradiction",
          "Robots directives conflict (header vs meta)",
          "X-Robots-Tag header and meta robots provide conflicting directives. Crawlers may follow the stricter directive, causing unexpected indexing behavior.",
          {
            start_url: start,
            final_url: finalUrl,
            x_robots_tag: xrt.raw,
            meta_robots: mrd.raw,
          },
          "fix_now"
        ));
      }

      // PAGINATION canonical misuse (conservative)
      const paginated = isPaginatedUrl(finalUrl);
      if (paginated && canonicalUrl && canonNorm && finalNorm && canonNorm !== finalNorm) {
        issues.push(mkIssue(
          "canonical_pagination_misuse",
          "Paginated page canonicals to a different page",
          "Paginated pages usually should self-canonical unless a true view-all page exists. Canonicalizing page 2+ to another URL can cause pagination to drop from the index.",
          {
            start_url: start,
            final_url: finalUrl,
            canonical_url: canonicalUrl,
            chain,
          },
          "fix_next"
        ));
      }

      // TRAILING SLASH / index.html duplication probes (only when indexable)
      if (!noindex) {
        const slashVar = urlVariantTrailingSlash(finalUrl);
        const indexVar = urlVariantIndexHtml(finalUrl);
        const variants = [slashVar, indexVar].filter(v => v && v !== finalUrl);
        for (const v of variants) {
          const probe = await fetchChain(v, { maxHops: 5, method: "HEAD", timeoutMs: ctx?.timeouts?.httpMs || 15000, userAgent: ctx?.userAgent || "RankyPulseBot/1.0" });
          const vFinalUrl = probe.finalUrl || v;
          const vFinalStatus = probe.finalStatus || 0;
          const vNorm = normUrl(vFinalUrl);
          if (vFinalStatus === 200 && vNorm && finalNorm && vNorm !== finalNorm) {
            issues.push(mkIssue(
              "duplicate_url_variant",
              "Duplicate URL variants detected",
              "Multiple URL variants return 200 without consolidating via redirects. This can split signals (trailing slash / index.html duplication).",
              {
                start_url: start,
                final_url: finalUrl,
                variant_tested: v,
                variant_final_url: vFinalUrl,
                variant_status: vFinalStatus,
                variant_chain: probe.chain || [],
              },
              "fix_next"
            ));
            break;
          }
        }
      }
      if (canonHostMismatch || canonUrlMismatch) {
        issues.push(
          mkIssue(
            "canonical_redirect_mismatch",
            "Canonical URL does not match resolved URL",
            "The page resolves to one URL but declares a different canonical. This can split ranking signals and cause indexing/canonicalization confusion.",
            {
              start_url: start,
              final_url: finalUrl,
              final_host: finalHost2,
              canonical_href: canonicalHref,
              canonical_url: canonicalUrl,
              canonical_host: canonHost2,
              canonical_host_mismatch: canonHostMismatch,
              canonical_url_mismatch: canonUrlMismatch,
              chain,
            },
            "fix_next"
          )
        );
      }
      const likelySoft404 = (titleHits.length && bodyHits.length) || (titleHits.length && htmlRes.bytes < 8000) || (bodyHits.length >= 2 && htmlRes.bytes < 12000);
      if (likelySoft404) {
        issues.push(
          mkIssue(
            "http_soft_404",
            "Soft 404 detected",
            "The page returns 200 OK but appears to be a 'not found' error page. This can waste crawl budget and mislead search engines.",
            {
              start_url: start,
              final_url: finalUrl,
              final_status: finalStatus,
              fetched_url: htmlRes.finalUrl,
              title,
              title_hits: titleHits,
              body_hits: bodyHits,
              html_bytes: htmlRes.bytes,
            },
            "fix_next"
          )
        );
      }
    }
  }


  // INDEXABILITY CONTRADICTIONS
  const hasNoindex = /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html || "");
  const isSoft404 = issues.some(i => i.issue_id === "http_soft_404");

  if (hasNoindex && canonNorm && canonNorm === finalNorm) {
    issues.push(mkIssue(
      "indexability_contradiction",
      "Noindex page declares itself as canonical",
      "The page is marked noindex but also declares itself as canonical, sending conflicting signals to search engines.",
      {
        final_url: finalUrl,
        canonical_url: canonicalUrl,
        noindex: true
      },
      "fix_now"
    ));
  }

  if (!hasNoindex && canonNorm && canonNorm !== finalNorm) {
    const canonIsNoindex = issues.some(i => i.issue_id === "canonical_redirect_mismatch");
    if (canonIsNoindex) {
      issues.push(mkIssue(
        "indexability_contradiction",
        "Indexable page canonicals to non-indexable URL",
        "The page is indexable but its canonical target appears to be non-indexable.",
        {
          final_url: finalUrl,
          canonical_url: canonicalUrl
        },
        "fix_now"
      ));
    }
  }

  if (isSoft404 && !hasNoindex) {
    issues.push(mkIssue(
      "indexability_contradiction",
      "Soft 404 page is indexable",
      "The page appears to be a soft 404 but is still indexable, which can waste crawl budget and harm quality signals.",
      {
        final_url: finalUrl
      },
      "fix_now"
    ));
  }

  return issues;
}

export default {
  id: "http_status_redirect_hygiene",
  title: "HTTP status + redirect hygiene",
  run: detectHttpStatusRedirectHygiene,
};
