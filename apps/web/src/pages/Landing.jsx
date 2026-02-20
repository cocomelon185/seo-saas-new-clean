import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/rankypulse-logo.svg";
import landingScreenshot from "../assets/img/landing.jpg";
import profilePhoto from "../assets/img/profile.jpg";
import CookieConsent from "../components/CookieConsent.jsx";
import Seo from "../components/Seo.jsx";
import { clearAuthSession, getAuthDisplayName, getAuthToken, getAuthUser } from "../lib/authClient.js";
import { getSignupAuditHref } from "../lib/auditGate.js";
import { track } from "../lib/eventsClient.js";

const HERO_POINTS = [
  "Prioritized fixes, not a wall of errors",
  "Simple explanations anyone can follow",
  "Client-ready reports in one click"
];

const KPIS = [
  { label: "Avg. SEO health", value: "84", note: "Across active projects" },
  { label: "Issues prioritized", value: "142k", note: "Ranked by impact" },
  { label: "Quick wins found", value: "16", note: "Per audit avg." },
  { label: "Estimated lift", value: "+27%", note: "Top-fix potential" }
];

const STEP_CARDS = [
  {
    title: "1. Run audit",
    desc: "Paste any URL and start a full SEO scan in under a minute.",
    stat: "~30s setup"
  },
  {
    title: "2. See top fixes",
    desc: "Get a clean, ranked fix list with business impact and urgency.",
    stat: "Top 3 first"
  },
  {
    title: "3. Ship improvements",
    desc: "Copy simple steps or code and push updates into your workflow.",
    stat: "1-click copy"
  }
];

const FEATURE_ROWS = [
  {
    title: "Fix-first dashboard",
    desc: "Surface the highest-impact issues first so teams stop guessing.",
    badge: "Most used"
  },
  {
    title: "Plain-English guidance",
    desc: "Beginner + expert explanations for every issue.",
    badge: "Clear guidance"
  },
  {
    title: "Visual issue proof",
    desc: "Show what was detected on-page so users trust every recommendation.",
    badge: "Trust builder"
  },
  {
    title: "Copy-ready fixes",
    desc: "Get exact fix steps and optional code snippets when needed.",
    badge: "Actionable"
  },
  {
    title: "Shareable reports",
    desc: "Export and send reports stakeholders can understand quickly.",
    badge: "Client-ready"
  },
  {
    title: "Ongoing monitoring",
    desc: "Track score changes and new issues over time.",
    badge: "Retention"
  }
];

