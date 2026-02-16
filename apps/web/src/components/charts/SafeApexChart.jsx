import { useEffect, useMemo, useState } from "react";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumberArray(value) {
  return asArray(value)
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry));
}

function toCategoryArray(value) {
  return asArray(value)
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean);
}

function normalizeSeries(seriesInput) {
  const rawSeries = asArray(seriesInput);
  return rawSeries
    .map((entry, index) => {
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        return {
          ...entry,
          name: String(entry.name || `Series ${index + 1}`),
          data: toNumberArray(entry.data)
        };
      }
      return {
        name: `Series ${index + 1}`,
        data: toNumberArray(entry)
      };
    })
    .filter((entry) => Array.isArray(entry.data) && entry.data.length > 0);
}

function normalizeOptions(optionsInput) {
  const options = optionsInput && typeof optionsInput === "object" && !Array.isArray(optionsInput)
    ? optionsInput
    : {};
  const xaxis = options.xaxis && typeof options.xaxis === "object" && !Array.isArray(options.xaxis)
    ? options.xaxis
    : {};
  return {
    ...options,
    xaxis: {
      ...xaxis,
      categories: toCategoryArray(xaxis.categories)
    }
  };
}

export default function SafeApexChart({ series, options, ...restProps }) {
  const [ApexChart, setApexChart] = useState(null);
  const normalizedSeries = useMemo(() => normalizeSeries(series), [series]);
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);
  const hasRenderableSeries = normalizedSeries.some((entry) => asArray(entry?.data).length > 0);

  useEffect(() => {
    let mounted = true;
    import("react-apexcharts")
      .then((mod) => {
        if (mounted) setApexChart(() => mod.default);
      })
      .catch(() => {
        if (mounted) setApexChart(() => null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;
    if (!window.location.pathname.startsWith("/rank")) return;
    if (hasRenderableSeries) return;
    console.warn("[rank.chart.guard] Skipped chart render due to invalid or empty series payload.");
  }, [hasRenderableSeries]);

  if (!ApexChart || !hasRenderableSeries) {
    return <div className="h-full w-full rounded bg-[var(--rp-gray-50)]" aria-hidden="true" />;
  }

  return <ApexChart {...restProps} options={normalizedOptions} series={normalizedSeries} />;
}
