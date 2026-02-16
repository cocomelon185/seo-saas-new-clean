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

const NON_AXIS_TYPES = new Set(["donut", "pie", "radialbar", "polararea"]);

function normalizeAxisSeries(seriesInput) {
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

function normalizeNonAxisSeries(seriesInput) {
  if (Array.isArray(seriesInput) && seriesInput.some((entry) => typeof entry === "number" || typeof entry === "string")) {
    return toNumberArray(seriesInput);
  }
  return asArray(seriesInput)
    .flatMap((entry) => {
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        if (Array.isArray(entry.data)) return toNumberArray(entry.data);
        if ("value" in entry) {
          const value = Number(entry.value);
          return Number.isFinite(value) ? [value] : [];
        }
      }
      const value = Number(entry);
      return Number.isFinite(value) ? [value] : [];
    });
}

function normalizeOptions(optionsInput, axisChart) {
  const options = optionsInput && typeof optionsInput === "object" && !Array.isArray(optionsInput)
    ? optionsInput
    : {};
  if (!axisChart) return options;
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
  const chartType = useMemo(() => {
    const fromType = String(restProps?.type || "").trim().toLowerCase();
    if (fromType) return fromType;
    return String(options?.chart?.type || "").trim().toLowerCase();
  }, [restProps?.type, options?.chart?.type]);
  const axisChart = !NON_AXIS_TYPES.has(chartType);
  const normalizedSeries = useMemo(() => {
    return axisChart ? normalizeAxisSeries(series) : normalizeNonAxisSeries(series);
  }, [axisChart, series]);
  const normalizedOptions = useMemo(() => normalizeOptions(options, axisChart), [options, axisChart]);
  const hasRenderableSeries = axisChart
    ? normalizedSeries.some((entry) => asArray(entry?.data).length > 0)
    : toNumberArray(normalizedSeries).length > 0;

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
    if (hasRenderableSeries) return;
    console.warn(`[chart.guard] Skipped ${chartType || "unknown"} chart render due to invalid or empty series payload.`);
  }, [hasRenderableSeries, chartType]);

  if (!ApexChart || !hasRenderableSeries) {
    return <div className="h-full w-full rounded bg-[var(--rp-gray-50)]" aria-hidden="true" />;
  }

  return <ApexChart {...restProps} options={normalizedOptions} series={normalizedSeries} />;
}
