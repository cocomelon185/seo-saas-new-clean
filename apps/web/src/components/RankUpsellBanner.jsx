export default function RankUpsellBanner({ onOpen, email = "", onEmailChange, onJoinWaitlist, message = "" }) {
  return (
    <div className="rp-card border border-[var(--rp-warning)]/30 bg-[var(--rp-warning)]/10 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-full bg-[var(--rp-warning)] px-2.5 py-1 text-xs font-semibold text-[#3b2f12]">
          Weekly alerts beta
        </div>
        <div className="text-sm font-semibold text-[var(--rp-text-700)]">
          Get weekly rank alerts by email and catch drops before traffic falls.
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange?.(e.target.value)}
          placeholder="you@company.com"
          className="rp-input h-9 w-72 max-w-full"
          aria-label="Waitlist email"
        />
        <button
          onClick={onJoinWaitlist}
          className="h-9 rounded-lg bg-[var(--rp-indigo-700)] px-3 text-sm font-semibold text-white hover:bg-[var(--rp-indigo-800)]"
        >
          Notify me
        </button>
        <button
          onClick={onOpen}
          className="h-9 rounded-lg border border-[var(--rp-border)] bg-white px-3 text-sm font-semibold text-[var(--rp-text-700)] hover:border-[var(--rp-orange-500)]/40 hover:text-[var(--rp-indigo-900)]"
        >
          View plans
        </button>
      </div>
      <div className="mt-2 text-xs text-[var(--rp-text-500)]">
        Founder pricing for early users. Weekly alert emails start as soon as beta opens.
      </div>
      {message ? <div className="mt-2 text-xs font-semibold text-emerald-700">{message}</div> : null}
    </div>
  );
}
