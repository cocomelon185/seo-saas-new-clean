import { Link, useLocation } from "react-router-dom";

function NavItem({ to, label }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={[
        "rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-white/10 text-white"
          : "text-white/70 hover:text-white hover:bg-white/5"
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function AppShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500/35 via-fuchsia-500/25 to-cyan-400/25 blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400/20 via-indigo-500/25 to-fuchsia-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

      <div className="relative">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070A12]/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]" />
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-wide">RankyPulse</div>
                <div className="text-xs text-white/60">SEO tools that feel instant</div>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 md:flex">
              <NavItem to="/audit" label="SEO Audit" />
              <NavItem to="/rank" label="Rank Checker" />
              <NavItem to="/improve" label="Improve Page" />
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to="/audit"
                className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/[0.10]"
              >
                Run Audit
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-7">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-white/70">{subtitle}</p> : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-8">
            {children}
          </div>

          <footer className="mt-10 border-t border-white/10 pt-6 text-sm text-white/60">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>© {new Date().getFullYear()} RankyPulse</div>
              <div className="flex gap-3">
                <Link to="/" className="hover:text-white">Home</Link>
                <Link to="/audit" className="hover:text-white">Audit</Link>
                <Link to="/rank" className="hover:text-white">Rank</Link>
                <Link to="/improve" className="hover:text-white">Improve</Link>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
