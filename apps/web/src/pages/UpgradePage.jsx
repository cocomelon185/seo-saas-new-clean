import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { IconArrowRight, IconBolt, IconReport } from "../components/Icons.jsx";
import { startSubscriptionCheckout } from "../lib/billingClient.js";
import { getAuthUser } from "../lib/authClient.js";

export default function UpgradePage() {
  const navigate = useNavigate();
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const authUser = getAuthUser();
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async (planId = "pro") => {
    if (!authUser?.email) {
      navigate(`/auth/signup?next=${encodeURIComponent("/upgrade")}&plan=${planId}`);
      return;
    }
    setCheckoutError("");
    setCheckoutLoading(true);
    await startSubscriptionCheckout({
      planId,
      billingPeriod: "monthly",
      source: "upgrade_page",
      onSuccess: () => navigate("/upgrade/success"),
      onError: (err) => {
        setCheckoutLoading(false);
        if (String(err?.message || "").toLowerCase().includes("closed")) return;
        setCheckoutError(String(err?.message || "Checkout failed."));
        navigate("/upgrade/failure");
      }
    });
    setCheckoutLoading(false);
  };

  return (
    <AppShell
      title="Upgrade to RankyPulse Pro"
      subtitle="Unlock automated audits, shareable reports, and premium SEO insights for every client."
      seoTitle="Upgrade to RankyPulse Pro | RankyPulse"
      seoDescription="Unlock automated audits, shareable reports, and premium SEO insights for every client."
      seoCanonical={`${base}/upgrade`}
      seoRobots="index,follow"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rp-card p-6">
          <h2 className="text-xl font-semibold text-[var(--rp-text-900)]">What you get</h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--rp-text-600)]">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                <IconReport size={14} />
              </span>
              Branded shareable reports for clients and teams.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <IconBolt size={14} />
              </span>
              Automated recommendations mapped to revenue impact.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <IconArrowRight size={14} />
              </span>
              Priority audits and export-ready summaries.
            </li>
          </ul>
          <div className="mt-6 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-sm text-[var(--rp-text-600)]">
            Most teams recoup their plan cost after the first client report.
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/pricing" className="rp-btn-primary"><IconArrowRight size={14} />See pricing</Link>
            <Link to="/audit" className="rp-btn-secondary"><IconArrowRight size={14} />Run a free audit</Link>
          </div>
        </div>

        <div className="rp-card p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--rp-text-500)]">Upgrade flow</p>
          <h3 className="mt-3 text-lg font-semibold text-[var(--rp-text-900)]">Choose a plan</h3>
          <p className="mt-2 rp-body-small">
            Select the plan that matches your audit volume and unlock premium visibility in minutes.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--rp-text-900)]">Growth</p>
                  <p className="text-xs text-[var(--rp-text-500)]">For consultants and solo founders</p>
                </div>
                <span className="text-sm text-[var(--rp-text-600)]">$49/mo</span>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--rp-orange-500)]/30 bg-[rgba(255,100,45,0.08)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--rp-text-900)]">Agency</p>
                  <p className="text-xs text-[var(--rp-text-500)]">For multi-client pipelines</p>
                </div>
                <span className="text-sm text-[var(--rp-text-600)]">$149/mo</span>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              type="button"
              className="rp-btn-primary w-full text-center"
              onClick={() => handleCheckout("pro")}
              disabled={checkoutLoading}
            >
              <IconArrowRight size={14} />
              {checkoutLoading ? "Starting..." : "Start 7-day trial"}
            </button>
            <div className="mt-2 text-center text-xs text-[var(--rp-text-500)]">
              Instant access to AI fixes, shareable reports, and weekly tracking after checkout.
            </div>
            {checkoutError && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {checkoutError}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
