import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";

export default function InviteAcceptedPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  return (
    <AppShell
      title="Invite accepted"
      subtitle="Welcome to the team. Verify your email to access full features."
      seoTitle="Invite Accepted | RankyPulse"
      seoDescription="Your team invite was accepted. Verify your email to unlock full access."
      seoCanonical={`${base}/auth/invite-accepted`}
      seoRobots="noindex,nofollow"
    >
      <div className="mx-auto max-w-md">
        <div className="rp-card p-6">
          <div className="text-lg font-semibold text-[var(--rp-text-900)]">You’re in</div>
          <p className="mt-2 text-sm text-[var(--rp-text-600)]">
            We’ve sent a verification link to your email. Please verify to unlock audits and team tools.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link to="/auth/verify" className="rp-btn-primary text-sm">Verify email</Link>
            <Link to="/audit" className="rp-btn-secondary text-sm">Go to Audit</Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
