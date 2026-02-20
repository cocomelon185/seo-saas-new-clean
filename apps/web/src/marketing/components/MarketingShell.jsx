import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../../assets/rankypulse-logo.svg";
import CookieConsent from "../../components/CookieConsent.jsx";
import { clearAuthSession, getAuthDisplayName, getAuthToken, getAuthUser } from "../../lib/authClient.js";

export default function MarketingShell({ title, subtitle, children }) {
  const [authUser, setAuthUser] = useState(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAuthUser(getAuthUser());
      setAuthed(Boolean(getAuthToken()));
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return (
    <div className="rp-page rp-premium-bg">
      <a href="#main" className="rp-skip">Skip to content</a>
      <header className="sticky top-0 z-50 border-b border-[var(--rp-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-4 py-4 md:px-6 xl:px-8">
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-[var(--rp-text-900)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--rp-indigo-900)]">
              <img src={logo} alt="RankyPulse" className="h-6 w-6" />
            </span>
            RankyPulse
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[var(--rp-text-600)] md:flex">
            <Link to="/start" className="hover:text-[var(--rp-text-900)]">Start</Link>
            <Link to="/pricing" className="hover:text-[var(--rp-text-900)]">Pricing</Link>
            <Link to="/faq" className="hover:text-[var(--rp-text-900)]">FAQ</Link>
            <Link to="/contact" className="hover:text-[var(--rp-text-900)]">Contact</Link>
            <Link to="/about" className="hover:text-[var(--rp-text-900)]">About</Link>
            <Link to="/changelog" className="hover:text-[var(--rp-text-900)]">Changelog</Link>
            <Link to="/shared" className="hover:text-[var(--rp-text-900)]">Sample report</Link>
          </nav>
          <div className="flex items-center gap-2">
            {authed ? (
              <>
                <Link
                  to="/account/settings"
                  className="rounded-xl border border-[var(--rp-border)] px-4 py-2 text-xs font-semibold text-[var(--rp-text-600)] hover:border-[var(--rp-text-400)]"
                >
                  {getAuthDisplayName(authUser) || "My account"}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearAuthSession();
                    setAuthed(false);
                    window.location.assign("/");
                  }}
                  className="rounded-xl border border-[var(--rp-border)] px-4 py-2 text-xs font-semibold text-[var(--rp-text-600)] hover:border-[var(--rp-text-400)]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/signin"
                  className="rounded-xl border border-[var(--rp-border)] px-4 py-2 text-xs font-semibold text-[var(--rp-text-600)] hover:border-[var(--rp-text-400)]"
                >
                  Sign in
                </Link>
                <Link
                  to="/start"
                  className="rounded-xl bg-[var(--rp-indigo-700)] px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(109,40,217,0.25)] hover:bg-[var(--rp-indigo-800)]"
                >
                  Run Free SEO Audit
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[1360px] px-4 py-10 md:px-6 xl:px-8">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h1 className="text-3xl font-semibold text-[var(--rp-text-900)] md:text-4xl">{title}</h1>}
            {subtitle && <p className="mt-3 text-sm text-[var(--rp-text-600)] md:text-base">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>

      <footer className="border-t border-[var(--rp-border)] py-10">
        <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 px-4 text-sm text-[var(--rp-text-600)] md:flex-row md:items-center md:justify-between md:px-6 xl:px-8">
          <span>© 2026 RankyPulse</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/about" className="hover:text-[var(--rp-text-900)]">About</Link>
            <Link to="/pricing" className="hover:text-[var(--rp-text-900)]">Pricing</Link>
            <Link to="/faq" className="hover:text-[var(--rp-text-900)]">FAQ</Link>
            <Link to="/contact" className="hover:text-[var(--rp-text-900)]">Contact</Link>
            <Link to="/privacy" className="hover:text-[var(--rp-text-900)]">Privacy</Link>
            <Link to="/terms" className="hover:text-[var(--rp-text-900)]">Terms</Link>
          </div>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
}
