import React, { useMemo, useState } from "react";
import { IconPlay, IconMail, IconLink } from "../components/Icons.jsx";
import { safeJson } from "../lib/safeJson.js";

function readParam(name) {
  if (typeof window === "undefined") return "";
  const sp = new URLSearchParams(window.location.search || "");
  return String(sp.get(name) || "").trim();
}

export default function EmbedFormPage() {
  const ownerId = readParam("owner");
  const webhook = readParam("webhook");
  const redirectUrl = readParam("redirect");
  const brand = readParam("brand") || "Free SEO Audit";
  const accent = readParam("accent") || "#FF642D";
  const theme = readParam("theme") || "light";
  const themeBg = theme === "minimal" ? "transparent" : theme === "soft" ? "rgba(244,245,249,0.9)" : "transparent";
  const cardBg = theme === "minimal" ? "rgba(255,255,255,0.9)" : "#ffffff";
  const logo = readParam("logo");
  const notifyEmail = readParam("notify");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    try {
      const u = new URL(url.trim());
      return u.protocol.startsWith("http") && email.includes("@") && ownerId;
    } catch {
      return false;
    }
  }, [url, email, ownerId]);

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/embed/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: ownerId,
          url: url.trim(),
          email: email.trim(),
          name: name.trim(),
          webhook,
          notify_email: notifyEmail
        })
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to submit");
      }
      setStatus("success");
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (e2) {
      setStatus("error");
      setError(String(e2?.message || "Request failed."));
    }
  }

  return (
    <div className="min-h-screen p-4 text-[var(--rp-text-900)]" style={{ background: themeBg }}>
      <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--rp-border)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.12)]" style={{ background: cardBg }}>
        <div className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt={brand} className="h-8 w-8 rounded-lg object-contain" />
          ) : null}
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--rp-text-500)]">{brand}</div>
        </div>
        <div className="mt-2 text-xl font-semibold">Get an instant SEO snapshot</div>
        <p className="mt-1 text-sm text-[var(--rp-text-600)]">
          Enter your URL and we’ll send a short audit summary.
        </p>
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <label className="text-xs font-semibold text-[var(--rp-text-500)]">Website URL</label>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2">
            <IconLink size={14} className="text-[var(--rp-text-400)]" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <label className="text-xs font-semibold text-[var(--rp-text-500)]">Work email</label>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-3 py-2">
            <IconMail size={14} className="text-[var(--rp-text-400)]" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label className="text-xs font-semibold text-[var(--rp-text-500)]">Name (optional)</label>
          <input
            className="rp-input text-sm"
            placeholder="Avery Patel"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {error && <div className="text-xs text-rose-600">{error}</div>}

          <button
            type="submit"
            disabled={!canSubmit || status === "loading"}
            title={!canSubmit ? "Add a valid URL and email to enable this button." : "Run a free audit"}
            style={{ backgroundColor: accent }}
            className={`rp-btn-primary mt-1 w-full ${!canSubmit || status === "loading" ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <IconPlay size={14} />
            {status === "success" ? "Submitted" : status === "loading" ? "Submitting..." : "Run free audit"}
          </button>
          {!canSubmit && (
            <div className="mt-2 text-xs text-[var(--rp-text-500)]">
              Enter a valid URL and work email to continue.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
