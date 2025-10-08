"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GavelIcon from "@mui/icons-material/Gavel";
import QuizIcon from "@mui/icons-material/Quiz";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RuleIcon from "@mui/icons-material/Rule";

// Drawer dynamic to avoid SSR mismatch on mobile
const DrawerDynamic = dynamic(() => import("@mui/material/Drawer"), {
  ssr: false,
});

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}
const navItems: NavItem[] = [
  { label: "Trang chủ", href: "/", icon: <HomeIcon /> },
  { label: "Từ vựng", href: "/vocabulary", icon: <MenuBookIcon /> },
  { label: "Ngữ pháp", href: "/grammar", icon: <GavelIcon /> },
  {
    label: "Động từ bất quy tắc",
    href: "/irregular-verbs",
    icon: <RuleIcon />,
  },
  { label: "Bài tập", href: "/quizzes", icon: <QuizIcon /> },
  {
    label: "Tạo bài tập AI",
    href: "/generate-quizzes",
    icon: <AutoAwesomeIcon />,
  },
];

type SidebarProps = {
  expanded: boolean;
  onClose: () => void;
  onToggle: () => void;
};

export default function Sidebar({ expanded, onClose, onToggle }: SidebarProps) {
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));
  const pathname = usePathname();
  const isDesktop = !smDown;

  const WIDTH_EXPANDED = 220;
  const WIDTH_COLLAPSED = 72; // ensure logo still visible
  const width = isDesktop
    ? expanded
      ? WIDTH_EXPANDED
      : WIDTH_COLLAPSED
    : WIDTH_EXPANDED;

  const header = (
    <Box
      sx={{
        p: 1.25,
        display: "flex",
        alignItems: "center",
        gap: 1,
        pl: expanded ? 2 : 1.25,
        pr: 1,
        minHeight: 56,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexGrow: 1,
          justifyContent: "flex-start",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{ position: "relative", width: 32, height: 32, flexShrink: 0 }}
        >
          <Image
            src="/english-learn.svg"
            alt="Logo"
            width={32}
            height={32}
            style={{ borderRadius: 8, display: "block" }}
            priority
          />
        </Box>
        <Typography
          variant="h6"
          fontWeight={700}
          aria-hidden={!expanded || !isDesktop}
          sx={{
            ml: 0.75,
            whiteSpace: "nowrap",
            opacity: expanded && isDesktop ? 1 : 0,
            transform:
              expanded && isDesktop ? "translateX(0)" : "translateX(-8px)",
            transition:
              "opacity .28s ease, transform .34s cubic-bezier(.4,0,.2,1)",
            pointerEvents: "none",
          }}
        >
          English
        </Typography>
      </Box>
    </Box>
  );

  const list = (
    <List sx={{ flex: 1, py: 0 }}>
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <ListItem key={item.href} disablePadding sx={{ display: "block" }}>
            <Tooltip
              title={!expanded && isDesktop ? item.label : ""}
              placement="right"
              disableHoverListener={expanded || smDown}
            >
              <ListItemButton
                component={Link}
                href={item.href}
                selected={active}
                sx={{
                  py: 1.05,
                  minHeight: 44,
                  justifyContent: expanded || smDown ? "flex-start" : "center",
                  px: expanded || smDown ? 2 : 1,
                  transition: "all .25s",
                  "&.Mui-selected": { bgcolor: "action.selected" },
                  "&.Mui-selected:hover": { bgcolor: "action.selected" },
                }}
                onClick={() => {
                  if (smDown) onClose();
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: expanded || smDown ? 2 : 0,
                    justifyContent: "center",
                    color: active ? "primary.main" : "inherit",
                    transition: "margin-right .25s ease",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <Box
                  sx={{
                    overflow: "hidden",
                    width: expanded || smDown ? "auto" : 0,
                    opacity: expanded || smDown ? 1 : 0,
                    transition: "opacity .22s ease, width .25s ease",
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: active ? 600 : 500,
                      fontSize: 14.5,
                    }}
                  />
                </Box>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        );
      })}
    </List>
  );

  const content = (
    <Box
      sx={{
        // Keep the sidebar fixed on desktop while page scrolls
        position: isDesktop ? "fixed" : "relative",
        top: isDesktop ? 0 : "auto",
        left: isDesktop ? 0 : "auto",
        width,
        display: "flex",
        flexDirection: "column",
        // Occupy full viewport height and allow internal scroll on all sizes
        height: "100vh",
        minHeight: "100vh",
        overflowY: "auto",
        bgcolor: "background.paper",
        transition:
          "width .3s cubic-bezier(.4,0,.2,1), box-shadow .35s, border-color .3s",
        borderRight: isDesktop ? 1 : 0,
        borderColor: "divider",
        // Avoid heavy shadow entirely on both desktop and mobile
        boxShadow: 0,
        zIndex: isDesktop ? (theme) => theme.zIndex.drawer : "auto",
      }}
    >
      {header}
      <Divider sx={{ mb: 0.5 }} />
      {list}
      {isDesktop && (
        <Tooltip title={expanded ? "Thu gọn" : "Mở rộng"} placement="right">
          <Box
            role="button"
            aria-label={expanded ? "Thu gọn sidebar" : "Mở rộng sidebar"}
            tabIndex={0}
            onClick={onToggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle();
              }
            }}
            sx={{
              // Fix the handle to viewport center so it never sinks on long pages
              position: "fixed",
              top: "50%",
              // Center the pill over the sidebar divider: offset by half of pill width (22 / 2 = 11)
              left: (expanded ? WIDTH_EXPANDED : WIDTH_COLLAPSED) - 11,
              transform: "translateY(-50%)",
              height: "auto",
              width: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              userSelect: "none",
              opacity: 0.5,
              zIndex: (theme) => theme.zIndex.drawer + 1,
              transition: "opacity .25s, left .25s",
              "&:hover": { opacity: 0.95 },
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "primary.main",
              },
            }}
          >
            <Box
              sx={{
                width: 22,
                height: 50,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: 1,
                transition: "transform .35s cubic-bezier(.4,0,.2,1)",
                transform: expanded ? "scale(1)" : "scale(.92)",
              }}
            >
              {expanded ? (
                <ChevronLeftIcon
                  sx={{ fontSize: 18, transition: "transform .35s" }}
                />
              ) : (
                <ChevronRightIcon
                  sx={{ fontSize: 18, transition: "transform .35s" }}
                />
              )}
            </Box>
          </Box>
        </Tooltip>
      )}
    </Box>
  );

  if (smDown) {
    return (
      <DrawerDynamic
        anchor="left"
        open={expanded}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          elevation: 0,
          sx: {
            boxShadow: "none",
            borderRight: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          },
        }}
        sx={{
          "& .MuiDrawer-paper": {
            width: WIDTH_EXPANDED,
            overflow: "hidden",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            transition: "transform .32s cubic-bezier(.4,0,.2,1)",
            boxShadow: "none",
            borderRight: 1,
            borderColor: "divider",
          },
        }}
      >
        <Box
          sx={{
            height: "100vh",
            overflow: "hidden",
            opacity: expanded ? 1 : 0,
            transform: expanded ? "translateX(0)" : "translateX(-12px)",
            transition:
              "opacity .28s ease, transform .35s cubic-bezier(.4,0,.2,1)",
            pointerEvents: expanded ? "auto" : "none",
          }}
        >
          {content}
        </Box>
      </DrawerDynamic>
    );
  }

  return content;
}
