import React, { useMemo, useState } from "react";

export default function PricingModal({ open, onClose, onSelectPlan }) {
  const [billing, setBilling] = useState("yearly");

  const plans = useMemo(() => {
    const common = {
      starter: {
        key: "starter",
        name: "Starter",
        badge: "Try RankyPulse on real pages",
        monthly: 9.99,
        yearly: 99,
        bullets: [
          "5 page audits / month",
          "SEO score",
          "High-priority issues only",
          "Limited explanations",
        ],
        locked: ["Content briefs", "Example fixes", "Audit history"],
        emphasis: "quiet",
        cta: "Try Starter",
      },
      solo: {
        key: "solo",
        name: "Solo",
        badge: "Most Popular",
        monthly: 29,
        yearly: 290,
        bullets: [
          "30 page audits / month",
          "Full priority fix plans",
          "Content briefs",
          "Example fixes",
          "Audit history",
          "Re-run audits",
          "Client-safe reports",
        ],
        locked: [],
        emphasis: "primary",
        cta: "Unlock Full Fix Plan",
      },
      agency: {
        key: "agency",
        name: "Agency",
        badge: "For consultants & small teams",
        monthly: 59,
        yearly: 590,
        bullets: [
          "150 page audits / month",
          "Everything in Solo",
          "Multiple projects",
          "Shareable reports",
          "Priority processing",
        ],
        locked: [],
        emphasis: "quiet",
        cta: "Start Agency Plan",
      },
    };
    return [common.starter, common.solo, common.agency];
  }, []);

  if (!open) return null;

  const price = (p) => (billing === "yearly" ? p.yearly : p.monthly);
  const suffix = billing === "yearly" ? "/ year" : "/ month";
  const saveLabel = billing === "yearly" ? "Save 2 months" : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 9999,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        style={{
          width: "min(980px, 100%)",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "22px 22px 14px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Unlock the Full Fix Plan</div>
              <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6, opacity: 0.85 }}>
                Get prioritized SEO fixes, examples, and content guidance you can act on immediately.
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, opacity: 0.9 }}>
                <button
                  type="button"
                  onClick={() => setBilling("monthly")}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: billing === "monthly" ? "rgba(0,0,0,0.06)" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("yearly")}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: billing === "yearly" ? "rgba(0,0,0,0.06)" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  Yearly
                </button>
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, minWidth: 84, textAlign: "right" }}>{saveLabel}</div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  marginLeft: 6,
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "#fff",
                  cursor: "pointer",
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
            {plans.map((p) => {
              const isPrimary = p.emphasis === "primary";
              return (
                <div
                  key={p.key}
                  style={{
                    borderRadius: 16,
                    border: isPrimary ? "2px solid rgba(0,0,0,0.35)" : "1px solid rgba(0,0,0,0.12)",
                    padding: 16,
                    background: isPrimary ? "rgba(0,0,0,0.02)" : "#fff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{p.badge}</div>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>${price(p)}</div>
                    <div style={{ fontSize: 13, opacity: 0.75 }}>{suffix}</div>
                  </div>

                  <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.9 }}>
                    <div style={{ fontWeight: 700, opacity: 0.9 }}>Includes</div>
                    <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                      {p.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  {p.locked?.length ? (
                    <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.9, opacity: 0.9 }}>
                      <div style={{ fontWeight: 700, opacity: 0.9 }}>Locked</div>
                      <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                        {p.locked.map((b) => (
                          <li key={b}>✕ {b}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onSelectPlan?.({ plan: p.key, billing })}
                    style={{
                      marginTop: 14,
                      width: "100%",
                      padding: "12px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.15)",
                      background: isPrimary ? "rgba(0,0,0,0.10)" : "#fff",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    {p.cta}
                  </button>

                  {p.key === "solo" ? (
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75, textAlign: "center" }}>Cancel anytime</div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 14, fontSize: 12, lineHeight: 1.6, opacity: 0.75 }}>
            RankyPulse focuses on execution and clarity — not keyword databases or SEO bloat. Upgrade, downgrade, or cancel anytime.
          </div>
        </div>
      </div>
    </div>
  );
}
