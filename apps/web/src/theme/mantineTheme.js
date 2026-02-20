import { createTheme } from "@mantine/core";

export const rankyPulseTheme = createTheme({
  primaryColor: "violet",
  defaultRadius: "md",
  fontFamily:
    '"Manrope", "Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  headings: {
    fontFamily:
      '"Space Grotesk", "Manrope", "Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    fontWeight: "700"
  },
  colors: {
    violet: [
      "#f5efff",
      "#e9dcff",
      "#d5b8ff",
      "#bf92ff",
      "#ac72ff",
      "#9f5fff",
      "#944dff",
      "#7c3aed",
      "#6d28d9",
      "#4f1d97"
    ],
    slate: [
      "#f5f6fa",
      "#e8eaf3",
      "#d1d5e6",
      "#b0b8cf",
      "#919dbd",
      "#7b88ac",
      "#6e7a9f",
      "#5d6889",
      "#4f5874",
      "#3f455a"
    ]
  },
  shadows: {
    xs: "0 1px 2px rgba(26, 15, 46, 0.06)",
    sm: "0 4px 14px rgba(26, 15, 46, 0.08)",
    md: "0 12px 28px rgba(26, 15, 46, 0.12)",
    lg: "0 18px 42px rgba(26, 15, 46, 0.16)",
    xl: "0 28px 64px rgba(26, 15, 46, 0.18)"
  }
});
