import MarketingShell from "../marketing/components/MarketingShell.jsx";
import Seo from "../components/Seo.jsx";

const FAQS = [
  {
    q: "How long does an audit take?",
    a: "Most single-page audits complete in under a minute. Complex pages can take slightly longer."
  },
  {
    q: "Do I need technical SEO knowledge to use RankyPulse?",
    a: "No. The product is designed with plain-English recommendations and practical next steps."
  },
  {
    q: "Can I share reports with clients or stakeholders?",
    a: "Yes. You can share report links and use exports for handoff and planning."
  },
  {
    q: "Does RankyPulse support ongoing tracking?",
    a: "Yes. You can rerun audits and track progress over time."
  }
];

export default function FaqPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  return (
    <>
      <Seo
        title="FAQ | RankyPulse"
        description="Frequently asked questions about RankyPulse audits, reports, pricing, and workflow."
        canonical={`${base}/faq`}
      />
      <MarketingShell
        title="Frequently Asked Questions"
        subtitle="Answers to common questions about audits, workflow, and reporting."
      >
        <div className="space-y-4">
          {FAQS.map((item) => (
            <section key={item.q} className="rp-card p-5">
              <h2 className="text-base font-semibold text-[var(--rp-text-900)]">{item.q}</h2>
              <p className="mt-2 text-sm text-[var(--rp-text-600)]">{item.a}</p>
            </section>
          ))}
        </div>
      </MarketingShell>
    </>
  );
}
