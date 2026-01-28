const KEY = "rankypulse_audit_history_v1";
const REMOTE_FLAG_KEY = "rankypulse_audit_history_remote_v1";

export function isRemoteEnabled() {
  try {
    return localStorage.getItem(REMOTE_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function setRemoteEnabled(on) {
  try {
    localStorage.setItem(REMOTE_FLAG_KEY, on ? "1" : "0");
  } catch {}
}

export async function loadAuditHistory() {
  if (isRemoteEnabled()) {
    try {
      const r = await fetch("/api/audit-history");
      if (!r.ok) throw new Error("remote_unavailable");
      const j = await r.json();
      return Array.isArray(j?.items) ? j.items : [];
    } catch {
      return loadAuditHistoryLocal();
    }
  }
  return loadAuditHistoryLocal();
}

export async function saveAuditHistory(items) {
  if (isRemoteEnabled()) {
    try {
      const r = await fetch("/api/audit-history", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: items || [] })
      });
      if (!r.ok) throw new Error("remote_unavailable");
      return;
    } catch {
      saveAuditHistoryLocal(items);
      return;
    }
  }
  saveAuditHistoryLocal(items);
}

export function loadAuditHistoryLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveAuditHistoryLocal(items) {
  localStorage.setItem(KEY, JSON.stringify(items || []));
}

export async function upsertAuditSnapshot(snapshot) {
  const items = await loadAuditHistory();
  const idx = items.findIndex((x) => x && x.id === snapshot.id);
  if (idx >= 0) items[idx] = snapshot;
  else items.unshift(snapshot);
  await saveAuditHistory(items);
  return items;
}

export async function renameAuditSnapshot(id, name) {
  const items = await loadAuditHistory();
  const idx = items.findIndex((x) => x && x.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], name: String(name || "").trim() };
    await saveAuditHistory(items);
  }
  return items;
}

export async function deleteAuditSnapshot(id) {
  const items = (await loadAuditHistory()).filter((x) => x && x.id !== id);
  await saveAuditHistory(items);
  return items;
}

export function makeSnapshotFromResult(result, url) {
  const now = Date.now();
  const id = "a_" + now.toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  return {
    id,
    createdAt: now,
    name: "",
    url: String(url || result?.url || ""),
    score: result?.score ?? null,
    quick_wins: Array.isArray(result?.quick_wins) ? result.quick_wins : [],
    issues: Array.isArray(result?.issues) ? result.issues : []
  };
}
