"use client";
import { Provider } from "react-redux";
import { store } from "@/store";
import { ThemeProvider, CssBaseline, Container } from "@mui/material";
import theme from "@/theme";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ py: 2 }}>
          {children}
        </Container>
      </ThemeProvider>
    </Provider>
  );
}
