import React from "react";
import { Link } from "react-router-dom";
import { clearAuthSession, getAuthDisplayName, getAuthToken, getAuthUser } from "../../../lib/authClient.js";

export default function IndexNavbar() {
  const [navbarOpen, setNavbarOpen] = React.useState(false);
  const [authUser, setAuthUser] = React.useState(getAuthUser());
  const [authed, setAuthed] = React.useState(Boolean(getAuthToken()));

  React.useEffect(() => {
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
    <nav className="top-0 fixed z-50 w-full border-b border-white/10 bg-[#120a22]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-4 py-3 md:px-6 xl:px-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
            RankyPulse
          </Link>
        </div>
        <button
          className="text-sm text-white/85 lg:hidden"
          type="button"
          onClick={() => setNavbarOpen(!navbarOpen)}
        >
          Menu
        </button>
        <div className={`flex-1 items-center justify-end gap-6 ${navbarOpen ? "flex" : "hidden"} lg:flex`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <Link to="/#features" className="text-sm text-white/85 hover:text-white">
              Features
            </Link>
            <Link to="/pricing" className="text-sm text-white/85 hover:text-white">
              Pricing
            </Link>
            {authed ? (
              <>
                <Link to="/audit" className="text-sm text-white/85 hover:text-white">
                  {getAuthDisplayName(authUser) || "My account"}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearAuthSession();
                    setAuthed(false);
                    window.location.assign("/");
                  }}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/auth/signin" className="text-sm text-white/85 hover:text-white">
                  Sign in
                </Link>
                <Link
                  to="/auth/signup"
                  className="rounded-full border border-violet-500 bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(109,40,217,0.28)] hover:bg-violet-500"
                >
                  Create account
                </Link>
              </>
            )}
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
