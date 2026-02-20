import MarketingShell from "../marketing/components/MarketingShell.jsx";
import Seo from "../components/Seo.jsx";

export default function PrivacyPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  return (
    <>
      <Seo
        title="Privacy Policy | RankyPulse"
        description="Privacy policy for RankyPulse, including data collection, usage, and security practices."
        canonical={`${base}/privacy`}
      />
      <MarketingShell
        title="Privacy Policy"
        subtitle="How RankyPulse collects, uses, and protects your information."
      >
        <div className="space-y-5 text-sm text-[var(--rp-text-600)]">
          <section className="rp-card p-5">
            <h2 className="text-base font-semibold text-[var(--rp-text-900)]">Information we collect</h2>
            <p className="mt-2">Account details, usage events, and audit-related metadata required to provide the service.</p>
          </section>
          <section className="rp-card p-5">
            <h2 className="text-base font-semibold text-[var(--rp-text-900)]">How we use information</h2>
            <p className="mt-2">To operate RankyPulse, improve performance, secure the platform, and communicate service updates.</p>
          </section>
          <section className="rp-card p-5">
            <h2 className="text-base font-semibold text-[var(--rp-text-900)]">Data retention</h2>
            <p className="mt-2">We retain data only as long as needed for legitimate business and legal purposes.</p>
          </section>
          <section className="rp-card p-5">
            <h2 className="text-base font-semibold text-[var(--rp-text-900)]">Contact</h2>
            <p className="mt-2">For privacy requests, contact us at <a className="text-[var(--rp-indigo-700)] hover:underline" href="mailto:support@rankypulse.com">support@rankypulse.com</a>.</p>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
