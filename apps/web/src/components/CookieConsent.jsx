import { useEffect, useState } from "react";

const KEY = "rp_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem(KEY);
    if (!existing) setVisible(true);
  }, []);

  if (!visible) return null;

  const setConsent = (value) => {
    try {
      window.localStorage.setItem(KEY, value);
      if (value === "denied") {
        window.__RP_DISABLE_TRACKING__ = true;
      }
    } catch {}
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] w-[min(720px,90vw)] -translate-x-1/2 rounded-2xl border border-[var(--rp-border)] bg-white px-4 py-3 text-xs text-[var(--rp-text-600)] shadow-[0_18px_40px_rgba(15,23,42,0.25)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          We use cookies to measure conversions and improve RankyPulse. You can opt out anytime in your browser settings.
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs" onClick={() => setConsent("denied")}>
            Decline
          </button>
          <button className="rp-btn-primary rp-btn-sm h-9 px-3 text-xs" onClick={() => setConsent("granted")}>
            Allow analytics
          </button>
        </div>
      </div>
    </div>
  );
}
