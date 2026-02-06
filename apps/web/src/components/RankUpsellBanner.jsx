export default function RankUpsellBanner({ onOpen }) {
  return (
    <div className="rp-card border border-[var(--rp-warning)]/30 bg-[var(--rp-warning)]/10 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-full bg-[var(--rp-warning)] px-2.5 py-1 text-xs font-semibold text-[#3b2f12]">
          Coming soon
        </div>
        <div className="text-sm font-semibold text-[var(--rp-text-700)]">
          Track this keyword weekly, get alerts when your rank changes.
        </div>
        <button
          onClick={onOpen}
          className="ml-auto h-9 rounded-lg border border-[var(--rp-border)] bg-white px-3 text-sm font-semibold text-[var(--rp-text-700)] hover:border-[var(--rp-orange-500)]/40 hover:text-[var(--rp-indigo-900)]"
        >
          Track weekly
        </button>
      </div>
      <div className="mt-2 text-xs text-[var(--rp-text-500)]">
        This will be a paid feature. Early users get founder pricing.
      </div>
    </div>
  );
}
