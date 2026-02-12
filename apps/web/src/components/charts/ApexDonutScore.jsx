import SafeApexChart from "./SafeApexChart.jsx";

export default function ApexDonutScore({ value = 0, size = 180 }) {
  const score = Math.max(0, Math.min(100, Number(value || 0)));

  const options = {
    chart: {
      toolbar: { show: false },
      animations: { enabled: true }
    },
    labels: ["Score", "Remaining"],
    colors: ["#7c3aed", "#e9defd"],
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: "74%",
          labels: {
            show: true,
            name: { show: true, offsetY: 14, color: "#6f5a9f" },
            value: {
              show: true,
              fontSize: "26px",
              fontWeight: 700,
              color: "#20123a",
              offsetY: -8,
              formatter: () => String(Math.round(score))
            },
            total: {
              show: true,
              label: "/100",
              formatter: () => ""
            }
          }
        }
      }
    },
    tooltip: {
      y: {
        formatter: (v) => `${Math.round(v)}`
      }
    }
  };

  return (
    <SafeApexChart
      type="donut"
      width={size}
      height={size}
      options={options}
      series={[score, Math.max(0, 100 - score)]}
    />
  );
}
