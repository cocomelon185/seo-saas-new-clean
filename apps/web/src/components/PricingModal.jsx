import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowRight } from "./Icons.jsx";
import { track } from "../lib/eventsClient.js";
import { getAuthUser } from "../lib/authClient.js";
import { startSubscriptionCheckout } from "../lib/billingClient.js";

export default function PricingModal({ open, onClose, onSelectPlan }) {
  const [billing, setBilling] = useState("monthly");
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const modalRef = useRef(null);
  const formatInr = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const plans = useMemo(() => {
    const common = {
      starter: {
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
        badges: ["Diagnosis"],
        locked: [
          "AI fixes + one-click apply",
          "AI content briefs + intent",
          "Weekly tracking reports",
          "Competitor comparison",
          "White‑label PDF exports"
        ],
        emphasis: "quiet",
        cta: "Start 7-day trial",
      },
      solo: {
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
          "Audit history + re-runs",
          "15 websites tracked",
        ],
        badges: ["Solution"],
        locked: [],
        emphasis: "primary",
        cta: "Start 7-day trial",
      },
      agency: {
        key: "teams",
        name: "Teams",
        badge: "For growing teams",
        monthly: 4999,
        yearly: 44990,
        bullets: [
          "Everything in Pro",
          "Multiple projects",
          "Agency-ready reporting",
          "Team collaboration",
          "Priority processing",
          "40 websites tracked",
        ],
        badges: ["Solution"],
        locked: [],
        emphasis: "quiet",
        cta: "Start 7-day trial",
      },
    };
    return [common.starter, common.solo, common.agency];
  }, []);

  const authUser = getAuthUser();
  const isAdmin = authUser?.role === "admin";
  useEffect(() => {
    try { track("pricing_modal_open", {}); } catch {}
  }, []);
  useEffect(() => {
    if (!open) return;
    if (typeof document === "undefined") return;

    const previouslyFocused = document.activeElement;
    const getFocusable = () => {
      if (!modalRef.current) return [];
      const selectors = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])"
      ];
      return Array.from(modalRef.current.querySelectorAll(selectors.join(",")));
    };

    const focusFirst = () => {
      const focusables = getFocusable();
      const target = focusables[0] || modalRef.current;
      if (target && typeof target.focus === "function") target.focus();
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = getFocusable();
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !modalRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const raf = requestAnimationFrame(focusFirst);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [open, onClose]);
  if (!open) return null;

  const price = (p) => (billing === "yearly" ? p.yearly : p.monthly);
  const suffix = billing === "yearly" ? "/ mo billed annually" : "/ month";
  const saveLabel = billing === "yearly" ? "25% Off" : "";

  return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <div
        ref={modalRef}
        tabIndex={-1}
        className="rp-card w-full max-w-5xl overflow-hidden"
      >
        <div className="border-b border-[var(--rp-border)] px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xl font-semibold text-[var(--rp-text-900)]">Unlock the Full Fix Plan</div>
              <div className="mt-2 text-sm text-[var(--rp-text-600)]">
                Get prioritized SEO fixes, examples, and content guidance you can act on immediately.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2 text-xs text-[var(--rp-text-500)]">
                <button
                  type="button"
                  onClick={() => setBilling("monthly")}
                  className={[
                    "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
                    billing === "monthly"
                      ? "border-[var(--rp-indigo-700)] bg-[var(--rp-indigo-700)] text-white shadow-sm"
                      : "border-[var(--rp-border)] bg-white text-[var(--rp-text-600)] hover:border-[var(--rp-indigo-700)]/40"
                  ].join(" ")}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("yearly")}
                  className={[
                    "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
                    billing === "yearly"
                      ? "border-[var(--rp-indigo-700)] bg-[var(--rp-indigo-700)] text-white shadow-sm"
                      : "border-[var(--rp-border)] bg-white text-[var(--rp-text-600)] hover:border-[var(--rp-indigo-700)]/40"
                  ].join(" ")}
                >
                  Annual
                </button>
              </div>
              {saveLabel ? (
                <div className="rounded-full bg-[#FFE7A8] px-3 py-1 text-[11px] font-semibold text-[#5A3A00]">
                  {saveLabel}
                </div>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[var(--rp-border)] px-3 py-1 text-xs font-semibold text-[var(--rp-text-500)] hover:text-[var(--rp-text-700)]"
                aria-label="Close"
              >
                x
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((p) => {
              const isPrimary = p.emphasis === "primary";
              return (
                <div
                  key={p.key}
                  className={[
                    "rounded-2xl border p-5",
                    isPrimary
                      ? "border-[var(--rp-orange-500)]/40 bg-[rgba(255,100,45,0.08)] shadow-[0_20px_40px_rgba(255,100,45,0.16)]"
                      : "border-[var(--rp-border)] bg-white"
                  ].join(" ")}
                >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-base font-semibold text-[var(--rp-text-900)]">{p.name}</div>
                  <div className="text-xs text-[var(--rp-text-500)]">{p.badge}</div>
                </div>
                {Array.isArray(p.badges) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.badges.map((b) => (
                      <span
                        key={b}
                        className={[
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          b === "Solution"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        ].join(" ")}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}

                  <div className="mt-3 flex items-baseline gap-2">
                    <div className="text-3xl font-semibold text-[var(--rp-text-900)]">{formatInr(price(p))}</div>
                    <div className="text-xs text-[var(--rp-text-500)]">{suffix}</div>
                  </div>
                  {billing === "yearly" ? (
                    <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                      <span className="line-through opacity-60">{formatInr(p.monthly)}</span> monthly
                    </div>
                  ) : null}

                  <div className="mt-4 text-xs text-[var(--rp-text-600)]">
                    <div className="font-semibold text-[var(--rp-text-700)]">Includes</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {p.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  {isAdmin && p.key !== "starter" && (
                    <div className="mt-3 text-xs text-[var(--rp-text-500)]">
                      <div className="font-semibold text-[var(--rp-text-600)]">Team benefits</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>Admin controls for verification + audits</li>
                        <li>Invite teammates with roles</li>
                        <li>Centralized upgrade management</li>
                      </ul>
                    </div>
                  )}

                  {p.locked?.length ? (
                    <div className="mt-3 text-xs text-[var(--rp-text-500)]">
                      <div className="font-semibold text-[var(--rp-text-600)]">Locked</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {p.locked.map((b) => (
                          <li key={b}>x {b}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={async () => {
                      setCheckoutError("");
                      try { track("pricing_plan_select", { plan: p.key, billing }); } catch {}
                      if (!authUser?.email) {
                        navigate(`/auth/signup?next=${encodeURIComponent("/pricing")}&plan=${p.key}`);
                        return;
                      }
                      setActivePlan(p.key);
                      await startSubscriptionCheckout({
                        planId: p.key,
                        billingPeriod: billing,
                        source: "pricing_modal",
                        onSuccess: () => navigate("/upgrade/success"),
                        onError: (err) => {
                          if (String(err?.message || "").toLowerCase().includes("closed")) return;
                          setCheckoutError(String(err?.message || "Checkout failed."));
                          navigate("/upgrade/failure");
                        }
                      });
                      setActivePlan("");
                      onSelectPlan?.({ plan: p.key, billing });
                    }}
                    className={[
                      "mt-4 w-full text-sm",
                      isPrimary ? "rp-btn-primary" : "rp-btn-secondary"
                    ].join(" ")}
                    disabled={activePlan === p.key}
                  >
                    <IconArrowRight size={14} />
                    {activePlan === p.key ? "Starting..." : p.cta}
                  </button>

                  <div className="mt-2 text-center text-xs text-[var(--rp-text-500)]">
                    {p.key === "starter"
                      ? "Instant access to full fix plans, proof snapshots, and quick wins after checkout."
                      : p.key === "pro"
                      ? "Instant access to AI fixes, briefs, and weekly tracking after checkout."
                      : "Instant access to team reporting, collaboration, and priority processing after checkout."}
                  </div>
                </div>
              );
            })}
          </div>

          {checkoutError && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              {checkoutError}
            </div>
          )}
          <div className="mt-4 text-xs text-[var(--rp-text-500)]">
            RankyPulse focuses on execution and clarity - not keyword databases or SEO bloat. Upgrade, downgrade, or cancel anytime.
          </div>
        </div>
      </div>
    </div>
  );
}
