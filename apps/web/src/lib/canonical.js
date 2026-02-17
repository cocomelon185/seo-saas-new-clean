export function setCanonical(url) {
  try {
    if (!url || typeof document === "undefined") return;

    const abs = new URL(url, window.location.origin);
    abs.hash = "";
    abs.search = "";

    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }

    link.setAttribute("href", abs.toString());
  } catch (_) {}
}
