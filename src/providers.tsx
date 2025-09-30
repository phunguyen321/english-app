"use client";
import { Provider } from "react-redux";
import { store } from "@/store";
import { ThemeProvider, CssBaseline, Container } from "@mui/material";
import theme from "@/theme";
import NavBar from "@/components/NavBar";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NavBar />
        <Container maxWidth="lg" sx={{ py: 2 }}>
          {children}
        </Container>
      </ThemeProvider>
    </Provider>
  );
}
