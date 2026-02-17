import { useEffect, useMemo } from "react";

const setMeta = (selector, attrs, content) => {
  if (typeof document === "undefined") return;
  const head = document.head || document.getElementsByTagName("head")[0];
  if (!head) return;

  let el = document.querySelector(selector);
  if (!content) {
    if (el) el.remove();
    return;
  }

  if (!el) {
    el = document.createElement("meta");
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setCanonical = (href) => {
  if (typeof document === "undefined") return;
  const head = document.head || document.getElementsByTagName("head")[0];
  if (!head) return;

  let link = document.querySelector('link[rel="canonical"]');
  if (!href) {
    if (link) link.remove();
    return;
  }

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    head.appendChild(link);
  }
  link.setAttribute("href", href);
};

export default function Seo({
  title,
  description,
  canonical,
  robots,
  twitterCard = "summary_large_image",
  jsonLd
}) {
  const jsonLdString = useMemo(() => {
    if (!jsonLd) return "";
    try {
      return JSON.stringify(jsonLd);
    } catch {
      return "";
    }
  }, [jsonLd]);

  const jsonLdItems = useMemo(() => {
    if (!jsonLdString) return [];
    try {
      const payload = JSON.parse(jsonLdString);
      return Array.isArray(payload) ? payload : [payload];
    } catch {
      return [];
    }
  }, [jsonLdString]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (title) document.title = title;
    if (description) {
      setMeta('meta[name="description"]', { name: "description" }, description);
      setMeta('meta[property="og:description"]', { property: "og:description" }, description);
      setMeta('meta[name="twitter:description"]', { name: "twitter:description" }, description);
    }
    if (title) {
      setMeta('meta[property="og:title"]', { property: "og:title" }, title);
      setMeta('meta[name="twitter:title"]', { name: "twitter:title" }, title);
    }
    setMeta('meta[name="twitter:card"]', { name: "twitter:card" }, twitterCard);
    setMeta('meta[name="robots"]', { name: "robots" }, robots);
    const canonicalOrigin =
      (typeof window !== "undefined" && window.location && window.location.origin) ||
      "https://rankypulse.com";

    const path =
      (typeof window !== "undefined" && window.location && window.location.pathname) || "/";

    const canonicalHref =
      canonical && /^https?:\/\//i.test(String(canonical).trim())
        ? String(canonical).trim()
        : canonicalOrigin + (path === "/" ? "/" : path);

    setCanonical(canonicalHref);
}, [title, description, canonical, robots, twitterCard]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const existing = Array.from(document.querySelectorAll('script[data-rp-jsonld="true"]'));
    existing.forEach((el) => el.remove());

    if (!jsonLdString) return;
    let payload = null;
    try {
      payload = JSON.parse(jsonLdString);
    } catch {
      payload = null;
    }
    if (!payload) return;

    const items = Array.isArray(payload) ? payload : [payload];
    items.forEach((item) => {
      if (!item) return;
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-rp-jsonld", "true");
      script.text = JSON.stringify(item);
      document.head.appendChild(script);
    });

    return () => {
      const current = Array.from(document.querySelectorAll('script[data-rp-jsonld="true"]'));
      current.forEach((el) => el.remove());
    };
  }, [jsonLdString]);

  if (!jsonLdItems.length) return null;
  return (
    <>
      {jsonLdItems.map((item, index) => (
        <script
          key={`rp-jsonld-${index}`}
          type="application/ld+json"
          data-rp-jsonld="true"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
