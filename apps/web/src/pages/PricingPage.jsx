import React, { useState } from "react";
import PricingModal from "../components/PricingModal.jsx";

export default function PricingPage() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ maxWidth: 1020, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: 0 }}>Pricing</h1>
      <p style={{ fontSize: 16, lineHeight: 1.7, marginTop: 12, maxWidth: 780, opacity: 0.85 }}>
        Simple pricing for clear SEO decisions. Choose a plan, then unlock full fix plans, examples, content briefs, and audit history.
      </p>

      <div style={{ marginTop: 18 }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          View plans
        </button>
      </div>

      <PricingModal
        open={open}
        onClose={() => setOpen(false)}
        onSelectPlan={() => {
          setOpen(false);
        }}
      />
    </div>
  );
}
