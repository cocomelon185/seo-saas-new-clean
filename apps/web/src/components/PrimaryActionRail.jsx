import { IconArrowRight, IconRefresh } from "./Icons.jsx";

export default function PrimaryActionRail({
  problemTitle = "No critical issues found",
  timeLabel = "5-10 min",
  liftLabel = "+0",
  onFindProblem,
  onGetSolution,
  onRerun,
  onToggleMore,
  showMore = false,
  onExportPdf,
  onExportSummary,
  onToggleMonitor,
  monitorLabel = "Monitor this page",
  shareNode = null,
  showSoftUpsell = false,
  onUpgrade,
  onContinueFree
}) {
  return (
    <div className="space-y-3">
      <div className="rp-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="rp-btn-primary rp-btn-sm h-9 px-3 text-xs" onClick={onFindProblem}>
            Find my problem
          </button>
          <button type="button" className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs" onClick={onGetSolution}>
            Get my solution
          </button>
          <button type="button" className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs" onClick={onRerun}>
            <IconRefresh size={14} />
            Re-audit now
          </button>
          <button type="button" className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs" onClick={onToggleMore}>
            More
          </button>
        </div>
        <div className="mt-3 text-xs text-[var(--rp-text-500)]">
          Problem: <span className="font-semibold text-[var(--rp-text-800)]">{problemTitle}</span> • Time: <span className="font-semibold text-[var(--rp-text-800)]">{timeLabel}</span> • Expected lift: <span className="font-semibold text-emerald-700">{liftLabel}</span>
        </div>
      </div>

      {showMore && (
        <div className="rp-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            {shareNode ? <div>{shareNode}</div> : null}
            <button type="button" className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs" onClick={onExportPdf}>
              Export PDF
            </button>
            <button type="button" className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs" onClick={onExportSummary}>
              Export summary
            </button>
            <button type="button" className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs" onClick={onToggleMonitor}>
              {monitorLabel}
            </button>
          </div>
        </div>
      )}

      {showSoftUpsell && (
        <div className="rp-card p-4">
          <div className="text-sm font-semibold text-[var(--rp-text-800)]">Unlock weekly tracking + full fix library</div>
          <div className="mt-1 text-xs text-[var(--rp-text-500)]">
            Keep improvements moving with weekly change summaries and deeper fix guidance.
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rp-btn-primary rp-btn-sm h-9 px-3 text-xs" onClick={onUpgrade}>
              <IconArrowRight size={12} />
              Upgrade
            </button>
            <button type="button" className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs" onClick={onContinueFree}>
              Continue free
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
