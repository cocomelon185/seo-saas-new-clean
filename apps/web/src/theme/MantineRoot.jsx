import { MantineProvider } from "@mantine/core";
import { rankyPulseTheme } from "./mantineTheme.js";

export default function MantineRoot({ children }) {
  return (
    <MantineProvider theme={rankyPulseTheme} defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
}
