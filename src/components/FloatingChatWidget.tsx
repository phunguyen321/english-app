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
// import PersonIcon from "@mui/icons-material/Person"; // Removed unused import
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { ChatMessage } from "@/types/chat";
import AppAPI from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function FloatingChatWidget() {
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [kbOffset, setKbOffset] = React.useState(0);
  const inputBoxRef = React.useRef<HTMLDivElement | null>(null);
  const [inputHeight, setInputHeight] = React.useState(56);

  // Keep input above mobile virtual keyboard using VisualViewport
  React.useEffect(() => {
    if (!open || !smDown) {
      setKbOffset(0);
      return;
    }
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return; // Fallback: do nothing if not supported
    const update = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbOffset(offset);
      // Nudge scroll to bottom so input and latest message are visible
      const el = containerRef.current;
      if (el) {
        // small async to let layout settle
        setTimeout(() => {
          el.scrollTop = el.scrollHeight;
        }, 0);
      }
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [open, smDown]);

  // Track input box height (multiline grows), so we can reserve space in the message list
  React.useEffect(() => {
    const el = inputBoxRef.current;
    if (!el || !(window as any).ResizeObserver) return;
    const ro = new (window as any).ResizeObserver((entries: any) => {
      const cr = entries[0]?.contentRect;
      if (cr) setInputHeight(Math.ceil(cr.height));
    });
    ro.observe(el);
    // Initial measure
    setInputHeight(el.getBoundingClientRect().height || 56);
    return () => ro.disconnect();
  }, [open]);
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
      const data = await AppAPI.chat(next);
      if (!data?.success) throw new Error(data?.error || "Lỗi API");
      const textResp: string = data.data?.text || "(Không có phản hồi)";
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

  // Markdown code block with copy button
  const CodeBlock = (props: any) => {
    const { inline, children, ...rest } = props || {};
    if (inline) return <code {...rest}>{children}</code>;
    const text = React.Children.toArray(children).join("");
    const onCopy = () => {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(text as string).catch(() => {});
      }
    };
    return (
      <Box sx={{ position: "relative" }}>
        <IconButton
          size="small"
          aria-label="Copy code"
          onClick={onCopy}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            bgcolor: "rgba(0,0,0,0.2)",
            color: "#fff",
            "&:hover": { bgcolor: "rgba(0,0,0,0.3)" },
          }}
        >
          <ContentCopyIcon sx={{ fontSize: 14 }} />
        </IconButton>
        <pre>
          <code {...rest}>{children}</code>
        </pre>
      </Box>
    );
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
              p: 1,
              bgcolor: (th) =>
                th.palette.mode === "light" ? "#f8fafc" : "#0b1220",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              // Reserve space for the input box plus keyboard offset
              pb: `${inputHeight + kbOffset + 8}px`,
            }}
          >
            {messages.length === 0 && !loading && (
              <Stack
                direction="row"
                spacing={0}
                alignItems="flex-end"
                justifyContent="flex-start"
              >
                <Box
                  sx={{
                    bgcolor: "transparent",
                    color: (th) => th.palette.text.primary,
                    px: 1.25,
                    py: 0.75,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 12,
                    borderBottomRightRadius: 12,
                    borderBottomLeftRadius: 4,
                    maxWidth: "94%",
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                    Xin chào! Hãy hỏi mình về từ vựng, ngữ pháp, ví dụ câu...
                  </Typography>
                </Box>
              </Stack>
            )}

            <Stack spacing={1}>
              {messages.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <Stack
                    key={i}
                    direction="row"
                    justifyContent={isUser ? "flex-end" : "flex-start"}
                    alignItems="stretch"
                    spacing={0}
                  >
                    <Box
                      sx={{
                        bgcolor: isUser ? "#e9eef6" : "transparent",
                        color: isUser
                          ? (th) => th.palette.getContrastText("#e9eef6")
                          : (th) => th.palette.text.primary,
                        px: 1.25,
                        py: 0.75,
                        borderTopLeftRadius: isUser ? 12 : 8,
                        borderTopRightRadius: isUser ? 8 : 12,
                        borderBottomRightRadius: isUser ? 4 : 12,
                        borderBottomLeftRadius: isUser ? 12 : 4,
                        maxWidth: { xs: "94%", sm: "88%" },
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        "& p": { m: 0, mb: 0.5 },
                        "& p:last-child": { mb: 0 },
                        "& ul, & ol": { mt: 0, mb: 0.5, pl: 2.25 },
                        "& li": { mb: 0.25 },
                        "& code": {
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          bgcolor: "rgba(255,255,255,0.16)",
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 1,
                          display: "inline-block",
                        },
                        "& pre": { m: 0 },
                        "& pre code": {
                          display: "block",
                          px: 1,
                          py: 1,
                          overflowX: "auto",
                          bgcolor: "rgba(0,0,0,0.18)",
                          borderRadius: 1.5,
                        },
                        "& a": {
                          color: "inherit",
                          textDecoration: "underline",
                          textUnderlineOffset: "2px",
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        component="div"
                        sx={{ fontSize: 14, lineHeight: 1.55 }}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: (props: React.ComponentProps<"a">) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                            code: CodeBlock as any,
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
              {loading && (
                <Stack direction="row" spacing={0} alignItems="center">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 0.5,
                    }}
                  >
                    <CircularProgress size={14} />
                    <Typography variant="body2">Đang soạn trả lời…</Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Input */}
          <Box
            ref={inputBoxRef}
            sx={{
              p: 1,
              borderTop: 1,
              borderColor: "divider",
              position: "absolute",
              left: 0,
              right: 0,
              bottom: kbOffset,
              bgcolor: (th) => th.palette.background.paper,
              boxShadow: 3,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                size="small"
                placeholder="Nhập câu hỏi..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => {
                  const el = containerRef.current;
                  if (el) setTimeout(() => (el.scrollTop = el.scrollHeight), 0);
                }}
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
