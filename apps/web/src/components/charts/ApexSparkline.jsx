import SafeApexChart from "./SafeApexChart.jsx";

export default function ApexSparkline({ values = [], height = 44 }) {
  const clean = Array.isArray(values) ? values.filter((v) => Number.isFinite(Number(v))).map(Number) : [];
  if (!clean.length) return null;

  const options = {
    chart: {
      sparkline: { enabled: true },
      toolbar: { show: false },
      animations: { enabled: true }
    },
    stroke: {
      curve: "smooth",
      width: 3
    },
    colors: ["#22d3ee"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.2,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 100]
      }
    },
    tooltip: {
      x: { show: false },
      y: {
        formatter: (v) => `Rank: ${Math.round(v)}`
      }
    }
  };

  return (
    <SafeApexChart
      type="area"
      height={height}
      options={options}
      series={[{ name: "Rank", data: clean }]}
    />
  );
}
