import { IconLink } from "./Icons.jsx";

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
      className="rp-btn-secondary text-xs h-9 px-3"
    >
      <IconLink size={12} />
      Share
    </button>
  );
}
