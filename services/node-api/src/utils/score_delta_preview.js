function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function issueImpact(priority) {
  if (priority === "fix_now") return { min: 2, max: 3 };
  if (priority === "fix_next") return { min: 1, max: 2 };
  if (priority === "fix_later") return { min: 0.5, max: 1 };
  return { min: 0.5, max: 1 };
}

function buildScoreDeltaPreview(result, opts = {}) {
  const targetMin = typeof opts.targetMin === "number" ? opts.targetMin : 6;
  const targetMax = typeof opts.targetMax === "number" ? opts.targetMax : 10;

  const issues = Array.isArray(result?.issues) ? result.issues : [];
  const rows = issues
    .filter(x => x && (x.issue_id || x.title || x.name))
    .map(x => {
      const pri = x.priority || x.severity || x.bucket || "fix_next";
      const imp = issueImpact(pri);
      const label = x.title || x.name || x.issue_id || "Issue";
      return {
        issue_id: x.issue_id || null,
        label,
        priority: pri,
        impact_min: imp.min,
        impact_max: imp.max,
      };
    })
    .sort((a, b) => (b.impact_max - a.impact_max) || (b.impact_min - a.impact_min));

  let min = 0;
  let max = 0;
  const picks = [];
  for (const r of rows) {
    if (picks.length >= 8) break;
    if (min >= targetMin && max >= targetMax) break;
    picks.push(r);
    min += r.impact_min;
    max += r.impact_max;
  }

  min = clamp(min, 0, 25);
  max = clamp(max, 0, 25);

  return {
    headline: `Fix these → score +${min.toFixed(0)}–${max.toFixed(0)}`,
    target_min: targetMin,
    target_max: targetMax,
    total_min: Number(min.toFixed(1)),
    total_max: Number(max.toFixed(1)),
    items: picks,
  };
}

module.exports = { buildScoreDeltaPreview };
