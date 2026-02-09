import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/rankypulse-logo.svg";
import CookieConsent from "../components/CookieConsent.jsx";

export default function Landing() {
  return (
    <main className="min-h-screen text-white bg-[#120a24] [background-image:radial-gradient(circle_at_top,rgba(124,58,237,0.28),transparent_40%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.2),transparent_35%)]">
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#120a24]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold tracking-wide">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <img src={logo} alt="" aria-hidden="true" className="h-6 w-6" />
            </span>
            RankyPulse
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/95 md:flex">
            <a href="#how-it-works" className="hover:text-white">How it works</a>
            <a href="#features" className="hover:text-white">Features</a>
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/about" className="hover:text-white">Resources</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth/signin?provider=google" className="rounded-xl border border-white/20 bg-white/20 px-4 py-2 text-[11px] font-semibold text-white hover:border-white/40 hover:bg-white/30">
              Sign in with Google
            </Link>
            <Link to="/auth/signin" className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:border-white/40 hover:bg-white/5">
              Sign in
            </Link>
            <Link to="/auth/signup" className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_18px_40px_rgba(109,40,217,0.45)] hover:bg-violet-500">
              Create account
            </Link>
          </div>
        </div>
      </header>

      <div id="main" className="mx-auto w-full max-w-6xl px-5">
        <section className="pt-16 pb-14">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/95">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                Premium SEO audits
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
                The SEO audit command center built for fast wins.
              </h1>
              <p className="mt-4 text-base leading-7 text-white/95">
                RankyPulse turns any URL into a prioritized fix plan with clear evidence, visuals, and next steps so
                teams ship improvements with confidence.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link to="/start" className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(109,40,217,0.45)] hover:bg-violet-500">
                  Run Free Audit
                </Link>
                <Link to="/shared" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:border-white/40 hover:bg-white/5">
                  See a sample report
                </Link>
              </div>
              <form action="/audit" method="GET" className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <input
                  type="text"
                  name="url"
                  placeholder="https://example.com"
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  title="Run a free audit"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  Run Free Audit
                </button>
              </form>
              <Link to="/start" className="mt-3 inline-flex text-xs font-semibold text-white/95 underline hover:text-white">
                Run an Audit
              </Link>
              <p className="mt-4 text-xs text-white/95">No credit card required • Results in under 60 seconds</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Audits run", value: "18,540" },
                  { label: "Fixes prioritized", value: "142k" },
                  { label: "Avg. lift", value: "+27%" }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/95">{item.label}</div>
                    <div className="mt-1 text-lg font-semibold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between text-xs text-white/95">
                <span>Product preview</span>
                <span className="rounded-full border border-white/10 px-2 py-1">Live</span>
              </div>
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-xs text-white/95">
                    <span>SEO Health Score</span>
                    <span className="rounded-full border border-white/10 px-2 py-1">92</span>
                  </div>
                  <svg viewBox="0 0 240 64" className="mt-4 h-16 w-full" aria-label="SEO score trend">
                    <defs>
                      <linearGradient id="heroTrend" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="none"
                      stroke="url(#heroTrend)"
                      strokeWidth="3"
                      points="4,54 40,46 78,50 110,32 142,36 172,24 208,28 236,18"
                    />
                  </svg>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Errors", value: "14" },
                    { label: "Warnings", value: "36" },
                    { label: "Wins", value: "22" }
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/95">{stat.label}</div>
                      <div className="mt-2 text-lg font-semibold">{stat.value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/95">Priority queue</div>
                  <div className="mt-3 space-y-2 text-sm text-white/95">
                    {[
                      "Fix missing H1 on hero page",
                      "Compress large PNG assets",
                      "Resolve 12 redirect chains"
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <span className="h-2 w-2 rounded-full bg-violet-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        

        
        <section className="pb-14">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/95">The problem</p>
              <h2 className="mt-3 text-2xl font-semibold">SEO teams drown in noisy audits.</h2>
              <ul className="mt-4 space-y-3 text-sm text-white/95">
                <li>• Hundreds of issues, no prioritization.</li>
                <li>• Stakeholders need proof, not guesswork.</li>
                <li>• Fixes take too long to ship.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/95">The solution</p>
              <h2 className="mt-3 text-2xl font-semibold">RankyPulse turns audits into action.</h2>
              <ul className="mt-4 space-y-3 text-sm text-white/95">
                <li>• Prioritized fix plans with evidence.</li>
                <li>• Visual snapshots to align teams fast.</li>
                <li>• Reports built for fast approvals.</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="pb-14">
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/95">How it works</p>
            <h2 className="text-3xl font-semibold">From URL to fixes in minutes.</h2>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { title: "Run an audit", desc: "Drop in a URL and launch a full-site scan in seconds." },
              { title: "Review priorities", desc: "RankyPulse highlights the highest-impact fixes first." },
              { title: "Share and ship", desc: "Send clear, visual reports that speed up approvals." }
            ].map((step) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-lg font-semibold">{step.title}</div>
                <p className="mt-3 text-sm text-white/95">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="pb-14">
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/95">Core features</p>
            <h2 className="text-3xl font-semibold">Everything you need to move rankings.</h2>
            <p className="text-sm text-white/95">Every feature below includes a unique visual and a clear outcome.</p>
          </div>
          <div className="mt-8 grid gap-5">
            {[
              {
                title: "SEO Score",
                description: "Instant score + trendline so you see progress after every fix.",
                outcome: "Helps bloggers and businesses focus on the exact fixes that move rankings.",
                route: "/start",
                stats: ["92 score", "+12% lift", "7-day trend"],
                bullets: ["Health score", "Trendline", "Top issues"],
                visual: "score"
              },
              {
                title: "Run Audit",
                description: "Launch a full-site scan and surface issues in minutes.",
                outcome: "Freelancers can deliver audits fast without manual checklists.",
                route: "/start",
                stats: ["30s scan", "170+ checks", "PDF export"],
                bullets: ["Full crawl", "Issues list", "Fix cues"],
                visual: "run"
              },
              {
                title: "Fix Priorities",
                description: "Clear, ranked fix list so teams tackle what matters first.",
                outcome: "Business owners know what to fix first without guessing.",
                route: "/audit",
                stats: ["14 urgent", "36 warnings", "22 wins"],
                bullets: ["Priority queue", "Severity tags", "Quick wins"],
                visual: "priorities"
              },
              {
                title: "Rank Checker",
                description: "Track where you rank for key keywords and monitor progress.",
                outcome: "Agencies prove impact with clear movement over time.",
                route: "/rank",
                stats: ["128 keywords", "Avg 18.4", "+12% visibility"],
                bullets: ["Keyword list", "Position changes", "History"],
                visual: "rank"
              },
              {
                title: "Improve Page",
                description: "Actionable content plan with gaps, ideas, and next steps.",
                outcome: "Writers ship better content faster with a ready brief.",
                route: "/improve",
                stats: ["24 ideas", "7 gaps", "Impact 86"],
                bullets: ["Content gaps", "Brief outline", "Priority tasks"],
                visual: "improve"
              },
              {
                title: "Embed Widget",
                description: "Capture leads with a branded audit form on your site.",
                outcome: "Agencies turn every visitor into a qualified lead.",
                route: "/embed",
                stats: ["124 leads", "98% success", "Live feed"],
                bullets: ["Custom branding", "Webhook sync", "Auto alerts"],
                visual: "embed"
              },
              {
                title: "Leads Inbox",
                description: "Centralized lead management with statuses and exports.",
                outcome: "Sales teams close faster with a clear pipeline view.",
                route: "/leads",
                stats: ["New 38", "Contacted 19", "Won 7"],
                bullets: ["Status labels", "Lead scoring", "CSV export"],
                visual: "leads"
              }
            ].map((feature, idx) => (
              <div key={feature.title} className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-white/95">{feature.title}</div>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm text-white/95">{feature.description}</p>
                  <p className="mt-3 text-sm text-white/95">{feature.outcome}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {feature.stats.map((stat) => (
                      <span key={stat} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/95">
                        {stat}
                      </span>
                    ))}
                  </div>
                  <ul className="mt-4 grid gap-2 text-sm text-white/95">
                    {feature.bullets.map((point) => (
                      <li key={point} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-violet-400" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link to={feature.route} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-200 hover:text-white">
                    View {feature.title}
                    <span aria-hidden>→</span>
                  </Link>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-xs text-white/95">
                    <span>Feature snapshot</span>
                    <span className="rounded-full border border-white/10 px-2 py-1">Live</span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {feature.visual === "score" && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-white/95">SEO score gauge</div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="h-16 w-16 rounded-full" style={{ background: "conic-gradient(#a855f7 0 72%, rgba(255,255,255,0.1) 72% 100%)" }} />
                          <div>
                            <div className="text-xl font-semibold leading-none">92</div>
                            <div className="text-[11px] text-white/95">Healthy</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {feature.visual === "run" && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-white/95">Audit progress</div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                          <div className="h-1.5 w-4/5 rounded-full bg-violet-400" />
                        </div>
                        <div className="mt-2 grid gap-1.5 text-[12px] text-white/95">
                          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" />Crawling pages</div>
                          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" />Analyzing issues</div>
                          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" />Generating report</div>
                        </div>
                      </div>
                    )}
                    {feature.visual === "priorities" && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-white/95">Priority queue</div>
                        <div className="mt-3 space-y-2">
                          {["Fix missing H1", "Compress hero image", "Resolve redirects"].map((item) => (
                            <div key={item} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                              <span>{item}</span>
                              <span className="rounded-full bg-rose-500/20 px-2 py-1 text-[10px] uppercase">High</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {feature.visual === "rank" && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-white/95">Rank movement</div>
                        <svg viewBox="0 0 240 64" className="mt-3 h-16 w-full" aria-label="Rank trend">
                          <defs>
                            <linearGradient id={`featureTrend-${idx}`} x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#a855f7" />
                              <stop offset="100%" stopColor="#22d3ee" />
                            </linearGradient>
                          </defs>
                          <polyline fill="none" stroke={`url(#featureTrend-${idx})`} strokeWidth="3" points="10,76 60,70 120,58 180,52 230,46" />
                        </svg>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">#18 → #12</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">+6 spots</span>
                        </div>
                      </div>
                    )}
                    {feature.visual === "improve" && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-white/95">Content brief</div>
                        <div className="mt-3 space-y-2">
                          {["Add comparison section", "Include FAQ block", "Update meta description"].map((item) => (
                            <div key={item} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {feature.visual === "embed" && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-white/95">Lead funnel</div>
                        <div className="mt-3 space-y-2">
                          {[
                            { label: "Views", value: "1,240", width: "w-full" },
                            { label: "Starts", value: "610", width: "w-3/4" },
                            { label: "Leads", value: "124", width: "w-1/3" }
                          ].map((row) => (
                            <div key={row.label}>
                              <div className="flex items-center justify-between text-xs text-white/95">
                                <span>{row.label}</span>
                                <span>{row.value}</span>
                              </div>
                              <div className="mt-1 h-2 rounded-full bg-white/10">
                                <div className={`h-2 rounded-full bg-violet-400 ${row.width}`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {feature.visual === "leads" && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-white/95">Pipeline snapshot</div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          {["New", "Contacted", "Won"].map((stage) => (
                            <div key={stage} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center">
                              <div className="text-[10px] uppercase tracking-[0.2em] text-white/95">{stage}</div>
                              <div className="mt-2 text-sm font-semibold">{stage === "New" ? "38" : stage === "Contacted" ? "19" : "7"}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      {feature.stats.map((stat) => (
                        <div key={stat} className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/95">Metric</div>
                          <div className="mt-2 text-sm font-semibold text-white">{stat}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-14">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/95">Who it’s for</p>
            <h2 className="mt-3 text-2xl font-semibold">Built for the teams that need SEO wins now.</h2>
            <p className="mt-3 text-sm text-white/95">
              Each audience gets a tailored workflow with clear proof, faster fixes, and measurable impact.
            </p>
            <div className="mt-6 rp-marquee">
              <div className="rp-marquee-track">
                {[
                  {
                    title: "Bloggers & creators",
                    body: "Find content gaps fast, boost organic traffic, and publish with confidence.",
                    stat: "Avg +22% traffic lift",
                    image:
                      "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=240&q=80"
                  },
                  {
                    title: "Freelancers & consultants",
                    body: "Deliver client wins quickly with audit proof and prioritized fix plans.",
                    stat: "Ship fixes 2x faster",
                    image:
                      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=240&q=80"
                  },
                  {
                    title: "Small business owners",
                    body: "Focus on the few fixes that drive revenue and conversions.",
                    stat: "Top 3 issues first",
                    image:
                      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=240&q=80"
                  },
                  {
                    title: "Digital agencies",
                    body: "Standardize audits, prove impact, and scale reporting across clients.",
                    stat: "Client-ready reports",
                    image:
                      "https://images.unsplash.com/photo-1522071901873-411886a10004?auto=format&fit=crop&w=240&q=80"
                  },
                  {
                    title: "In-house teams",
                    body: "Align stakeholders and keep SEO work moving with clear priorities.",
                    stat: "1.8 days approval",
                    image:
                      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=240&q=80"
                  }
                ].map((item) => (
                  <div
                    key={item.title}
                    className="w-[320px] h-[320px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.32)] transition hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_22px_50px_rgba(0,0,0,0.38)]"
                  >
                    <div className="relative h-1/2 w-full">
                      <img
                        src={item.image}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover"
                        loading="lazy"
                        width="320"
                        height="160"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0616]/50 via-transparent to-transparent" />
                    </div>
                    <div className="h-1/2 p-5">
                      <div className="text-[15px] font-semibold text-white">{item.title}</div>
                      <p className="mt-2 text-[13px] leading-relaxed text-white/95">{item.body}</p>
                      <div className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/95">
                        {item.stat}
                      </div>
                    </div>
                  </div>
                ))}
                {[
                  {
                    title: "Bloggers & creators",
                    body: "Find content gaps fast, boost organic traffic, and publish with confidence.",
                    stat: "Avg +22% traffic lift",
                    image:
                      "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=240&q=80"
                  },
                  {
                    title: "Freelancers & consultants",
                    body: "Deliver client wins quickly with audit proof and prioritized fix plans.",
                    stat: "Ship fixes 2x faster",
                    image:
                      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=240&q=80"
                  },
                  {
                    title: "Small business owners",
                    body: "Focus on the few fixes that drive revenue and conversions.",
                    stat: "Top 3 issues first",
                    image:
                      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=240&q=80"
                  },
                  {
                    title: "Digital agencies",
                    body: "Standardize audits, prove impact, and scale reporting across clients.",
                    stat: "Client-ready reports",
                    image:
                      "https://images.unsplash.com/photo-1522071901873-411886a10004?auto=format&fit=crop&w=240&q=80"
                  },
                  {
                    title: "In-house teams",
                    body: "Align stakeholders and keep SEO work moving with clear priorities.",
                    stat: "1.8 days approval",
                    image:
                      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=240&q=80"
                  }
                ].map((item) => (
                  <div
                    key={`${item.title}-dup`}
                    className="w-[320px] h-[320px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.32)] transition hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_22px_50px_rgba(0,0,0,0.38)]"
                  >
                    <div className="relative h-1/2 w-full">
                      <img
                        src={item.image}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover"
                        loading="lazy"
                        width="320"
                        height="160"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0616]/50 via-transparent to-transparent" />
                    </div>
                    <div className="h-1/2 p-5">
                      <div className="text-[15px] font-semibold text-white">{item.title}</div>
                      <p className="mt-2 text-[13px] leading-relaxed text-white/95">{item.body}</p>
                      <div className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/95">
                        {item.stat}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-14">
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.35em] text-white/95">Trusted by growth teams</p>
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Real teams</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
                {[
                  { name: "Northwind", note: "SaaS", mono: "NW" },
                  { name: "Everlight", note: "Agency", mono: "EL" },
                  { name: "CloudPeak", note: "Ecommerce", mono: "CP" },
                  { name: "Blueglass", note: "Content", mono: "BG" },
                  { name: "SummitLabs", note: "Growth", mono: "SL" },
                  { name: "Pixelcraft", note: "Marketing", mono: "PC" }
                ].map((item) => (
                  <div key={item.name} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-white">
                      {item.mono}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-white">{item.name}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/95">{item.note}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Reports shared", value: "9.4k", note: "Client-ready exports" },
                  { label: "Avg approval time", value: "1.8 days", note: "Proof-first workflow" },
                  { label: "Fixes shipped", value: "41k", note: "High-impact wins" }
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-white/95">{stat.label}</div>
                    <div className="mt-2 text-xl font-semibold text-white">{stat.value}</div>
                    <div className="mt-1 text-[11px] text-white/95">{stat.note}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <p className="text-base leading-7 text-white/95">
                “RankyPulse gave us a crystal-clear fix list and the proof we needed to prioritize work with stakeholders.”
              </p>
              <div className="mt-4 text-sm font-semibold text-white">Lena Ortega</div>
              <div className="text-xs text-white/95">Director of Growth, Everlight</div>
            </div>
          </div>
        </section>


        <section id="pricing" className="pb-14">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:flex md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/95">Pricing</p>
              <h2 className="mt-2 text-2xl font-semibold">Simple plans for growing teams.</h2>
              <p className="mt-2 text-sm text-white/95">Upgrade anytime. Cancel anytime.</p>
            </div>
            <Link to="/pricing" className="mt-4 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(109,40,217,0.45)] hover:bg-violet-500 md:mt-0">
              See pricing
            </Link>
          </div>
        </section>

        <section className="pb-20">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/30 via-white/5 to-transparent p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <h2 className="text-3xl font-semibold">Ready to find your biggest SEO wins?</h2>
            <p className="mt-3 text-sm text-white/95">No credit card required • Results in under 60 seconds</p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link to="/start" className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(109,40,217,0.45)] hover:bg-violet-500">
                Run Free Audit
              </Link>
              <Link to="/shared" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:border-white/40 hover:bg-white/5">
                See a sample report
              </Link>
            </div>
          </div>
        </section>
        
      </div>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 text-sm text-white/95 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} RankyPulse</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/about" className="hover:text-white">About</Link>
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/about" className="hover:text-white">Support</Link>
            <Link to="/about" className="hover:text-white">Privacy</Link>
            <Link to="/about" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
      <CookieConsent />
    </main>
  );
}
