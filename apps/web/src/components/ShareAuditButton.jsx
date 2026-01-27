export default function ShareAuditButton({ result }) {
  if (!result?.url) return null;

  function share() {
    const url = new URL(window.location.origin + "/audit");
    url.searchParams.set("url", result.url);
    url.searchParams.set("readonly", "1");
    navigator.clipboard.writeText(url.toString());
    alert("Read-only audit link copied");
  }

  return (
    <button
      onClick={share}
      className="h-9 rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/80 hover:bg-white/[0.04]"
    >
      Share
    </button>
  );
}
