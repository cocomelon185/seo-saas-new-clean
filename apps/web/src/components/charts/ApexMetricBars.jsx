import SafeApexChart from "./SafeApexChart.jsx";

export default function ApexMetricBars({ metrics = [], height = 210 }) {
  const labels = metrics.map((m) => m.label);
  const values = metrics.map((m) => Number(m.value || 0));
  if (!labels.length) return null;

  const options = {
    chart: {
      toolbar: { show: false },
      animations: { enabled: true }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: "48%"
      }
    },
    xaxis: {
      min: 0,
      max: 100,
      categories: labels,
      labels: {
        style: { colors: "#6d5a99", fontSize: "11px" }
      }
    },
    yaxis: {
      labels: {
        style: { colors: "#3a2b5a", fontSize: "12px", fontWeight: 600 }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (v) => `${Math.round(v)}%`,
      style: { colors: ["#1f1235"] }
    },
    grid: {
      borderColor: "#ece2ff",
      strokeDashArray: 3
    },
    colors: ["#34d399", "#22d3ee", "#facc15"],
    tooltip: {
      y: {
        formatter: (v) => `${Math.round(v)}%`
      }
    },
    legend: { show: false }
  };

  return (
    <SafeApexChart
      type="bar"
      height={height}
      options={options}
      series={[{ name: "Health", data: values }]}
    />
  );
}
