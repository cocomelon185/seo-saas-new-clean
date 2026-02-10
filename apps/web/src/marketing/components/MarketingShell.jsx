import { Link } from "react-router-dom";
import logo from "../../assets/rankypulse-logo.svg";
import CookieConsent from "../../components/CookieConsent.jsx";

export default function MarketingShell({ title, subtitle, children }) {
  return (
    <div className="rp-page rp-premium-bg">
      <a href="#main" className="rp-skip">Skip to content</a>
      <header className="sticky top-0 z-50 border-b border-[var(--rp-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-[var(--rp-text-900)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--rp-indigo-900)]">
              <img src={logo} alt="RankyPulse" className="h-6 w-6" />
            </span>
            RankyPulse
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[var(--rp-text-600)] md:flex">
            <Link to="/start" className="hover:text-[var(--rp-text-900)]">Start</Link>
            <Link to="/pricing" className="hover:text-[var(--rp-text-900)]">Pricing</Link>
            <Link to="/about" className="hover:text-[var(--rp-text-900)]">About</Link>
            <Link to="/changelog" className="hover:text-[var(--rp-text-900)]">Changelog</Link>
            <Link to="/shared" className="hover:text-[var(--rp-text-900)]">Sample report</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth/signin"
              className="rounded-xl border border-[var(--rp-border)] px-4 py-2 text-xs font-semibold text-[var(--rp-text-600)] hover:border-[var(--rp-text-400)]"
            >
              Sign in
            </Link>
            <Link
              to="/auth/signup"
              className="rounded-xl bg-[var(--rp-indigo-700)] px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(109,40,217,0.25)] hover:bg-[var(--rp-indigo-800)]"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-5 py-10">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h1 className="text-3xl font-semibold text-[var(--rp-text-900)] md:text-4xl">{title}</h1>}
            {subtitle && <p className="mt-3 text-sm text-[var(--rp-text-600)] md:text-base">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>

      <footer className="border-t border-[var(--rp-border)] py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 text-sm text-[var(--rp-text-600)] md:flex-row md:items-center md:justify-between">
          <span>© 2026 RankyPulse</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/about" className="hover:text-[var(--rp-text-900)]">About</Link>
            <Link to="/pricing" className="hover:text-[var(--rp-text-900)]">Pricing</Link>
            <Link to="/about" className="hover:text-[var(--rp-text-900)]">Support</Link>
            <Link to="/about" className="hover:text-[var(--rp-text-900)]">Privacy</Link>
            <Link to="/about" className="hover:text-[var(--rp-text-900)]">Terms</Link>
          </div>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
}
