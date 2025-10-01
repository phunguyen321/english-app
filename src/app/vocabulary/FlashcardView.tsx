"use client";
import { useRef, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  LinearProgress,
  Button,
  Divider,
  Tooltip,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { alpha } from "@mui/material/styles";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import type { VocabEntry } from "@/types";

export interface FlashcardViewProps {
  entry?: VocabEntry;
  showAnswer: boolean;
  showExamples: boolean;
  index: number;
  total: number;
  onToggleAnswer: () => void;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  knowledgeState?: "unknown" | "learning" | "known";
  onMarkKnown?: () => void;
  onMarkLearning?: () => void;
  onMarkUnknown?: () => void;
}

// Small local example list (kept light so we don't depend on page internal component)
function ExampleList({
  examples,
  max = 2,
  alignCenter,
}: {
  examples?: Array<{ en: string; vi: string }>;
  max?: number;
  alignCenter?: boolean;
}) {
  const items = (examples || []).slice(0, max);
  if (!items.length) return null;
  return (
    <Stack spacing={0.75} sx={{ width: "100%", mt: 0.5 }}>
      {items.map((ex, i) => (
        <Box
          key={i}
          sx={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            columnGap: 1,
            alignItems: "start",
          }}
        >
          <Box sx={{ pt: 0.25, color: "text.disabled" }}>
            <FormatQuoteRoundedIcon fontSize="small" />
          </Box>
          <Stack
            spacing={0.25}
            sx={
              alignCenter
                ? { alignItems: "center", textAlign: "center" }
                : undefined
            }
          >
            <Typography
              variant="body2"
              sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
            >
              {ex.en}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
            >
              {ex.vi}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

export default function FlashcardView(props: FlashcardViewProps) {
  const {
    entry,
    showAnswer,
    showExamples,
    index,
    total,
    onToggleAnswer,
    onNext,
    onPrev,
    onExit,
    knowledgeState,
    onMarkKnown,
    onMarkLearning,
    onMarkUnknown,
  } = props;

  // Swipe / gesture logic (adapted from original page)
  const [dragX, setDragX] = useState(0);
  const [anim, setAnim] = useState<
    | "idle"
    | "leaving-left"
    | "leaving-right"
    | "entering-left"
    | "entering-right"
  >("idle");
  const [dragging, setDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const transitionMs = 260;
  const leaveMs = 220;
  const enterMs = 280;
  const easing = "cubic-bezier(.22,.61,.36,1)";
  const enterOffsetFactor = 0.35;
  const cardW = 480;
  const SWIPE_DIST = Math.max(80, Math.round(cardW * 0.18));
  const SWIPE_VEL = 0.4;
  const pDown = useRef(false);
  const startXRef = useRef(0);
  const startTRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const prevXRef = useRef(0);
  const prevTRef = useRef(0);
  const TAP_SLOP = 6;
  const TAP_MS = 250;

  const bounceToCenter = () => {
    setDragging(false);
    setAnim("idle");
    setDragX(0);
  };
  const animateSwipe = (dir: "left" | "right") => {
    const dist = cardW + 80;
    setDragging(false);
    if (dir === "left") {
      setAnim("leaving-left");
      setDragX(-dist);
      setTimeout(() => {
        onNext();
        setAnim("entering-right");
        setDragX(dist * enterOffsetFactor);
        requestAnimationFrame(() => {
          setDragX(0);
          setTimeout(() => setAnim("idle"), enterMs);
        });
      }, leaveMs);
    } else {
      setAnim("leaving-right");
      setDragX(dist);
      setTimeout(() => {
        onPrev();
        setAnim("entering-left");
        setDragX(-dist * enterOffsetFactor);
        requestAnimationFrame(() => {
          setDragX(0);
          setTimeout(() => setAnim("idle"), enterMs);
        });
      }, leaveMs);
    }
  };
  const onPointerDown = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture?.(e.pointerId);
    pDown.current = true;
    setDragging(true);
    startXRef.current = e.clientX;
    startTRef.current = Date.now();
    lastXRef.current = e.clientX;
    lastTRef.current = startTRef.current;
    prevXRef.current = e.clientX;
    prevTRef.current = startTRef.current;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pDown.current) return;
    const dx = e.clientX - startXRef.current;
    const max = Math.round(cardW * 0.35);
    setDragX(Math.max(-max, Math.min(max, dx)));
    prevXRef.current = lastXRef.current;
    prevTRef.current = lastTRef.current;
    lastXRef.current = e.clientX;
    lastTRef.current = Date.now();
  };
  const onPointerUp = () => {
    if (!pDown.current) return;
    const dtRecent = Math.max(1, lastTRef.current - prevTRef.current);
    const vxRecent = (lastXRef.current - prevXRef.current) / dtRecent;
    const vx = vxRecent * 1000; // px/s
    const dx = dragX;
    pDown.current = false;
    const now = Date.now();
    const tap = Math.abs(dx) < TAP_SLOP && now - startTRef.current < TAP_MS;
    if (tap) {
      onToggleAnswer();
      bounceToCenter();
      return;
    }
    if (vx < -SWIPE_VEL * 1000 || dx < -SWIPE_DIST) {
      animateSwipe("left");
    } else if (vx > SWIPE_VEL * 1000 || dx > SWIPE_DIST) {
      animateSwipe("right");
    } else {
      bounceToCenter();
    }
  };

  // Background color cues
  const alphaCap = 0.22;
  const leavingAlpha = 0.14;
  const leftAlpha =
    dragging && dragX < 0
      ? Math.min(alphaCap, (Math.abs(dragX) / Math.max(120, cardW)) * 0.9)
      : anim === "leaving-left"
      ? leavingAlpha
      : 0;
  const rightAlpha =
    dragging && dragX > 0
      ? Math.min(alphaCap, (Math.abs(dragX) / Math.max(120, cardW)) * 0.9)
      : anim === "leaving-right"
      ? leavingAlpha
      : 0;

  return (
    <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
      <Typography variant="h6">Flashcard</Typography>
      <Stack spacing={1} sx={{ width: "100%", maxWidth: 560 }}>
        <LinearProgress
          variant="determinate"
          value={total ? ((index + 1) / total) * 100 : 0}
          sx={{ borderRadius: 1, height: 6 }}
        />
        <Typography variant="caption" color="text.secondary" textAlign="center">
          {index + 1} / {total}
        </Typography>
      </Stack>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 560,
          minHeight: 170,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            borderRadius: 2,
            zIndex: 0,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: "0 50% 0 0",
              transition: "opacity 160ms",
              opacity: leftAlpha ? 1 : 0,
              background: (t) =>
                `linear-gradient(to right, ${alpha(
                  t.palette.error.main,
                  leftAlpha
                )} 0%, ${alpha(
                  t.palette.error.main,
                  Math.max(0, leftAlpha - 0.12)
                )} 25%, transparent 85%)`,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: "0 0 0 50%",
              transition: "opacity 160ms",
              opacity: rightAlpha ? 1 : 0,
              background: (t) =>
                `linear-gradient(to left, ${alpha(
                  t.palette.success.main,
                  rightAlpha
                )} 0%, ${alpha(
                  t.palette.success.main,
                  Math.max(0, rightAlpha - 0.12)
                )} 25%, transparent 85%)`,
            }}
          />
        </Box>
        <Box
          ref={cardRef}
          role="button"
          aria-label="flashcard"
          tabIndex={0}
          sx={{
            position: "relative",
            zIndex: 1,
            borderRadius: 2,
            px: 2,
            py: 1.25,
            touchAction: "pan-y",
            transform: `translateX(${dragX}px) rotate(${dragX / 28}deg)`,
            transition: dragging
              ? "none"
              : `transform ${transitionMs}ms ${easing}, opacity ${transitionMs}ms ease`,
            opacity:
              anim.startsWith("leaving") || anim.startsWith("entering")
                ? 0.98
                : 1,
            backgroundColor: "background.paper",
            boxShadow: (theme) => theme.shadows[2],
            cursor: "pointer",
            userSelect: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(e) => {
            if (e.code === "Space") {
              e.preventDefault();
              onToggleAnswer();
            } else if (e.key === "ArrowRight") {
              onNext();
            } else if (e.key === "ArrowLeft") {
              onPrev();
            } else if (e.key === "Escape") {
              onExit();
            }
          }}
        >
          <Typography variant="h3" textAlign="center">
            {entry?.word || "—"}
          </Typography>
          <Typography color="text.secondary" textAlign="center">
            {entry?.phonetic}
            {entry?.pos ? ` • ${entry.pos}` : ""}
          </Typography>
          {showAnswer && (
            <Stack spacing={1} sx={{ width: "100%", mt: 1 }}>
              <Divider />
              <Typography
                variant="h6"
                textAlign="center"
                sx={{
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  fontSize: { xs: "1rem", sm: "1.125rem" },
                  px: 1,
                }}
              >
                {entry?.meaningVi}
              </Typography>
              {showExamples && (
                <ExampleList examples={entry?.examples} max={2} alignCenter />
              )}
            </Stack>
          )}
        </Box>
        {/* Arrow overlays */}
        <Box
          sx={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1,
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              opacity:
                dragging && dragX < 0 ? Math.min(1, Math.abs(dragX) / 80) : 0,
              transition: "opacity 120ms",
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 48, color: "text.secondary" }} />
          </Box>
          <Box
            sx={{
              opacity:
                dragging && dragX > 0 ? Math.min(1, Math.abs(dragX) / 80) : 0,
              transition: "opacity 120ms",
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 48, color: "text.secondary" }} />
          </Box>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Vuốt trái/phải • Space hiện nghĩa • ← → điều hướng • Esc thoát
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        justifyContent="center"
      >
        <Tooltip title={showAnswer ? "Ẩn nghĩa" : "Hiện nghĩa"}>
          <Button
            variant="contained"
            size="small"
            startIcon={showAnswer ? <VisibilityOffIcon /> : <VisibilityIcon />}
            onClick={onToggleAnswer}
          >
            {showAnswer ? "Ẩn nghĩa" : "Hiện nghĩa"}
          </Button>
        </Tooltip>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ChevronLeftIcon />}
          onClick={onPrev}
        >
          Trước
        </Button>
        <Button
          variant="outlined"
          size="small"
          endIcon={<ChevronRightIcon />}
          onClick={onNext}
        >
          Tiếp
        </Button>
        <Button
          variant="text"
          size="small"
          color="error"
          startIcon={<ExitToAppIcon />}
          onClick={onExit}
        >
          Thoát
        </Button>
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        justifyContent="center"
        sx={{ mt: 1 }}
      >
        <Button
          size="small"
          variant={knowledgeState === "unknown" ? "contained" : "outlined"}
          color="warning"
          onClick={onMarkUnknown}
        >
          Chưa thuộc
        </Button>
        <Button
          size="small"
          variant={knowledgeState === "learning" ? "contained" : "outlined"}
          color="info"
          onClick={onMarkLearning}
        >
          Chưa chắc
        </Button>
        <Button
          size="small"
          variant={knowledgeState === "known" ? "contained" : "outlined"}
          color="success"
          onClick={onMarkKnown}
        >
          Đã thuộc
        </Button>
      </Stack>
    </Stack>
  );
}
