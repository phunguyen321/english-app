"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useAppDispatch, useAppSelector, type RootState } from "@/store";
import {
  loadVocab,
  nextCard,
  prevCard,
  shuffleFlashcards,
  toggleAnswer,
  setFlashcardSubset,
} from "@/store/slices/vocabSlice";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  TextField,
  Button,
  Chip,
  LinearProgress,
  InputAdornment,
  IconButton,
  Tooltip,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import { alpha } from "@mui/material/styles";

export default function VocabularyPage() {
  const dispatch = useAppDispatch();
  const { topics, entries, status, flashcard } = useAppSelector(
    (s: RootState) => s.vocab
  );

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [showExamples, setShowExamples] = useState(true);
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(50);
  const [flashMode, setFlashMode] = useState(false);
  const [shuffleTopicMix, setShuffleTopicMix] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardW, setCardW] = useState(480);
  const [anim, setAnim] = useState<
    | "idle"
    | "leaving-left"
    | "leaving-right"
    | "entering-left"
    | "entering-right"
  >("idle");
  // Pointer tracking refs for precision
  const pDown = useRef(false);
  const startXRef = useRef(0);
  const startTRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const prevXRef = useRef(0);
  const prevTRef = useRef(0);

  // Fixed animation + cue (smooth + gradient + soft)
  const transitionMs = 260;
  const leaveMs = 220;
  const enterMs = 280;
  const easing = "cubic-bezier(.22,.61,.36,1)";
  const enterOffsetFactor = 0.35;

  // Dynamic thresholds based on card width
  const SWIPE_DIST = Math.max(80, Math.round((cardW || 480) * 0.18));
  const SWIPE_VEL = 0.4;

  useEffect(() => {
    if (status === "idle") dispatch(loadVocab());
  }, [status, dispatch]);

  useEffect(() => {
    const n = entries.length;
    if (n === 0) return;
    const s = Math.max(1, Math.min(start, n));
    const e = Math.max(s, Math.min(end, n));
    const allIndices = Array.from({ length: e - s + 1 }, (_, i) => i + (s - 1));

    const byTopic = selectedTopics.length
      ? allIndices.filter((i) => selectedTopics.includes(entries[i].topicId))
      : allIndices;

    const bySearch = search.trim()
      ? byTopic.filter((i) => {
          const it = entries[i];
          const needle = search.toLowerCase();
          return (
            it.word.toLowerCase().includes(needle) ||
            it.meaningVi.toLowerCase().includes(needle) ||
            (it.examples || []).some(
              (ex) =>
                ex.en.toLowerCase().includes(needle) ||
                ex.vi.toLowerCase().includes(needle)
            )
          );
        })
      : byTopic;

    const finalOrder = shuffleTopicMix ? shuffleSimple(bySearch) : bySearch;
    dispatch(setFlashcardSubset(finalOrder));
  }, [entries, start, end, selectedTopics, search, shuffleTopicMix, dispatch]);

  const topicName: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of topics) map[t.id] = t.name;
    return map;
  }, [topics]);

  const filteredIndices = flashcard.order;
  const current = entries[filteredIndices[flashcard.index]];

  const startFlashcards = () => {
    setFlashMode(true);
    dispatch(shuffleFlashcards());
  };

  const bounceToCenter = () => {
    setDragging(false);
    setAnim("idle");
    setDragX(0);
  };

  const animateSwipe = (dir: "left" | "right") => {
    const dist = (cardW || 480) + 80;
    setDragging(false);
    if (dir === "left") {
      setAnim("leaving-left");
      setDragX(-dist);
      setTimeout(() => {
        dispatch(nextCard());
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
        dispatch(prevCard());
        setAnim("entering-left");
        setDragX(-dist * enterOffsetFactor);
        requestAnimationFrame(() => {
          setDragX(0);
          setTimeout(() => setAnim("idle"), enterMs);
        });
      }, leaveMs);
    }
  };

  // Precise pointer-based drag (mouse + touch)
  const TAP_SLOP = 6;
  const TAP_MS = 250;
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
    const max = Math.round((cardW || 480) * 0.35);
    setDragX(Math.max(-max, Math.min(max, dx)));
    // track velocity using recent step
    prevXRef.current = lastXRef.current;
    prevTRef.current = lastTRef.current;
    lastXRef.current = e.clientX;
    lastTRef.current = Date.now();
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!pDown.current) return;
    const dtRecent = Math.max(1, lastTRef.current - prevTRef.current);
    const vxRecent = (lastXRef.current - prevXRef.current) / dtRecent; // px/ms
    const vx = vxRecent * 1000; // px/s approx
    const dx = dragX;
    pDown.current = false;
    const now = Date.now();
    const tap = Math.abs(dx) < TAP_SLOP && now - startTRef.current < TAP_MS;
    if (tap) {
      dispatch(toggleAnswer());
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

  // Opacity for background color cues (soft)
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
    <Box>
      <Typography variant="h4" gutterBottom>
        Từ vựng thông dụng
      </Typography>
      {status === "loading" && <LinearProgress />}

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ md: "center" }}
          >
            <TextField
              size="small"
              type="number"
              label="Học từ"
              value={start}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setStart(Number(e.target.value))
              }
              sx={{ width: 120 }}
              inputProps={{ min: 1 }}
            />
            <TextField
              size="small"
              type="number"
              label="đến"
              value={end}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEnd(Number(e.target.value))
              }
              sx={{ width: 120 }}
              inputProps={{ min: 1 }}
            />
            <TextField
              size="small"
              label="Tìm kiếm"
              placeholder="từ, nghĩa hoặc ví dụ"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              sx={{ minWidth: { xs: "100%", md: 260 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={shuffleTopicMix}
                  onChange={(e) => setShuffleTopicMix(e.target.checked)}
                />
              }
              label="Xáo trộn chủ đề"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showExamples}
                  onChange={(e) => setShowExamples(e.target.checked)}
                />
              }
              label={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <VisibilityIcon fontSize="small" />
                  <span>Hiện ví dụ</span>
                </Stack>
              }
            />
            <Stack direction="row" spacing={1} sx={{ ml: { md: "auto" } }}>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={startFlashcards}
              >
                Học Flashcards
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShuffleIcon />}
                onClick={() => dispatch(shuffleFlashcards())}
              >
                Xáo trộn
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems="stretch"
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={{ p: 2, height: "100%" }}>
            <CardContent>
              {flashMode ? (
                <Stack spacing={2} alignItems="center">
                  <Typography variant="h6">Flash Card</Typography>
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: 560,
                      minHeight: 160,
                    }}
                  >
                    {/* Colored background overlays */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                        borderRadius: 2,
                        zIndex: 0,
                      }}
                    >
                      <>
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
                      </>
                    </Box>

                    {/* Dragging card */}
                    <Box
                      ref={cardRef}
                      sx={{
                        position: "relative",
                        zIndex: 1,
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        touchAction: "pan-y",
                        transform: `translateX(${dragX}px) rotate(${
                          dragX / 28
                        }deg)`,
                        transition: dragging
                          ? "none"
                          : `transform ${transitionMs}ms ${easing}, opacity ${transitionMs}ms ease`,
                        opacity:
                          anim.startsWith("leaving") ||
                          anim.startsWith("entering")
                            ? 0.98
                            : 1,
                        backgroundColor: "background.paper",
                        boxShadow: (theme) => theme.shadows[2],
                      }}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={onPointerUp}
                    >
                      <Typography variant="h3" textAlign="center">
                        {current?.word}
                      </Typography>
                      <Typography color="text.secondary" textAlign="center">
                        {current?.phonetic}
                        {current?.pos ? ` • ${current.pos}` : ""}
                      </Typography>
                      {flashcard.showAnswer && (
                        <Stack spacing={1} sx={{ width: "100%", mt: 1 }}>
                          <Divider />
                          <Typography
                            variant="h6"
                            textAlign="center"
                            noWrap={false}
                            sx={{
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              overflow: "visible",
                              textOverflow: "unset",
                              fontSize: { xs: "1rem", sm: "1.125rem" },
                              px: 1,
                            }}
                          >
                            {current?.meaningVi}
                          </Typography>
                          {showExamples && (
                            <ExampleList
                              examples={current?.examples}
                              max={2}
                              alignCenter
                            />
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
                            dragging && dragX < 0
                              ? Math.min(1, Math.abs(dragX) / 80)
                              : 0,
                          transition: "opacity 120ms",
                        }}
                      >
                        <ChevronLeftIcon
                          sx={{ fontSize: 48, color: "text.secondary" }}
                        />
                      </Box>
                      <Box
                        sx={{
                          opacity:
                            dragging && dragX > 0
                              ? Math.min(1, Math.abs(dragX) / 80)
                              : 0,
                          transition: "opacity 120ms",
                        }}
                      >
                        <ChevronRightIcon
                          sx={{ fontSize: 48, color: "text.secondary" }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Vuốt trái/phải • Chạm để hiện nghĩa
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Typography color="text.secondary">
                    Danh sách từ vựng theo bộ lọc hiện tại (chủ đề + phạm vi).
                    Bấm "Bắt đầu học Flashcards" để chuyển sang chế độ thẻ.
                  </Typography>
                  {filteredIndices.length === 0 ? (
                    <Typography>Hãy chọn ít nhất một chủ đề.</Typography>
                  ) : (
                    <Stack spacing={2}>
                      {filteredIndices.map((idx, i) => {
                        const e = entries[idx];
                        return (
                          <Card key={`${idx}-${e.word}`} variant="outlined">
                            <CardHeader
                              title={e.word}
                              subheader={
                                e.phonetic
                                  ? `${e.phonetic}${e.pos ? " • " + e.pos : ""}`
                                  : e.pos || undefined
                              }
                              action={
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                >
                                  <Chip
                                    size="small"
                                    icon={<LabelOutlinedIcon />}
                                    variant="outlined"
                                    label={topicName[e.topicId] || e.topicId}
                                  />
                                  <Chip
                                    size="small"
                                    icon={<SchoolOutlinedIcon />}
                                    color="info"
                                    label={e.level}
                                  />
                                </Stack>
                              }
                            />
                            <CardContent>
                              <Stack spacing={1}>
                                <Typography
                                  noWrap={false}
                                  sx={{
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    overflow: "visible",
                                    textOverflow: "unset",
                                  }}
                                >
                                  {e.meaningVi}
                                </Typography>
                                {showExamples && e.examples?.length ? (
                                  <ExampleList
                                    examples={e.examples}
                                    max={1}
                                    dense
                                  />
                                ) : null}
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  #{i + 1}
                                </Typography>
                              </Stack>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Stack>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={{ p: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chọn chủ đề để học
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                {topics.map((t) => {
                  const active = selectedTopics.includes(t.id);
                  return (
                    <Chip
                      key={t.id}
                      clickable
                      color={active ? "primary" : "default"}
                      variant={active ? "filled" : "outlined"}
                      label={`${t.name} (${t.level})`}
                      onClick={() =>
                        setSelectedTopics((prev) =>
                          prev.includes(t.id)
                            ? prev.filter((x) => x !== t.id)
                            : [...prev, t.id]
                        )
                      }
                    />
                  );
                })}
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  onClick={() => setSelectedTopics(topics.map((t) => t.id))}
                >
                  Chọn tất cả
                </Button>
                <Button size="small" onClick={() => setSelectedTopics([])}>
                  Bỏ chọn
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
}

function shuffleSimple(indices: number[]) {
  const arr = [...indices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type ExampleItem = { en: string; vi: string };

function ExampleList({
  examples,
  max = 2,
  dense = false,
  alignCenter = false,
}: {
  examples?: ExampleItem[];
  max?: number;
  dense?: boolean;
  alignCenter?: boolean;
}) {
  const items = (examples || []).slice(0, max);
  if (!items.length) return null;
  return (
    <Stack spacing={0.75} sx={{ width: "100%", mt: dense ? 0.25 : 0.5 }}>
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
          {/* quote icon */}
          <Box sx={{ pt: 0.25, color: "text.disabled" }}>
            <FormatQuoteRoundedIcon fontSize="small" />
          </Box>
          <Stack
            spacing={0.25}
            sx={{
              ...(alignCenter
                ? { alignItems: "center", textAlign: "center" }
                : {}),
            }}
          >
            <Typography
              variant={dense ? "body2" : "body1"}
              sx={{
                whiteSpace: "normal",
                wordBreak: "break-word",
              }}
            >
              {ex.en}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                whiteSpace: "normal",
                wordBreak: "break-word",
              }}
            >
              {ex.vi}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
