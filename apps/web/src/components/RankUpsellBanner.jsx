export default function RankUpsellBanner({ onOpen, email = "", onEmailChange, onJoinWaitlist, message = "" }) {
  return (
    <div className="rp-card border border-[var(--rp-warning)]/40 bg-[var(--rp-warning)]/10 p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-full bg-[var(--rp-warning)] px-2.5 py-1 text-xs font-semibold text-[#3b2f12]">
          Weekly alerts beta
        </div>
        <div className="text-sm font-semibold leading-snug text-[var(--rp-text-900)]">
          Get weekly rank alerts by email and catch drops before traffic falls.
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:flex md:flex-wrap md:items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange?.(e.target.value)}
          placeholder="you@company.com"
          className="rp-input h-10 w-full md:h-9 md:w-72"
          aria-label="Waitlist email"
        />
        <button
          onClick={onJoinWaitlist}
          className="h-10 rounded-lg bg-[var(--rp-indigo-700)] px-3 text-sm font-semibold text-white hover:bg-[var(--rp-indigo-800)] md:h-9"
        >
          Notify me
        </button>
        <button
          onClick={onOpen}
          className="h-10 rounded-lg border border-[var(--rp-border)] bg-white px-3 text-sm font-semibold text-[var(--rp-text-800)] hover:border-[var(--rp-orange-500)]/40 hover:text-[var(--rp-indigo-900)] md:h-9"
        >
          View plans
        </button>
      </div>
      <div className="mt-2 text-xs text-[var(--rp-text-600)]">
        Founder pricing for early users. Weekly alert emails start as soon as beta opens.
      </div>
      {message ? <div className="mt-2 text-xs font-semibold text-emerald-700">{message}</div> : null}
    </div>
  );
}
