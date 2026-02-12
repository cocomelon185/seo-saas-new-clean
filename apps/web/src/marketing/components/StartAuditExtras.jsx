import ApexSparkline from "../../components/charts/ApexSparkline.jsx";
import ApexMetricBars from "../../components/charts/ApexMetricBars.jsx";

export default function StartAuditExtras() {
  return (
    <>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {[
          { label: "SEO Health", value: "92", tone: "bg-emerald-50 text-emerald-700" },
          { label: "Fix-now issues", value: "14", tone: "bg-amber-50 text-amber-700" },
          { label: "Impact potential", value: "+28%", tone: "bg-purple-50 text-purple-700" }
        ].map((item) => (
          <div key={item.label} className="rp-kpi-card rounded-2xl border border-[var(--rp-border)] bg-white p-3 shadow-sm">
            <div className="text-[11px] font-semibold text-[var(--rp-text-500)]">{item.label}</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${item.tone}`}>{item.value}</span>
              <span className="text-[10px] text-[var(--rp-text-500)]">Last 30 days</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[var(--rp-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--rp-text-500)]">
            <span>Score trend</span>
            <span className="rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-2 py-1">Last 7 audits</span>
          </div>
          <div className="mt-3 text-sm font-semibold text-[var(--rp-text-900)]">SEO score + visibility lift</div>
          <div className="mt-4 h-28 w-full">
            <ApexSparkline values={[58, 61, 60, 67, 65, 72, 74, 79]} height={112} />
          </div>
          <div className="mt-2 text-xs text-[var(--rp-text-500)]">
            Trend reflects improvements after fixing top-priority issues.
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--rp-border)] bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-[var(--rp-text-500)]">Priority queue</div>
          <div className="mt-3 space-y-2 text-sm text-[var(--rp-text-700)]">
            {[
              "Missing H1 on homepage",
              "Compress hero PNG assets",
              "Fix 12 redirect chains",
              "Improve LCP on pricing page"
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-3">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-[var(--rp-orange-500)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--rp-border)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold text-[var(--rp-text-500)]">Fix impact panel</div>
            <div className="mt-2 text-lg font-semibold text-[var(--rp-text-900)]">Estimated impact after top 3 fixes</div>
            <p className="mt-2 text-sm text-[var(--rp-text-600)]">
              Prioritize the items below to unlock faster rankings and conversions.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] px-4 py-3 text-sm font-semibold text-[var(--rp-text-700)]">
            Potential uplift: +1,240 visits/mo
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { label: "Core Web Vitals", value: "High", tone: "text-rose-700" },
            { label: "On-page gaps", value: "Medium", tone: "text-amber-700" },
            { label: "Internal linking", value: "Quick win", tone: "text-emerald-700" }
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[var(--rp-border)] bg-white p-4">
              <div className="text-xs text-[var(--rp-text-500)]">{item.label}</div>
              <div className={`mt-2 text-sm font-semibold ${item.tone}`}>{item.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--rp-text-500)]">
            Impact distribution
          </div>
          <div className="mt-3">
            <ApexMetricBars
              height={170}
              metrics={[
                { label: "Core Web Vitals", value: 42 },
                { label: "On-page gaps", value: 66 },
                { label: "Internal linking", value: 84 }
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
