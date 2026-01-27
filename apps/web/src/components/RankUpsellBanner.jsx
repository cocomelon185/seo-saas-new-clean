export default function RankUpsellBanner({ onOpen }) {
  return (
    <div className="rounded-2xl border border-amber-300/20 bg-amber-200/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-[#070A12]">
          Coming soon
        </div>
        <div className="text-sm font-semibold text-white/85">
          Track this keyword weekly, get alerts when your rank changes.
        </div>
        <button
          onClick={onOpen}
          className="ml-auto h-9 rounded-lg bg-white px-3 text-sm font-semibold text-[#070A12] hover:opacity-95"
        >
          Track weekly
        </button>
      </div>
      <div className="mt-2 text-xs text-white/55">
        This will be a paid feature. Early users get founder pricing.
      </div>
    </div>
  );
}
