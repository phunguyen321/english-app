import React from "react";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { useMediaQuery, useTheme } from "@mui/material";

export default function MobileMenuButton({ onClick }: { onClick: () => void }) {
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));
  if (!smDown) return null;
  return (
    <IconButton
      color="inherit"
      aria-label="open sidebar"
      edge="start"
      onClick={onClick}
      sx={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 1500,
        background: "#fff",
        boxShadow: 1,
        borderRadius: 2,
        p: 1,
        display: { xs: "inline-flex", sm: "none" },
      }}
    >
      <MenuIcon fontSize="large" />
    </IconButton>
  );
}
