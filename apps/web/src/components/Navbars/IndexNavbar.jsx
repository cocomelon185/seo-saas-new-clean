import React from "react";
import { Link } from "react-router-dom";

export default function IndexNavbar() {
  const [navbarOpen, setNavbarOpen] = React.useState(false);

  return (
    <nav className="top-0 fixed z-50 w-full border-b border-white/10 bg-[#120a22]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
            RankyPulse
          </Link>
        </div>
        <button
          className="text-sm text-white/70 lg:hidden"
          type="button"
          onClick={() => setNavbarOpen(!navbarOpen)}
        >
          Menu
        </button>
        <div className={`flex-1 items-center justify-end gap-6 ${navbarOpen ? "flex" : "hidden"} lg:flex`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <Link to="/#features" className="text-sm text-white/70 hover:text-white">
              Features
            </Link>
            <Link to="/pricing" className="text-sm text-white/70 hover:text-white">
              Pricing
            </Link>
            <Link to="/auth/signin" className="text-sm text-white/70 hover:text-white">
              Sign in
            </Link>
            <Link
              to="/auth/signup"
              className="rounded-full border border-violet-400/40 bg-violet-500/20 px-4 py-2 text-sm font-semibold text-white hover:border-violet-300"
            >
              Create account
            </Link>
            <Link
              to="/start"
              className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow"
            >
              Run Free Audit
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