export default function Landing() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const [authUser, setAuthUser] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [auditUrl, setAuditUrl] = useState("https://www.example.com/");
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [isHeroInputActive, setIsHeroInputActive] = useState(false);
  const footerRef = useRef(null);

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

  const goTo = (path) => {
    if (typeof window !== "undefined") {
      window.location.assign(path);
    }
  };

  const handleAuditSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const url = String(fd.get("url") || auditUrl || "").trim();
    if (!url) return;
    track("run_audit_click", { source: "landing_form", has_url: true });
    goTo(getSignupAuditHref(url));
  };

  const handlePreviewRun = () => {
    const url = String(auditUrl || "").trim();
    if (!url) return;
    track("run_audit_click", { source: "landing_preview", has_url: true });
    goTo(getSignupAuditHref(url));
  };
  const signupAuditHref = getSignupAuditHref(auditUrl);

  useEffect(() => {
    const onScroll = () => {
      if (typeof window === "undefined") return;
      const desktop = window.innerWidth >= 768;
      const passedThreshold = window.scrollY > window.innerHeight * 0.35;
      setShowStickyCta(desktop && passedThreshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!footerRef.current || typeof window === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        setFooterVisible(isVisible);
      },
      { threshold: 0.05 }
    );
    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "RankyPulse",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: `${base}/`,
      description: "RankyPulse helps you make clear SEO decisions with fast audits, page reports, and actionable recommendations.",
      brand: {
        "@type": "Brand",
        name: "RankyPulse"
      }
    }
  ];

  return (
    <main className="min-h-screen bg-[#f7f3ff] text-[#20123a] [background-image:radial-gradient(circle_at_top,rgba(109,40,217,0.14),transparent_44%)]">
      <Seo
        title="RankyPulse — Clear SEO decisions"
        description="RankyPulse helps you make clear SEO decisions with fast audits, page reports, and actionable recommendations."
        canonical={`${base}/`}
        jsonLd={structuredData}
      />
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>

      <header className="sticky top-0 z-50 border-b border-[#e6dbfb] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-4 py-4 md:px-6 xl:px-8">
          <Link to="/" className="flex items-center gap-3 text-base font-semibold tracking-tight text-[#24133f]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1e8ff]">
              <img src={logo} alt="" aria-hidden="true" className="h-6 w-6" width="24" height="24" />
            </span>
            RankyPulse
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[#4d3b74] md:flex">
            <a href="#how-it-works" className="hover:text-[#2b174f]">How it works</a>
            <a href="#features" className="hover:text-[#2b174f]">Features</a>
            <Link to="/pricing" className="hover:text-[#2b174f]">Pricing</Link>
            <Link to="/about" className="hover:text-[#2b174f]">Resources</Link>
          </nav>
          <div className="relative z-[70] flex items-center gap-2 pointer-events-auto">
            {authed ? (
              <>
                <button
                  type="button"
                  onClick={() => goTo("/audit")}
                  className="rounded-xl border border-[#dac8ff] bg-white px-4 py-2 text-xs font-semibold text-[#3d2b62] hover:border-[#bfa0ff]"
                >
                  {getAuthDisplayName(authUser) || "My account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearAuthSession();
                    setAuthed(false);
                    goTo("/");
                  }}
                  className="rounded-xl border border-[#dac8ff] bg-white px-4 py-2 text-xs font-semibold text-[#3d2b62] hover:border-[#bfa0ff]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/signin"
                  className="rounded-xl border border-[#dac8ff] bg-white px-4 py-2 text-xs font-semibold text-[#3d2b62] hover:border-[#bfa0ff]"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth/signup"
                  className="rounded-xl bg-[#6d28d9] px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_26px_rgba(109,40,217,0.3)] hover:bg-[#5b21b6]"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div id="main" className="mx-auto w-full max-w-[1360px] px-4 pb-20 pt-12 md:px-6 xl:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#decfff] bg-white px-3 py-1 text-xs font-semibold text-[#5e3e9f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
              Premium SEO audit workspace
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-[#1f1235] md:text-5xl">
              The cleanest way to turn SEO issues into shipped fixes.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#4f3c79]">
              Run one audit, see top priorities, and ship fixes fast with plain-English guidance.
            </p>

            <form onSubmit={handleAuditSubmit} className="mt-6 rounded-2xl border border-[#e3d5ff] bg-white p-3 shadow-[0_14px_34px_rgba(44,20,89,0.08)]">
              <label className="sr-only" htmlFor="home-audit-url">Website URL</label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  id="home-audit-url"
                  type="text"
                  name="url"
                  placeholder="https://example.com"
                  value={auditUrl}
                  onFocus={() => setIsHeroInputActive(true)}
                  onBlur={() => setIsHeroInputActive(false)}
                  onChange={(e) => {
                    setIsHeroInputActive(true);
                    setAuditUrl(e.target.value);
                  }}
                  className="min-w-[220px] flex-1 rounded-xl border border-[#e5dcfb] bg-[#fdfcff] px-3 py-3 text-sm text-[#28184b] placeholder-[#8874b5] focus:border-[#b794ff] focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  title="Run a free audit"
                  className="rounded-xl bg-[#6d28d9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5b21b6]"
                >
                  Run Free Audit
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <Link to="/sample-report" className="rounded-xl border border-[#dac8ff] bg-white px-4 py-2 font-semibold text-[#4b2f83] hover:border-[#bfa0ff]">
                See sample report
              </Link>
              <span className="text-[#7a66a7]">Free account required</span>
              <span className="text-[#7a66a7]">No credit card required</span>
              <span className="text-[#7a66a7]">•</span>
              <span className="text-[#7a66a7]">Results in under 60 seconds</span>
            </div>

            <div className="mt-4 rounded-2xl border border-[#dfd2ff] bg-white p-4 shadow-[0_10px_24px_rgba(44,20,89,0.06)]">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7357b3]">How this helps your business</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg bg-[#f7f1ff] px-3 py-2 text-xs font-semibold text-[#4b2f83]">Faster issue resolution</div>
                <div className="rounded-lg bg-[#f7f1ff] px-3 py-2 text-xs font-semibold text-[#4b2f83]">Stronger SEO visibility</div>
                <div className="rounded-lg bg-[#f7f1ff] px-3 py-2 text-xs font-semibold text-[#4b2f83]">Clear client reporting</div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <div className="overflow-hidden rounded-2xl border border-[#e3d5ff] bg-white">
                <img
                  src={landingScreenshot}
                  alt="RankyPulse audit dashboard preview"
                  className="h-40 w-full object-cover md:h-48"
                  loading="lazy"
                />
                <div className="border-t border-[#eee4ff] bg-[#fcf9ff] px-3 py-2 text-xs text-[#5a448c]">
                  Live audit dashboard preview
                </div>
              </div>
              <div className="rounded-2xl border border-[#e3d5ff] bg-white p-4">
                <div className="flex items-center gap-3">
                  <img src={profilePhoto} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                  <div>
                    <div className="text-sm font-semibold text-[#261445]">Sarah M., Growth Lead</div>
                    <div className="text-xs text-[#735ea5]">SaaS marketing team</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#4f3c79]">
                  “RankyPulse helped us prioritize the right fixes and improve visibility within one sprint.”
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-[#4f3c79]">
              {HERO_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#7c3aed]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-[#e3d5ff] bg-white p-6 shadow-[0_22px_42px_rgba(45,18,91,0.12)]">
            <div className="flex items-center justify-between text-sm text-[#6a55a0]">
              <span>Live preview</span>
              <span className="rounded-full border border-[#e2d3ff] bg-[#f8f3ff] px-2 py-1 text-xs font-semibold">~20s</span>
            </div>

            <div className="mt-4 rounded-2xl border border-[#ede3ff] bg-[#faf7ff] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7357b3]">Audit setup</div>
              <div className="mt-3 text-sm text-[#4f3c79]">1. Enter URL&nbsp;&nbsp;2. Run audit&nbsp;&nbsp;3. Fix first issue</div>
              <label className="sr-only" htmlFor="live-preview-url">Live preview URL</label>
              <input
                id="live-preview-url"
                type="text"
                value={auditUrl}
                onChange={(e) => setAuditUrl(e.target.value)}
                placeholder="https://www.example.com/"
                className="mt-3 w-full rounded-xl border border-[#e6dbfb] bg-white px-3 py-3 text-[#1f1235] focus:border-[#b794ff] focus:outline-none"
              />
              <button
                type="button"
                onClick={handlePreviewRun}
                className="mt-3 w-full rounded-xl bg-[#6d28d9] px-4 py-3 text-sm font-semibold text-white hover:bg-[#5b21b6]"
              >
                Run SEO Audit
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Score", value: "49" },
                { label: "Issues", value: "2" },
                { label: "Fix now", value: "1" }
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-[#e8ddff] bg-[#fcf9ff] p-3">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#7f68af]">{stat.label}</div>
                  <div className="mt-2 text-xl font-semibold text-[#2a1648]">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#e4d7fe] bg-white p-4 shadow-[0_8px_20px_rgba(45,18,91,0.06)]">
              <div className="text-xs uppercase tracking-[0.18em] text-[#7863aa]">{item.label}</div>
              <div className="mt-2 text-3xl font-semibold text-[#24123f]">{item.value}</div>
              <div className="mt-1 text-xs text-[#7c68a8]">{item.note}</div>
            </div>
          ))}
        </section>
        <section className="mt-4 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[#e4d7fe] bg-white p-4 shadow-[0_8px_20px_rgba(45,18,91,0.06)]">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7863aa]">7-audit trend preview</div>
            <div className="mt-2 h-20 rounded-xl bg-[linear-gradient(180deg,#ecfeff_0%,#ffffff_100%)] p-3">
              <svg viewBox="0 0 220 64" className="h-full w-full" aria-hidden="true">
                <path d="M8 50 L36 44 L64 46 L92 34 L120 28 L148 22 L176 16 L208 12" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="rounded-2xl border border-[#e4d7fe] bg-white p-4 shadow-[0_8px_20px_rgba(45,18,91,0.06)]">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7863aa]">First-fix confidence</div>
            <div className="mt-2 flex h-[125px] items-center justify-center rounded-xl bg-[linear-gradient(180deg,#f5efff_0%,#ffffff_100%)]">
              <div className="text-center">
                <div className="text-3xl font-semibold text-[#2a1648]">78%</div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7f68af]">Confidence</div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#7058a8]">How it works</p>
              <h2 className="mt-2 text-3xl font-semibold text-[#1f1235]">From URL to action in three steps</h2>
            </div>
            <Link to="/start" className="rounded-xl border border-[#dac8ff] bg-white px-4 py-2 text-sm font-semibold text-[#4b2f83] hover:border-[#bfa0ff]">
              Open guided flow
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {STEP_CARDS.map((step) => (
              <div key={step.title} className="rounded-2xl border border-[#e3d5ff] bg-white p-5">
                <div className="text-lg font-semibold text-[#24123f]">{step.title}</div>
                <p className="mt-2 text-sm leading-6 text-[#52407d]">{step.desc}</p>
                <div className="mt-4 inline-flex rounded-full border border-[#d9c7ff] bg-[#f5efff] px-3 py-1 text-xs font-semibold text-[#643fb0]">
                  {step.stat}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mt-14">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7058a8]">Core features</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#1f1235]">Simple UI. Serious SEO outcomes.</h2>
          <p className="mt-2 text-sm text-[#52407d]">Everything below is designed to help users understand the problem and fix it fast.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURE_ROWS.map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#e3d5ff] bg-white p-5">
                <div className="inline-flex rounded-full border border-[#d9c7ff] bg-[#f5efff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#663fb1]">
                  {item.badge}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[#24123f]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#52407d]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7058a8]">Use cases and comparisons</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#1f1235]">Launch-ready pages for high-intent visitors</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["/use-cases/saas-landing-audit", "SaaS landing audit"],
              ["/use-cases/agency-audit-workflow", "Agency workflow"],
              ["/use-cases/ecommerce-seo-audit", "Ecommerce SEO audit"],
              ["/use-cases/local-business-seo-audit", "Local business SEO audit"],
              ["/compare/rankypulse-vs-ahrefs", "RankyPulse vs Ahrefs"],
              ["/compare/rankypulse-vs-semrush", "RankyPulse vs Semrush"]
            ].map(([href, label]) => (
              <Link
                key={href}
                to={href}
                className="rounded-2xl border border-[#e3d5ff] bg-white p-5 text-sm font-semibold text-[#3f286f] hover:border-[#c8b1ff]"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="rounded-3xl border border-[#dccbff] bg-gradient-to-br from-[#ffffff] via-[#f7f1ff] to-[#efe5ff] p-8 text-center shadow-[0_20px_44px_rgba(48,19,98,0.1)]">
            <h2 className="text-3xl font-semibold text-[#1f1235]">Give your customers clarity in one scan</h2>
            <p className="mt-3 text-sm text-[#4f3c79]">Run a live audit, show top issues first, and provide simple fixes they can ship right away.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to={signupAuditHref} className="rounded-xl bg-[#6d28d9] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5b21b6]">
                Run Free Audit
              </Link>
              <Link to="/pricing" className="rounded-xl border border-[#d8c5ff] bg-white px-5 py-3 text-sm font-semibold text-[#4b2f83] hover:border-[#bfa0ff]">
                See pricing
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className={`fixed bottom-6 right-6 z-40 hidden md:flex transition-all duration-200 ${
        showStickyCta && !footerVisible && !isHeroInputActive
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-3 opacity-0 pointer-events-none"
      }`}>
        <button
          type="button"
          onClick={() => goTo(signupAuditHref)}
          className="rounded-full border border-[#5b21b6] bg-[#6d28d9] px-4 py-2 text-xs font-semibold text-white shadow-[0_16px_32px_rgba(109,40,217,0.35)] hover:bg-[#5b21b6]"
        >
          Run Free Audit
        </button>
      </div>

      <footer ref={footerRef} className="border-t border-[#e6dbfb] py-10">
        <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-4 px-4 text-sm text-[#6d5a99] md:flex-row md:items-center md:justify-between md:px-6 xl:px-8">
          <span>© {new Date().getFullYear()} RankyPulse</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/about" className="hover:text-[#2b174f]">About</Link>
            <Link to="/pricing" className="hover:text-[#2b174f]">Pricing</Link>
            <Link to="/faq" className="hover:text-[#2b174f]">FAQ</Link>
            <Link to="/contact" className="hover:text-[#2b174f]">Contact</Link>
            <Link to="/privacy" className="hover:text-[#2b174f]">Privacy</Link>
            <Link to="/terms" className="hover:text-[#2b174f]">Terms</Link>
          </div>
        </div>
      </footer>

      <CookieConsent />
    </main>
  );
}
