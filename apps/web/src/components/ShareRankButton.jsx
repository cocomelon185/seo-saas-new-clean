import { encodeSharePayload } from "../utils/shareRank.js";

export default function ShareRankButton({ result }) {
  const canShare = !!result;

  async function copy() {
    if (!canShare) return;

    const payload = {
      v: 1,
      kind: "rank",
      created_at: new Date().toISOString(),
      keyword: result?.keyword || "",
      domain: result?.domain || "",
      rank: result?.rank ?? result?.position ?? null,
      checked_at: result?.checked_at || null
    };

    const token = encodeSharePayload(payload);
    const url = `${window.location.origin}/rank?share=${encodeURIComponent(token)}`;

    try {
      await navigator.clipboard.writeText(url);
      alert("Share link copied.");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("Share link copied.");
    }
  }

  return (
    <button
      onClick={copy}
      disabled={!canShare}
      className={
        "h-9 rounded-lg border border-[var(--rp-border)] px-3 text-sm font-semibold " +
        (canShare
          ? "text-[var(--rp-text-600)] hover:border-[var(--rp-orange-500)]/40 hover:text-[var(--rp-indigo-900)]"
          : "cursor-not-allowed text-[var(--rp-text-500)]/70")
      }
      title={canShare ? "Copy a shareable read-only link" : "Run a check first"}
    >
      Share
    </button>
  );
}
