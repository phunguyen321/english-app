"use client";
import React from "react";
import {
  Box,
  Paper,
  Stack,
  IconButton,
  TextField,
  Avatar,
  Typography,
  CircularProgress,
  Fab,
  Grow,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";

type Role = "user" | "model";
interface ChatMessage {
  role: Role;
  content: string;
}

export default function FloatingChatWidget() {
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const fabRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ right: number; bottom: number }>(
    () => ({ right: 16, bottom: 16 })
  );
  const dragRef = React.useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    moved: 0,
  });
  const [scrolling, setScrolling] = React.useState(false);
  const scrollTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (open) {
      // Small delay to ensure DOM ready then scroll to bottom
      const t = setTimeout(() => {
        const el = containerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
      return () => clearTimeout(t);
    }
  }, [open, messages.length]);

  // Dim the FAB slightly while the user is scrolling to reduce distraction
  React.useEffect(() => {
    const onScroll = () => {
      setScrolling(true);
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }
      scrollTimerRef.current = window.setTimeout(() => {
        setScrolling(false);
      }, 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Lỗi API");
      const textResp: string = data.data.text || "(Không có phản hồi)";
      setMessages((prev) => [...prev, { role: "model", content: textResp }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: `Xin lỗi, đã có lỗi khi trả lời: ${msg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Lock background scroll on mobile when chat is open
  React.useEffect(() => {
    if (!smDown) return;
    const html = document.documentElement as HTMLElement;
    if (open) {
      const prevBody = document.body.style.overflow;
      const prevHtml = html.style.overflow;
      const prevOB = html.style.getPropertyValue("overscroll-behavior");
      document.body.style.overflow = "hidden";
      html.style.overflow = "hidden";
      html.style.setProperty("overscroll-behavior", "contain");
      return () => {
        document.body.style.overflow = prevBody;
        html.style.overflow = prevHtml;
        if (prevOB) html.style.setProperty("overscroll-behavior", prevOB);
        else html.style.removeProperty("overscroll-behavior");
      };
    }
  }, [open, smDown]);
  // Draggable FAB handlers
  const onFabPointerDown: React.PointerEventHandler<HTMLButtonElement> = (
    e
  ) => {
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.moved = 0;
  };

  const onFabPointerMove: React.PointerEventHandler<HTMLButtonElement> = (
    e
  ) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    dragRef.current.moved = Math.max(dragRef.current.moved, Math.hypot(dx, dy));

    const FAB_SIZE_MOBILE = 52;
    const FAB_SIZE_DESKTOP = 56;
    const btnSize = smDown ? FAB_SIZE_MOBILE : FAB_SIZE_DESKTOP;
    // Compute new left/top centered on pointer
    const left = Math.max(
      8,
      Math.min(e.clientX - btnSize / 2, window.innerWidth - btnSize - 8)
    );
    const top = Math.max(
      8,
      Math.min(e.clientY - btnSize / 2, window.innerHeight - btnSize - 8)
    );
    const right = Math.max(8, window.innerWidth - left - btnSize);
    const bottom = Math.max(8, window.innerHeight - top - btnSize);
    setPos({ right, bottom });
  };

  const onFabPointerUp: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    if (!dragRef.current.dragging) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    const moved = dragRef.current.moved;
    dragRef.current.dragging = false;
    // Treat as click if not dragged much
    if (moved < 6) setOpen((v) => !v);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <Fab
          ref={fabRef}
          color="primary"
          aria-label="Chat AI"
          size="small"
          onPointerDown={onFabPointerDown}
          onPointerMove={onFabPointerMove}
          onPointerUp={onFabPointerUp}
          sx={{
            position: "fixed",
            right: pos.right,
            bottom: pos.bottom,
            zIndex: (th) => th.zIndex.modal + 1,
            boxShadow: 6,
            width: smDown ? 52 : 56,
            height: smDown ? 52 : 56,
            cursor: dragRef.current.dragging ? "grabbing" : "grab",
            touchAction: "none", // prevent scrolling while dragging
            opacity: scrolling ? (smDown ? 0.72 : 0.78) : 1,
          }}
        >
          <SmartToyIcon fontSize="small" />
        </Fab>
      )}

      {/* Chat window */}
      <Grow in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            ...(smDown
              ? {
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: "100vw",
                  height: "100dvh",
                  maxHeight: "100dvh",
                  borderRadius: 0,
                }
              : {
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: "min(480px, 40vw)",
                  maxWidth: 560,
                  height: "100dvh",
                  borderRadius: 0,
                  borderLeft: (th) => `1px solid ${th.palette.divider}`,
                }),
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: (th) => th.zIndex.modal + 2,
            backdropFilter: "saturate(1.1)",
            overscrollBehavior: "contain",
          }}
          onWheelCapture={(e) => e.stopPropagation()}
          onTouchMoveCapture={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ px: 1.25, py: 1, borderBottom: 1, borderColor: "divider" }}
          >
            <Avatar sx={{ bgcolor: "primary.main", width: 28, height: 28 }}>
              <SmartToyIcon fontSize="small" />
            </Avatar>
            <Typography variant="subtitle1" fontWeight={700}>
              Trợ lý AI
            </Typography>
            <Box flexGrow={1} />
            <IconButton size="small" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {/* Messages */}
          <Box
            ref={containerRef}
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 1.25,
              bgcolor: (th) =>
                th.palette.mode === "light" ? "#f8fafc" : "#0b1220",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {messages.length === 0 && !loading && (
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <SmartToyIcon />
                </Avatar>
                <Box
                  sx={{
                    bgcolor: "primary.light",
                    color: "primary.contrastText",
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2">
                    Xin chào! Hãy hỏi mình về từ vựng, ngữ pháp, ví dụ câu...
                  </Typography>
                </Box>
              </Stack>
            )}

            <Stack spacing={1.25}>
              {messages.map((m, i) => (
                <Stack
                  key={i}
                  direction="row"
                  spacing={1}
                  alignItems="flex-start"
                >
                  <Avatar
                    sx={{
                      bgcolor: m.role === "user" ? "info.main" : "primary.main",
                    }}
                  >
                    {m.role === "user" ? <PersonIcon /> : <SmartToyIcon />}
                  </Avatar>
                  <Box
                    sx={{
                      bgcolor:
                        m.role === "user" ? "info.light" : "primary.light",
                      color:
                        m.role === "user"
                          ? "info.contrastText"
                          : "primary.contrastText",
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      maxWidth: "80%",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <Typography variant="body2">{m.content}</Typography>
                  </Box>
                </Stack>
              ))}
              {loading && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    <SmartToyIcon />
                  </Avatar>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2">Đang soạn trả lời…</Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Input */}
          <Box sx={{ p: 1, borderTop: 1, borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                size="small"
                placeholder="Nhập câu hỏi..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                multiline
                maxRows={4}
              />
              <IconButton
                color="primary"
                onClick={send}
                disabled={loading || !input.trim()}
                aria-label="Gửi"
              >
                <SendIcon />
              </IconButton>
            </Stack>
          </Box>
        </Paper>
      </Grow>
    </>
  );
}
