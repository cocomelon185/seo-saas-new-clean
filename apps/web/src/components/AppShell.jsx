import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/rankypulse-logo.svg";
import { IconPlay, IconSearch, IconUser, IconCompass, IconChart } from "./Icons.jsx";
import { clearAuthSession, getAuthToken, getAuthUser, setAuthSession } from "../lib/authClient.js";
import { useEffect, useState } from "react";
import { safeJson } from "../lib/safeJson.js";
import { apiUrl } from "../lib/api.js";
import CookieConsent from "./CookieConsent.jsx";
import Seo from "./Seo.jsx";

function NavItem({ to, label }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={[
        "rp-sidebar-item group flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition",
        active
          ? "border-white/15 bg-white/10 text-white"
          : "text-white/85 hover:text-white hover:bg-white/5"
      ].join(" ")}
    >
      <span>{label}</span>
      <span
        className={[
          "h-2 w-2 rounded-full transition",
          active ? "bg-[var(--rp-orange-500)]" : "bg-white/10 group-hover:bg-white/20"
        ].join(" ")}
      />
    </Link>
  );
}

export default function AppShell({ title, subtitle, seoTitle, seoDescription, seoCanonical, seoRobots, seoJsonLd, children }) {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(getAuthUser());
  const [authed, setAuthed] = useState(Boolean(getAuthToken()));
  const [toolAccess, setToolAccess] = useState({ allow_audit: true, allow_rank: true, allow_improve: true });
  const lockedTools = [];
  if (authUser?.role !== "admin") {
    if (!toolAccess.allow_audit) lockedTools.push("SEO Audit");
    if (!toolAccess.allow_rank) lockedTools.push("Rank Checker");
    if (!toolAccess.allow_improve) lockedTools.push("Improve Page");
  }

  useEffect(() => {
    const sync = () => {
      setAuthUser(getAuthUser());
      setAuthed(Boolean(getAuthToken()));
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch(apiUrl("/api/account-settings"), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => safeJson(r))
      .then((data) => {
        if (data?.ok && data?.settings) {
          const settings = data.settings || {};
          const current = getAuthUser() || {};
          const hasVerified = typeof settings.verified === "boolean";
          const nextUser = {
            ...current,
            ...(settings.email ? { email: settings.email } : {}),
            ...(settings.name ? { name: settings.name } : {}),
            ...(settings.role ? { role: settings.role } : {}),
            ...(settings.team_id ? { team_id: settings.team_id } : {}),
            ...(hasVerified ? { verified: settings.verified } : {})
          };
          setAuthUser(nextUser);
          setAuthSession({ token, user: nextUser });
          setToolAccess({
            allow_audit: settings.allow_audit !== false,
            allow_rank: settings.allow_rank !== false,
            allow_improve: settings.allow_improve !== false
          });
        }
      })
      .catch(() => {});
  }, [authed]);

  const shouldRenderSeo = Boolean(seoTitle || seoDescription || seoCanonical || seoRobots || seoJsonLd);
  const verificationStatus =
    authUser?.verified === true
      ? "verified"
      : authUser?.verified === false
        ? "unverified"
        : "unknown";

  return (
    <div className="rp-page rp-premium-bg">
      {shouldRenderSeo ? (
        <Seo
          title={seoTitle}
          description={seoDescription}
          canonical={seoCanonical}
          robots={seoRobots}
          jsonLd={seoJsonLd}
        />
      ) : null}
      <a href="#main-content" className="rp-skip">Skip to content</a>
      <div className="flex min-h-screen">
        <aside className="rp-sidebar hidden w-72 flex-col gap-8 bg-[var(--rp-indigo-900)] px-6 py-6 text-white md:flex">
          <Link to="/" className="rp-sidebar-brand flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <img src={logo} alt="RankyPulse" className="h-9 w-9" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">RankyPulse</div>
              <div className="text-xs text-white/85">Premium SEO clarity, fast.</div>
            </div>
          </Link>

          <div className="flex flex-col gap-3">
            <div className="text-xs uppercase tracking-[0.3em] text-white/40">Overview</div>
            <div className="rp-sidebar-card rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/85">
              Workspace: <span className="font-semibold text-white">Project Overview</span>
              <div className="mt-2 flex items-center gap-2 text-white/60">
                <IconCompass size={14} />
                2 active projects
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/40">Navigation</div>
            <nav className="mt-3 flex flex-col gap-2 text-sm">
              {(authUser?.role === "admin" || toolAccess.allow_audit) && <NavItem to="/audit" label="SEO Audit" />}
              {(authUser?.role === "admin" || toolAccess.allow_rank) && <NavItem to="/rank" label="Rank Checker" />}
              {(authUser?.role === "admin" || toolAccess.allow_improve) && <NavItem to="/improve" label="Improve Page" />}
              <NavItem to="/embed" label="Embed Widget" />
              <NavItem to="/leads" label="Leads Inbox" />
              <NavItem to="/pricing" label="Pricing" />
              <Link
                to="/account/settings"
                className="rp-sidebar-item group flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/5 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <IconUser size={14} />
                  Account
                </span>
                <span className="h-2 w-2 rounded-full bg-white/10 transition group-hover:bg-white/20" />
              </Link>
              {authUser?.role === "admin" && (
                <NavItem to="/admin/team" label="Team Settings" />
              )}
              {authUser?.role === "admin" && (
                <NavItem to="/admin/analytics" label="Analytics" />
              )}
            </nav>
          </div>

          {lockedTools.length > 0 && (
            <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/85">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Locked by admin</div>
              <ul className="mt-3 space-y-1 text-xs text-white/85">
                {lockedTools.map((tool) => (
                  <li key={tool} className="flex items-center justify-between">
                    <span>{tool}</span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                      Locked
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={["rp-sidebar-card rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/85", lockedTools.length > 0 ? "" : "mt-auto"].join(" ")}>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <IconChart size={16} />
              Weekly snapshot
            </div>
            <p className="mt-2 text-white/85">
              Visibility +6% this week. New issues detected on 2 pages.
            </p>
          </div>

        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-[var(--rp-bg)]">
          <header className="rp-topbar sticky top-0 z-20 border-b border-[var(--rp-gray-200)] bg-white/95 backdrop-blur">
            <div className="rp-topbar-inner flex w-full items-center justify-between gap-4 px-4 py-3 xl:px-6">
              <div className="flex items-center gap-3 md:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--rp-indigo-900)] text-white">
                  <img src={logo} alt="RankyPulse" className="h-7 w-7" />
                </div>
                <div className="text-sm font-semibold text-[var(--rp-text-900)]">RankyPulse</div>
              </div>
              <div className="flex flex-1 items-center gap-3" role="search">
                <div className="hidden text-sm font-semibold text-[var(--rp-text-900)] md:block">Project Overview</div>
                <div className="hidden flex-1 md:block">
                  <label className="rp-input flex items-center gap-2">
                    <IconSearch size={16} className="text-[var(--rp-text-400)]" />
                    <input
                      type="text"
                      aria-label="Search"
                      placeholder="Search projects, domains, reports..."
                      className="w-full bg-transparent text-sm text-[var(--rp-text-900)] outline-none placeholder:text-[var(--rp-text-400)]"
                    />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {authed ? (
                  <>
                    <div className="relative group hidden md:block">
                    <button
                      className="rp-topbar-pill hidden items-center gap-2 rounded-full border border-[var(--rp-gray-200)] px-3 py-2 text-xs text-[var(--rp-text-500)] md:flex"
                      onClick={() => navigate("/account/settings")}
                    >
                      <IconUser size={14} />
                      {authUser?.name || "Account"}
                      {authUser?.role === "admin" && (
                        <span className="ml-2 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          Admin
                        </span>
                      )}
                      {verificationStatus === "verified" ? (
                        <span className="ml-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Verified
                        </span>
                      ) : verificationStatus === "unverified" ? (
                        <span className="ml-2 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Unverified
                        </span>
                      ) : null}
                    </button>
                    <div className="pointer-events-none absolute right-0 top-10 z-10 w-56 rounded-xl border border-[var(--rp-border)] bg-white p-3 text-[11px] text-[var(--rp-text-500)] opacity-0 shadow-lg transition group-hover:opacity-100">
                      {verificationStatus === "verified"
                        ? "Your email is verified. You can access full features and notifications."
                        : verificationStatus === "unverified"
                          ? "Verify your email to unlock full audit and notifications."
                          : "Account verification status is updating."}
                    </div>
                    </div>
                    <button
                      className="rp-topbar-pill hidden items-center gap-2 rounded-full border border-[var(--rp-gray-200)] px-3 py-2 text-xs text-[var(--rp-text-500)] md:flex"
                      onClick={() => {
                        try {
                          if (window.google?.accounts?.id) {
                            window.google.accounts.id.disableAutoSelect();
                            if (authUser?.email) {
                              window.google.accounts.id.revoke(authUser.email, () => {});
                            }
                          }
                        } catch {}
                        clearAuthSession();
                        try { localStorage.setItem("rp_signed_out","1"); } catch (_) {}
                        try {
                          if (typeof window !== "undefined" && window.google && window.google.accounts && window.google.accounts.id) {
                            window.google.accounts.id.disableAutoSelect();
                          }
                        } catch (_) {}
                        setAuthed(false);
                        navigate("/auth/signin");
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link to="/auth/signup" className="rp-topbar-pill hidden rounded-full border border-[var(--rp-indigo-700)] bg-[var(--rp-indigo-700)] px-3 py-2 text-xs font-semibold text-white md:inline-flex">
                    Create account
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main id="main-content" className="w-full px-4 py-10 xl:px-6">
            {title ? (
              <div className="mb-7">
                <p className="rp-kicker">RankyPulse</p>
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--rp-text-900)] md:text-4xl">{title}</h1>
                {subtitle ? <p className="mt-2 max-w-2xl text-[var(--rp-text-500)]">{subtitle}</p> : null}
              </div>
            ) : null}

            <div className="rp-surface p-6 md:p-8">
              {children}
            </div>

            <footer className="mt-10 border-t border-[var(--rp-gray-200)] pt-6 text-sm text-[var(--rp-text-500)]">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>(c) {new Date().getFullYear()} RankyPulse</div>
                <div className="flex gap-3">
                  <Link to="/" className="hover:text-[var(--rp-text-900)]">Home</Link>
                  <Link to="/audit" className="hover:text-[var(--rp-text-900)]">Audit</Link>
                  <Link to="/rank" className="hover:text-[var(--rp-text-900)]">Rank</Link>
                  <Link to="/improve" className="hover:text-[var(--rp-text-900)]">Improve</Link>
                </div>
              </div>
            </footer>
          </main>
        </div>
        <CookieConsent />
      </div>
    </div>
  );
}
