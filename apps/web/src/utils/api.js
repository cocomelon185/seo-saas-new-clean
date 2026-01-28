export async function apiGet(path) {
  const r = await fetch(path, { credentials: "include" });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((j && (j.error || j.message)) || "request_failed");
  return j;
}

export async function apiPost(path, body) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body || {}),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((j && (j.error || j.message)) || "request_failed");
  return j;
}
