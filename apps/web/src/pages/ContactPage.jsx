import MarketingShell from "../marketing/components/MarketingShell.jsx";
import Seo from "../components/Seo.jsx";

export default function ContactPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  return (
    <>
      <Seo
        title="Contact | RankyPulse"
        description="Contact RankyPulse for support, partnerships, and enterprise inquiries."
        canonical={`${base}/contact`}
      />
      <MarketingShell
        title="Contact RankyPulse"
        subtitle="Need help, want onboarding guidance, or exploring a partnership? Reach out."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rp-card p-5">
            <h2 className="text-base font-semibold text-[var(--rp-text-900)]">Support</h2>
            <p className="mt-2 text-sm text-[var(--rp-text-600)]">
              Product help, account questions, and technical support.
            </p>
            <a className="mt-3 inline-block text-sm font-semibold text-[var(--rp-indigo-700)] hover:underline" href="mailto:support@rankypulse.com">
              support@rankypulse.com
            </a>
          </section>
          <section className="rp-card p-5">
            <h2 className="text-base font-semibold text-[var(--rp-text-900)]">Business</h2>
            <p className="mt-2 text-sm text-[var(--rp-text-600)]">
              Partnerships, agency onboarding, and custom workflows.
            </p>
            <a className="mt-3 inline-block text-sm font-semibold text-[var(--rp-indigo-700)] hover:underline" href="mailto:hello@rankypulse.com">
              hello@rankypulse.com
            </a>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
