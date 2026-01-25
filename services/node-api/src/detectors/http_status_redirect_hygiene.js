import { URL } from "node:url";

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
    const res = await fetch(url, {
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
    if (seen.has(key)) {
      repeats.push({ url: current, norm: key, first_hop: seen.get(key), repeat_hop: hop });
    } else {
      seen.set(key, hop);
    }

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
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
    try {
      res = await fetch(current, {
        method,
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": userAgent,
          "accept": "*/*",
        },
      });
    } catch (e) {
      clearTimeout(t);
      chain.push({
        url: current,
        status: 0,
        location: null,
        error: String(e && e.name ? e.name : e),
      });
      return { chain, finalUrl: current, finalStatus: 0, repeats, maxHops };
    }
    clearTimeout(t);

    const status = res.status || 0;
    const location = res.headers ? res.headers.get("location") : null;

    chain.push({
      url: current,
      status,
      location: location || null,
    });

    const isRedirect = status >= 300 && status <= 399 && location;
    if (!isRedirect) {
      return { chain, finalUrl: current, finalStatus: status, repeats, maxHops };
    }

    let next;
    try {
      next = new URL(location, current).toString();
    } catch {
      return { chain, finalUrl: current, finalStatus: status, repeats, maxHops };
    }
    current = next;
  }
  return { chain, finalUrl: chain[chain.length - 1]?.url || startUrl, finalStatus: chain[chain.length - 1]?.status || 0, repeats, maxHops };
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

  return issues;
}

export default {
  id: "http_status_redirect_hygiene",
  title: "HTTP status + redirect hygiene",
  run: detectHttpStatusRedirectHygiene,
};
