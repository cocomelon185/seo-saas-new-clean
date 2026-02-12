import { useEffect, useState } from "react";

export default function SafeApexChart(props) {
  const [ApexChart, setApexChart] = useState(null);

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

  if (!ApexChart) {
    return <div className="h-full w-full rounded bg-[var(--rp-gray-50)]" aria-hidden="true" />;
  }

  return <ApexChart {...props} />;
}
