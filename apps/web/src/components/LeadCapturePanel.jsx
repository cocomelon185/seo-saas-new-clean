import { useMemo, useState } from "react";
import { apiUrl } from "../lib/api.js";

export default function LeadCapturePanel({ reportUrl }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [msg, setMsg] = useState("");

  const canSend = useMemo(() => {
    const e = email.trim();
    return e.length > 5 && e.includes("@") && e.includes(".");
  }, [email]);

  async function onSend() {
    try {
      setStatus("sending");
      setMsg("");
      const res = await fetch(apiUrl("/api/lead"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), reportUrl })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setStatus("error");
        setMsg(data?.error || `send_failed_${res.status}`);
        return;
      }
      setStatus("sent");
      setMsg("Sent. Check your inbox.");
    } catch (e) {
      setStatus("error");
      setMsg(e?.message || "send_failed");
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-black/10 bg-white/70 p-3">
      <div className="text-sm font-semibold text-[var(--rp-text-900)]">Email this report</div>
      <div className="mt-1 text-xs text-[var(--rp-text-600)]">Get the link + next steps. Weekly monitoring is included in the email.</div>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
        />
        <button
          onClick={onSend}
          disabled={!canSend || status === "sending" || status === "sent"}
          className="h-10 shrink-0 rounded-lg bg-[var(--rp-purple-600)] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {status === "sending" ? "Sending..." : status === "sent" ? "Sent" : "Send"}
        </button>
      </div>

      {msg ? (
        <div className={`mt-2 text-xs ${status === "error" ? "text-red-600" : "text-[var(--rp-text-600)]"}`}>{msg}</div>
      ) : null}
    </div>
  );
}
