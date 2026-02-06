export default function AuditImpactBanner({ score, issues }) {
  const s = Number.isFinite(Number(score)) ? Number(score) : null;
  const list = Array.isArray(issues) ? issues : [];

  const fixNow = list.filter((x) => (x && x.priority) === "fix_now");
  const n = fixNow.length;

  if (!n || s === null) return null;

  const rawMin = n * 2;
  const rawMax = n * 3;

  const cap = Math.max(0, 100 - s);
  const min = Math.max(0, Math.min(rawMin, cap));
  const max = Math.max(min, Math.min(rawMax, cap));

  if (max <= 0) return null;

  const toMin = Math.min(100, s + min);
  const toMax = Math.min(100, s + max);

  return (
    <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-100/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-full bg-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Before vs After preview
        </div>
        <div className="text-sm font-semibold text-emerald-700">
          If you fix all <span className="font-extrabold">Fix now ({n})</span> issues, your score could improve by{" "}
          <span className="font-extrabold">+{min}-{max}</span> points
        </div>
      </div>

      <div className="mt-2 text-sm text-emerald-700">
        Estimated score range: <span className="font-extrabold">{toMin}-{toMax}</span>
        <span className="ml-2 text-emerald-700/70">(based on {n} Fix now issue{n === 1 ? "" : "s"})</span>
      </div>
    </div>
  );
}
