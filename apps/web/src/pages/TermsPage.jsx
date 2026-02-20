import MarketingShell from "../marketing/components/MarketingShell.jsx";
import Seo from "../components/Seo.jsx";

export default function TermsPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  return (
    <>
      <Seo
        title="Terms of Service | RankyPulse"
        description="Terms of service for using RankyPulse, including acceptable use and billing terms."
        canonical={`${base}/terms`}
      />
      <MarketingShell
        title="Terms of Service"
        subtitle="Rules and conditions for using RankyPulse."
      >
        <div className="space-y-5 text-sm text-[var(--rp-text-600)]">
          <section className="rp-card p-5">
            <h2 className="text-base font-semibold text-[var(--rp-text-900)]">Acceptable use</h2>
            <p className="mt-2">You agree to use RankyPulse lawfully and not misuse or abuse the service.</p>
          </section>
          <section className="rp-card p-5">
            <h2 className="text-base font-semibold text-[var(--rp-text-900)]">Accounts and security</h2>
            <p className="mt-2">You are responsible for maintaining account credentials and authorized access.</p>
          </section>
          <section className="rp-card p-5">
            <h2 className="text-base font-semibold text-[var(--rp-text-900)]">Billing and cancellations</h2>
            <p className="mt-2">Paid plans renew as described at checkout. You can manage billing from account settings.</p>
          </section>
          <section className="rp-card p-5">
            <h2 className="text-base font-semibold text-[var(--rp-text-900)]">Contact</h2>
            <p className="mt-2">For legal questions, contact <a className="text-[var(--rp-indigo-700)] hover:underline" href="mailto:support@rankypulse.com">support@rankypulse.com</a>.</p>
          </section>
        </div>
      </MarketingShell>
    </>
  );
}
