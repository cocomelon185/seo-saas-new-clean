import SafeApexChart from "./SafeApexChart.jsx";

export default function ApexSemiDonutScore({ value = 0, height = 170, color = "#7c3aed" }) {
  const score = Math.max(0, Math.min(100, Number(value || 0)));

  const options = {
    chart: {
      type: "radialBar",
      toolbar: { show: false },
      sparkline: { enabled: true },
      animations: { enabled: true }
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: {
          size: "62%"
        },
        track: {
          background: "#ede3ff"
        },
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: -4,
            fontSize: "24px",
            fontWeight: 700,
            color: "#20123a",
            formatter: (v) => `${Math.round(v)}%`
          }
        }
      }
    },
    colors: [color],
    stroke: {
      lineCap: "round"
    },
    tooltip: {
      y: {
        formatter: (v) => `${Math.round(v)}%`
      }
    }
  };

  return (
    <SafeApexChart
      type="radialBar"
      height={height}
      options={options}
      series={[score]}
    />
  );
}
