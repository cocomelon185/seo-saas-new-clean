import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PricingModal from "../components/PricingModal.jsx";
import AppShell from "../components/AppShell.jsx";
import { IconArrowRight } from "../components/Icons.jsx";
import { getAuthUser } from "../lib/authClient.js";
import { startSubscriptionCheckout } from "../lib/billingClient.js";

export default function PricingPage() {
  const isServer = typeof window === "undefined";
  const [open, setOpen] = useState(false);
  const [billing, setBilling] = useState("monthly");
  const [checkoutError, setCheckoutError] = useState("");
  const [activePlan, setActivePlan] = useState("");
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const formatInr = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const canShowModal = useMemo(() => !isServer, [isServer]);
  const plans = [
    {
      key: "starter",
      name: "Starter",
      badge: "For new growth teams",
      monthly: 999,
      yearly: 8990,
      bullets: [
        "AI audit + fix priorities",
        "Visual proof snapshots",
        "Quick wins summary",
        "5 websites tracked",
      ],
      cta: "Start 7-day trial"
    },
    {
      key: "pro",
      name: "Pro",
      badge: "Most Popular",
      monthly: 2449,
      yearly: 22490,
      bullets: [
        "Everything in Starter",
        "AI fixes + push to CMS",
        "AI content briefs + intent",
        "Weekly tracking reports",
        "15 websites tracked",
      ],
      cta: "Start 7-day trial",
      highlight: true
    },
    {
      key: "teams",
      name: "Teams",
      badge: "For growing teams",
      monthly: 4999,
      yearly: 44990,
      bullets: [
        "Everything in Pro",
        "Agency-ready reporting",
        "Team collaboration",
        "Priority processing",
        "40 websites tracked",
      ],
      cta: "Start 7-day trial"
    }
  ];
  const comparisonRows = [
    { label: "Websites to monitor", starter: "5", pro: "15", teams: "40" },
    { label: "AI audit + fix priorities", starter: "Yes", pro: "Yes", teams: "Yes" },
    { label: "Weekly tracking reports", starter: "Basic", pro: "Advanced", teams: "Advanced" },
    { label: "AI content briefs", starter: "—", pro: "Yes", teams: "Yes" },
    { label: "Competitor comparison", starter: "—", pro: "Yes", teams: "Yes" },
    { label: "White‑label exports", starter: "—", pro: "Yes", teams: "Yes" },
    { label: "Team seats", starter: "1", pro: "3", teams: "10" },
    { label: "API access", starter: "—", pro: "—", teams: "Yes" },
  ];

  const handleCheckout = async (planKey) => {
    setCheckoutError("");
    if (!authUser?.email) {
      navigate(`/auth/signup?next=${encodeURIComponent("/pricing")}&plan=${planKey}`);
      return;
    }
    setActivePlan(planKey);
    await startSubscriptionCheckout({
      planId: planKey,
      billingPeriod: billing,
      source: "pricing",
      onSuccess: () => navigate("/upgrade/success"),
      onError: (err) => {
        setActivePlan("");
        if (String(err?.message || "").toLowerCase().includes("closed")) return;
        setCheckoutError(String(err?.message || "Checkout failed."));
        navigate("/upgrade/failure");
      }
    });
    setActivePlan("");
  };

  return (
    <AppShell
      title="Pricing"
      subtitle="Simple pricing for clear SEO decisions. Unlock full fix plans, examples, content briefs, and audit history."
    >
      <div className="mt-2">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--rp-text-500)]">Premium pricing</p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--rp-text-900)]">
            Pick the plan that matches your growth stage.
          </h2>
          <p className="mt-3 text-sm text-[var(--rp-text-600)]">
            Start with a 7-day trial, then keep full access with monthly or annual billing. Cancel anytime.
          </p>
        </div>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--rp-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--rp-text-700)] shadow-sm">
          <span className="rounded-full bg-[#FFE7A8] px-2 py-1 text-[10px] font-semibold text-[#5A3A00]">
            Save 25%
          </span>
          Switch to annual billing and keep 25% off every month.
        </div>
        <div className="rp-card p-6 w-full">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="rp-section-title">Choose your plan</div>
              <p className="mt-2 text-sm text-[var(--rp-text-600)]">
                Simple, premium pricing for clear SEO decisions. No free plan after trial.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[var(--rp-border)] bg-white p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={[
                "rounded-full px-4 py-1.5 transition",
                billing === "monthly"
                  ? "bg-[var(--rp-indigo-700)] text-white shadow-sm"
                  : "text-[var(--rp-text-600)] hover:text-[var(--rp-text-800)]"
              ].join(" ")}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={[
                "rounded-full px-4 py-1.5 transition",
                billing === "yearly"
                  ? "bg-[var(--rp-indigo-700)] text-white shadow-sm"
                  : "text-[var(--rp-text-600)] hover:text-[var(--rp-text-800)]"
              ].join(" ")}
            >
              Annual
            </button>
            {billing === "yearly" ? (
              <span className="rounded-full bg-[#FFE7A8] px-2 py-1 text-[10px] font-semibold text-[#5A3A00]">
                25% Off
              </span>
            ) : null}
          </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {plans.map((plan) => {
              const price = billing === "yearly" ? plan.yearly : plan.monthly;
              const suffix = billing === "yearly" ? "/ mo billed annually" : "/ month";
              return (
              <div
                key={plan.key}
                className={[
                  "rounded-2xl border p-5",
                  plan.highlight
                    ? "border-[var(--rp-indigo-700)]/40 bg-[rgba(109,40,217,0.06)] shadow-[0_24px_48px_rgba(91,33,182,0.16)]"
                    : "border-[var(--rp-border)] bg-white"
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-[var(--rp-text-900)]">{plan.name}</div>
                  <div className="text-xs text-[var(--rp-text-500)]">{plan.badge}</div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <div className="text-3xl font-semibold text-[var(--rp-text-900)]">{formatInr(price)}</div>
                  <div className="text-xs text-[var(--rp-text-500)]">{suffix}</div>
                </div>
                {billing === "yearly" ? (
                  <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                    <span className="line-through opacity-60">{formatInr(plan.monthly)}</span> monthly
                  </div>
                ) : null}
                <ul className="mt-4 space-y-2 text-sm text-[var(--rp-text-600)]">
                  {plan.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--rp-indigo-700)]/10 text-[10px] text-[var(--rp-indigo-700)]">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  className="rp-btn-primary mt-5 w-full text-sm"
                  onClick={() => handleCheckout(plan.key)}
                  disabled={activePlan === plan.key}
                >
                  <IconArrowRight size={14} />
                  {activePlan === plan.key ? "Starting..." : plan.cta}
                </button>
                <div className="mt-2 text-center text-xs text-[var(--rp-text-500)]">
                  {plan.key === "starter"
                    ? "Instant access to fix plans, proof snapshots, and quick wins after checkout."
                    : plan.key === "pro"
                    ? "Instant access to AI fixes, briefs, and weekly tracking after checkout."
                    : "Instant access to team reporting, collaboration, and priority processing after checkout."}
                </div>
                <button
                  className="mt-3 w-full text-xs font-semibold text-[var(--rp-indigo-700)] underline"
                  onClick={() => setOpen(true)}
                >
                  See full plan details
                </button>
              </div>
            );
          })}
          </div>
          {checkoutError && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              {checkoutError}
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-4 py-3 text-sm text-[var(--rp-text-600)]">
            <span>Prefer Google? Continue in one click.</span>
            <a
              href="/auth/signup?provider=google"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--rp-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--rp-text-700)] shadow-sm hover:border-[var(--rp-indigo-700)]/40"
            >
              Continue with Google
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 rp-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="rp-section-title">Compare plans</div>
            <p className="mt-2 rp-body-small">
              See exactly what each plan includes so teams can pick with confidence.
            </p>
          </div>
          <button className="rp-btn-secondary text-sm" onClick={() => setOpen(true)}>
            View plans
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--rp-border)] text-[11px] uppercase tracking-[0.22em] text-[var(--rp-text-500)]">
                <th className="py-3 pr-4">Feature</th>
                <th className="py-3 pr-4 text-[var(--rp-text-700)]">Starter</th>
                <th className="py-3 pr-4 text-[var(--rp-text-700)]">Pro</th>
                <th className="py-3 text-[var(--rp-text-700)]">Teams</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-b border-[var(--rp-border)]/80">
                  <td className="py-4 pr-4 font-medium text-[var(--rp-text-800)]">{row.label}</td>
                  <td className="py-4 pr-4 text-[var(--rp-text-700)]">{row.starter}</td>
                  <td className="py-4 pr-4 text-[var(--rp-text-700)]">{row.pro}</td>
                  <td className="py-4 text-[var(--rp-text-700)]">{row.teams}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canShowModal ? (
        <PricingModal
          open={open}
          onClose={() => setOpen(false)}
          onSelectPlan={(selection) => {
            setOpen(false);
            handleCheckout(selection?.plan || "pro");
          }}
        />
      ) : null}
    </AppShell>
  );
}
