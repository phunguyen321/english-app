"use client";
import Sidebar from "@/components/Sidebar";
import {
  IconButton,
  useMediaQuery,
  AppBar,
  Toolbar,
  Typography,
  Box,
} from "@mui/material";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import AppProviders from "@/providers";
import { useState, useEffect } from "react";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));

  // Register service worker for PWA (only in secure contexts)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.isSecureContext
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Khóa scroll nền khi mở sidebar trên mobile
  useEffect(() => {
    if (smDown) {
      const html = document.documentElement as HTMLElement;
      if (sidebarExpanded) {
        document.body.style.overflow = "hidden";
        html.style.overflow = "hidden";
        // Prevent rubber-band/overscroll propagating to page
        html.style.setProperty("overscroll-behavior", "contain");
      } else {
        document.body.style.overflow = "";
        html.style.overflow = "";
        html.style.removeProperty("overscroll-behavior");
      }
    }
    return () => {
      document.body.style.overflow = "";
      const html = document.documentElement as HTMLElement;
      html.style.overflow = "";
      html.style.removeProperty("overscroll-behavior");
    };
  }, [sidebarExpanded, smDown]);

  return (
    <>
      {smDown && (
        <>
          <AppBar
            position="fixed"
            elevation={0}
            color="default"
            sx={{
              background: "#ffffffcc",
              backdropFilter: "blur(8px)",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Toolbar variant="regular" sx={{ minHeight: 56 }}>
              <IconButton
                aria-label="toggle sidebar"
                onClick={() => setSidebarExpanded((v) => !v)}
                edge="start"
                sx={{ mr: 1 }}
              >
                {sidebarExpanded ? <MenuOpenIcon /> : <MenuIcon />}
              </IconButton>
              <Typography
                variant="h6"
                fontWeight={600}
                fontSize={18}
                noWrap
                sx={{ flexGrow: 1 }}
              >
                English Learner
              </Typography>
            </Toolbar>
          </AppBar>
          <Box sx={{ height: 56 }} />
        </>
      )}
      <div
        style={{
          display: "flex",
          // Reserve space for fixed sidebar on desktop
          paddingLeft: smDown ? 0 : sidebarExpanded ? 220 : 72,
          minHeight: "100vh",
          background: "#f8fafc",
          paddingTop: smDown ? 56 : 0,
        }}
      >
        <Sidebar
          expanded={sidebarExpanded}
          onClose={() => setSidebarExpanded(false)}
          onToggle={() => setSidebarExpanded((v) => !v)}
        />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: "100vw",
            overflowX: "hidden",
          }}
        >
          <AppProviders>{children}</AppProviders>
          <footer
            style={{
              marginTop: 48,
              padding: "20px 0 10px 0",
              textAlign: "center",
              color: "#888",
              fontSize: 15,
              fontStyle: "italic",
              letterSpacing: 1,
              background: "transparent",
              lineHeight: 1.6,
            }}
          >
            Phú Nguyễn © {new Date().getFullYear()}. All rights reserved.
          </footer>
        </main>
      </div>
    </>
  );
}
