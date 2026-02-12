import SafeApexChart from "./SafeApexChart.jsx";

export default function ApexFunnelBars({ series = [], height = 260 }) {
  const labels = series.map((s) => s.label);
  const values = series.map((s) => Number(s.value || 0));
  if (!labels.length) return null;

  const options = {
    chart: {
      toolbar: { show: false },
      animations: { enabled: true }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true,
        borderRadius: 8,
        barHeight: "56%"
      }
    },
    colors: ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd"],
    dataLabels: {
      enabled: true,
      formatter: (v) => `${Math.round(v)}`,
      style: { colors: ["#ffffff"], fontWeight: 700 }
    },
    xaxis: {
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
    grid: {
      borderColor: "#ece2ff",
      strokeDashArray: 2
    },
    legend: { show: false },
    tooltip: {
      y: {
        formatter: (v) => `${Math.round(v)}`
      }
    }
  };

  return (
    <SafeApexChart
      type="bar"
      height={height}
      options={options}
      series={[{ name: "Users", data: values }]}
    />
  );
}
