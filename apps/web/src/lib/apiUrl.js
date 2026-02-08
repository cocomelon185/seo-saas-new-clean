export function apiUrl(path = "") {
  const base =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE ||
    "https://api.rankypulse.com";

  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
