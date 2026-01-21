import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Icon({ children }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
      <div className="h-5 w-5 text-white">{children}</div>
    </div>
  );
}

function ToolCard({ title, desc, href, badge, disabled }) {
  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
        "transition hover:border-white/20 hover:bg-white/[0.05]",
        disabled && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold text-white">{title}</div>
            {badge ? (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/90 ring-1 ring-white/15">
                {badge}
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-sm leading-6 text-white/70">{desc}</div>
        </div>
        <div className="mt-1 h-8 w-8 rounded-xl bg-white/5 ring-1 ring-white/10 transition group-hover:bg-white/10">
          <div className="flex h-full w-full items-center justify-center text-white/80">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7" />
              <path d="M9 7h8v8" />
            </svg>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-2xl transition group-hover:from-white/30" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-2xl" />
    </div>
  );

  if (disabled) return <div>{content}</div>;
  return <Link to={href} className="block">{content}</Link>;
}

function ExternalToolCard({ title, desc, href, badge }) {
  return (
    <a
      href={href}
      className="block"
    >
      <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition hover:border-white/20 hover:bg-white/[0.05]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold text-white">{title}</div>
              {badge ? (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/90 ring-1 ring-white/15">
                  {badge}
                </span>
              ) : null}
            </div>
            <div className="mt-2 text-sm leading-6 text-white/70">{desc}</div>
          </div>
          <div className="mt-1 h-8 w-8 rounded-xl bg-white/5 ring-1 ring-white/10 transition group-hover:bg-white/10">
            <div className="flex h-full w-full items-center justify-center text-white/80">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                <path d="M7 17L17 7" />
                <path d="M9 7h8v8" />
              </svg>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-2xl transition group-hover:from-white/30" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-2xl" />
      </div>
    </a>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-base font-semibold text-white">{q}</div>
        <div className="h-7 w-7 rounded-xl bg-white/5 ring-1 ring-white/10">
          <div className="flex h-full w-full items-center justify-center text-white/80">
            <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4 transition", open && "rotate-45")} stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </div>
        </div>
      </div>
      {open ? <div className="mt-3 text-sm leading-6 text-white/70">{a}</div> : null}
    </button>
  );
}

export default function LandingPage() {
  const year = useMemo(() => new Date().getFullYear(), []);
  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500/30 via-sky-400/20 to-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-[-180px] top-[240px] h-[360px] w-[360px] rounded-full bg-gradient-to-tr from-sky-400/25 to-transparent blur-3xl" />
        <div className="absolute left-[-180px] top-[520px] h-[360px] w-[360px] rounded-full bg-gradient-to-tr from-indigo-500/20 to-transparent blur-3xl" />
      </div>

      <header className="relative">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-white/10 ring-1 ring-white/15">
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-indigo-400 to-sky-300" />
              </div>
            </div>
            <div className="text-sm font-semibold tracking-wide">RankyPulse</div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#tools" className="hover:text-white">Tools</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/audit"
              className="hidden rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/90 shadow-sm transition hover:border-white/20 hover:bg-white/[0.05] md:inline-flex"
            >
              Run Audit
            </Link>
            <Link
              to="/rank"
              className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-white/90"
            >
              Check Rank
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto max-w-6xl px-6 pb-10 pt-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Fast audits. Clear next steps. Built for shipping.
          </div>

          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                SEO clarity in minutes —
                <span className="block bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                  audit a page, check rankings, move on.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                RankyPulse gives you two essentials: a quick SEO page audit and a rank checker. No dashboards. No noise. Just results you can act on.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/audit"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-white/90"
                >
                  Run SEO Audit
                </Link>
                <Link
                  to="/rank"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:border-white/25 hover:bg-white/[0.06]"
                >
                  Check Rank
                </Link>
                <a
                  href="/audit"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:text-white"
                >
                  Audit subdomain
                </a>
                <a
                  href="/rank"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:text-white"
                >
                  Rank subdomain
                </a>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  No signup required for MVP
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  Works on common SaaS pages
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  Simple limits later (free vs paid)
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">Preview</div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70">
                  Live tools
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs font-medium text-white/60">SEO Page Audit</div>
                  <div className="mt-1 text-sm text-white/85">Score, quick wins, core issues</div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm text-white/60 flex items-center">
                      https://example.com/pricing
                    </div>
                    <div className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-black flex items-center">
                      Run
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs font-medium text-white/60">Rank Checker</div>
                  <div className="mt-1 text-sm text-white/85">Keyword + domain → rank result</div>
                  <div className="mt-3 grid gap-2">
                    <div className="h-10 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm text-white/60 flex items-center">
                      keyword: seo audit tool
                    </div>
                    <div className="h-10 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm text-white/60 flex items-center">
                      domain: rankypulse.com
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4">
                  <div className="text-xs font-medium text-white/60">Outcome</div>
                  <div className="mt-1 text-sm text-white/85">
                    Know what’s broken, what to fix first, and whether rankings move — without a complicated suite.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs font-medium text-white/60">Trusted patterns used by top SaaS homepages</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-white/75 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">Clear hero + CTA</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">Social proof</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">Tool-first entry</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">Pricing clarity</div>
            </div>
          </div>
        </section>

        <section id="tools" className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-white/90">Tools</div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Start with what you actually need</h2>
            <p className="max-w-2xl text-sm leading-6 text-white/70">
              Two core tools now. More later. Each tool is designed to be understood in under 10 seconds.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <ToolCard
              title="SEO Page Audit"
              desc="Paste a URL and get a score, quick wins, and a prioritized list of issues."
              href="/audit"
              badge="MVP"
            />
            <ToolCard
              title="Rank Checker"
              desc="Check where your domain ranks for a keyword. (History and tracking come later.)"
              href="/rank"
              badge="MVP"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <ToolCard
              title="Keyword Ideas"
              desc="Find opportunities and content angles."
              href="/"
              badge="Coming soon"
              disabled
            />
            <ToolCard
              title="Content Brief"
              desc="Turn SEO checks into a writing plan."
              href="/"
              badge="Coming soon"
              disabled
            />
            <ToolCard
              title="AI Visibility"
              desc="Track citations in AI search engines."
              href="/"
              badge="Coming soon"
              disabled
            />
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-sm font-semibold text-white/90">How it works</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Fast workflow, zero fluff</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
                Most SEO tools bury the action. RankyPulse is built for speed: run a check, get the next step, keep moving.
              </p>

              <div className="mt-6 grid gap-4">
                <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <Icon>
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                      <path d="M21 21l-4.3-4.3" />
                      <circle cx="11" cy="11" r="7" />
                    </svg>
                  </Icon>
                  <div>
                    <div className="font-semibold text-white">1) Run the audit</div>
                    <div className="mt-1 text-sm leading-6 text-white/70">Paste a URL. Get score + issues + quick wins.</div>
                  </div>
                </div>

                <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <Icon>
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19V5" />
                      <path d="M4 19h16" />
                      <path d="M8 15l3-3 3 2 4-6" />
                    </svg>
                  </Icon>
                  <div>
                    <div className="font-semibold text-white">2) Check ranking</div>
                    <div className="mt-1 text-sm leading-6 text-white/70">See where you stand for a keyword + domain.</div>
                  </div>
                </div>

                <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <Icon>
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20V10" />
                      <path d="M18 20V4" />
                      <path d="M6 20v-6" />
                    </svg>
                  </Icon>
                  <div>
                    <div className="font-semibold text-white">3) Improve over time</div>
                    <div className="mt-1 text-sm leading-6 text-white/70">History, exports, and tracking unlock later as paid features.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm font-semibold text-white/90">Why this layout converts</div>
              <div className="mt-4 space-y-4 text-sm leading-6 text-white/70">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="font-semibold text-white">Minimal hero, strong CTA</div>
                  <div className="mt-1">Above-the-fold stays clean so users instantly understand what to do next.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="font-semibold text-white">Consistent entry points</div>
                  <div className="mt-1">Nav CTA and hero CTA match, reducing hesitation.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="font-semibold text-white">Tool-first design</div>
                  <div className="mt-1">Users can click into Audit/Rank immediately — no long scroll required.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-white/90">Pricing</div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Simple pricing that matches value</h2>
            <p className="max-w-2xl text-sm leading-6 text-white/70">
              Start free. Upgrade when you need more runs, history, and exports.
            </p>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Free</div>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/90 ring-1 ring-white/15">
                  MVP
                </span>
              </div>
              <div className="mt-2 text-sm text-white/70">For trying it out and quick checks.</div>
              <div className="mt-5 text-4xl font-semibold tracking-tight">$0</div>
              <ul className="mt-5 space-y-3 text-sm text-white/75">
                <li className="flex gap-2"><span className="text-emerald-300">✓</span> 3 audits/day</li>
                <li className="flex gap-2"><span className="text-emerald-300">✓</span> 5 rank checks/day</li>
                <li className="flex gap-2"><span className="text-emerald-300">✓</span> Instant results</li>
                <li className="flex gap-2"><span className="text-white/35">•</span> No history</li>
              </ul>
              <div className="mt-7">
                <Link to="/audit" className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                  Start with Audit
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-7">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-400/30 to-transparent blur-3xl" />
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Pro</div>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/90 ring-1 ring-white/15">
                  Coming soon
                </span>
              </div>
              <div className="mt-2 text-sm text-white/70">For founders and small teams that need repeatability.</div>
              <div className="mt-5 text-4xl font-semibold tracking-tight">$29<span className="text-base font-semibold text-white/60">/mo</span></div>
              <ul className="mt-5 space-y-3 text-sm text-white/75">
                <li className="flex gap-2"><span className="text-emerald-300">✓</span> Unlimited audits + rank checks</li>
                <li className="flex gap-2"><span className="text-emerald-300">✓</span> History (rank + audit)</li>
                <li className="flex gap-2"><span className="text-emerald-300">✓</span> Export (PDF/CSV)</li>
                <li className="flex gap-2"><span className="text-emerald-300">✓</span> Priority processing</li>
              </ul>
              <div className="mt-7">
                <a
                  href="#tools"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.06]"
                >
                  See Tools
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-white/90">FAQ</div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Quick answers</h2>
            <p className="max-w-2xl text-sm leading-6 text-white/70">
              Keep it simple. Ship fast. Improve based on usage.
            </p>
          </div>

          <div className="mt-7 grid gap-3">
            <FaqItem
              q="Do I need an account?"
              a="For the MVP, no. Later, accounts unlock history, exports, and saved projects."
            />
            <FaqItem
              q="Why only two tools?"
              a="Because two tools done well beats a bloated suite. Audit + Rank are the fastest path to value."
            />
            <FaqItem
              q="Will you add more features?"
              a="Yes — but only after the MVP is reliable. The next paid unlocks are history and exports."
            />
          </div>
        </section>

        <footer className="mx-auto max-w-6xl px-6 pb-12 pt-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-white">RankyPulse</div>
                <div className="mt-1 text-xs text-white/60">© {year} RankyPulse. All rights reserved.</div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link to="/audit" className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-white/90 transition hover:border-white/20 hover:bg-white/[0.06]">Audit</Link>
                <Link to="/rank" className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-white/90 transition hover:border-white/20 hover:bg-white/[0.06]">Rank</Link>
                <a href="/audit" className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-white/80 transition hover:border-white/20 hover:bg-white/[0.06]">Audit subdomain</a>
                <a href="/rank" className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-white/80 transition hover:border-white/20 hover:bg-white/[0.06]">Rank subdomain</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
