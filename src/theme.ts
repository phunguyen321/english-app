import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#00897b" },
    secondary: { main: "#0288d1" },
    background: { default: "#fafafa" },
  },
  shape: { borderRadius: 10 },
  typography: {
    // Use the CSS variable from next/font as the primary family
    fontFamily: "var(--font-poppins), Poppins, Roboto, Arial, sans-serif",
  },
});

export default theme;
