import { useState } from "react";
import { encodeSharePayload } from "../utils/shareCodec.js";

export default function ShareAuditButton({ result }) {
  const [copied, setCopied] = useState(false);

  const disabled = !result;

  const onShare = async () => {
    try {
      const token = await encodeSharePayload(result);
      const url = `${window.location.origin}/share#${token}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } else {
        window.prompt("Copy this share link:", url);
      }
    } catch (e) {
      window.alert(String(e?.message || "Failed to create share link"));
    }
  };

  return (
    <button
      disabled={disabled}
      onClick={onShare}
      className={"h-9 rounded-lg border px-3 text-sm font-semibold " + (disabled ? "cursor-not-allowed text-slate-400" : "text-slate-700 hover:bg-slate-50")}
      title={disabled ? "Run an audit first" : "Copy a read-only share link"}
    >
      {copied ? "Copied" : "Share read-only"}
    </button>
  );
}
