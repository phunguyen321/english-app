"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector, type RootState } from "@/store";
import {
  loadVocab,
  shuffleRemaining,
  toggleAnswer,
  setFlashcardOrder,
  nextCard,
  prevCard,
  markKnown,
  markLearning,
  markUnknown,
  loadKnowledge,
  setListOrder,
  shuffleList,
  shuffleFromCurrent,
} from "@/store/slices/vocabSlice";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  useMediaQuery,
  Stack,
  TextField,
  Button,
  Chip,
  LinearProgress,
  Skeleton,
  InputAdornment,
  Switch,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Checkbox,
  Drawer,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FilterListIcon from "@mui/icons-material/FilterList";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import ViewListIcon from "@mui/icons-material/ViewList";
import CheckIcon from "@mui/icons-material/Check";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import FlashcardView from "./FlashcardView";

export default function VocabularyPage() {
  const theme = useTheme();
  useMediaQuery(theme.breakpoints.down("lg"));
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { topics, entries, status, flashcard, knowledge, listOrder } =
    useAppSelector((s: RootState) => s.vocab);

  // UI state
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [showExamples, setShowExamples] = useState(true);
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState<number | null>(null); // null = tới cuối danh sách
  const [flashMode, setFlashMode] = useState(false);
  const [shuffleTopicMix, setShuffleTopicMix] = useState(false);
  const [filterLevels, setFilterLevels] = useState<string[]>([]);
  const [knowledgeFilter, setKnowledgeFilter] = useState<
    "all" | "unknown" | "learning" | "known"
  >("all");
  const [compact, setCompact] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const prevOrderKeyRef = useRef<string>("");
  const urlInitedRef = useRef(false);

  // Initial load
  useEffect(() => {
    if (status === "idle") dispatch(loadVocab());
  }, [status, dispatch]);

  // Load persisted knowledge
  useEffect(() => {
    try {
      const raw = localStorage.getItem("vocabKnowledge");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          dispatch(loadKnowledge(parsed));
        }
      }
    } catch {}
  }, [dispatch]);

  // Persist knowledge
  useEffect(() => {
    try {
      localStorage.setItem("vocabKnowledge", JSON.stringify(knowledge));
    } catch {}
  }, [knowledge]);

  // Recompute LIST order whenever filters change (kept separate from flashcards)
  useEffect(() => {
    // do not depend on flash animations; list is independent
    const n = entries.length;
    if (!n) return;
    const s = Math.max(1, Math.min(start || 1, n));
    const eRaw = end == null ? n : end;
    const e = Math.max(s, Math.min(eRaw, n));
    let pipeline = Array.from({ length: e - s + 1 }, (_, i) => i + (s - 1));
    if (selectedTopics.length)
      pipeline = pipeline.filter((i) =>
        selectedTopics.includes(entries[i].topicId)
      );
    if (filterLevels.length)
      pipeline = pipeline.filter((i) =>
        filterLevels.includes(entries[i].level)
      );
    // POS filter removed
    if (knowledgeFilter !== "all")
      pipeline = pipeline.filter(
        (i) => (knowledge[entries[i].id] || "unknown") === knowledgeFilter
      );
    if (search.trim()) {
      const needle = search.toLowerCase();
      pipeline = pipeline.filter((i) => {
        const it = entries[i];
        return (
          it.word.toLowerCase().includes(needle) ||
          it.meaningVi.toLowerCase().includes(needle) ||
          (it.examples || []).some(
            (ex) =>
              ex.en.toLowerCase().includes(needle) ||
              ex.vi.toLowerCase().includes(needle)
          )
        );
      });
    }
    // Preserve current LIST order as much as possible: filter out removed items and append new ones at the end.
    let finalOrder: number[];
    {
      const prev = listOrder;
      if (prev.length) {
        const setP = new Set(pipeline);
        const kept = prev.filter((i) => setP.has(i));
        const missing = pipeline.filter((i) => !prev.includes(i));
        finalOrder = kept.concat(missing);
      } else {
        finalOrder = pipeline; // default: no shuffle for list on init
      }
    }
    const sameList =
      finalOrder.length === listOrder.length &&
      finalOrder.every((v, i) => v === listOrder[i]);
    if (!sameList) dispatch(setListOrder(finalOrder));
  }, [
    entries,
    start,
    end,
    selectedTopics,
    search,
    filterLevels,
    knowledgeFilter,
    knowledge,
    listOrder,
    dispatch,
  ]);

  // Base pipeline not filtered by topic for sidebar stats
  const basePipeline = useMemo(() => {
    const n = entries.length;
    if (!n) return [] as number[];
    const s = Math.max(1, Math.min(start || 1, n));
    const eRaw = end == null ? n : end;
    const e = Math.max(s, Math.min(eRaw, n));
    let pipeline = Array.from({ length: e - s + 1 }, (_, i) => i + (s - 1));
    if (filterLevels.length)
      pipeline = pipeline.filter((i) =>
        filterLevels.includes(entries[i].level)
      );
    if (knowledgeFilter !== "all")
      pipeline = pipeline.filter(
        (i) => (knowledge[entries[i].id] || "unknown") === knowledgeFilter
      );
    if (search.trim()) {
      const needle = search.toLowerCase();
      pipeline = pipeline.filter((i) => {
        const it = entries[i];
        return (
          it.word.toLowerCase().includes(needle) ||
          it.meaningVi.toLowerCase().includes(needle) ||
          (it.examples || []).some(
            (ex) =>
              ex.en.toLowerCase().includes(needle) ||
              ex.vi.toLowerCase().includes(needle)
          )
        );
      });
    }
    return pipeline;
  }, [entries, start, end, filterLevels, knowledgeFilter, knowledge, search]);

  // Topic stats for sidebar
  const topicStats = useMemo(() => {
    const stats: Record<
      string,
      { total: number; known: number; learning: number; unknown: number }
    > = {};
    for (const t of topics)
      stats[t.id] = { total: 0, known: 0, learning: 0, unknown: 0 };
    for (const i of basePipeline) {
      const it = entries[i];
      if (!it) continue;
      const k = (knowledge[it.id] || "unknown") as KnowledgeState;
      const s = stats[it.topicId] || {
        total: 0,
        known: 0,
        learning: 0,
        unknown: 0,
      };
      s.total += 1;
      (s[k] as number) += 1;
      stats[it.topicId] = s;
    }
    return stats;
  }, [topics, basePipeline, entries, knowledge]);

  const topicName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of topics) map[t.id] = t.name;
    return map;
  }, [topics]);

  const current = entries[flashcard.order[flashcard.index]];

  const startFlashcards = () => {
    // Enter flash mode with current LIST order; no auto-shuffle
    dispatch(
      setFlashcardOrder({
        order: listOrder.length ? listOrder : entries.map((_, i) => i),
        index: 0,
      })
    );
    // Hide filter UI when entering flash mode
    setMobileFilterOpen(false);
    setFlashMode(true);
  };
  const handleShuffle = () => {
    if (flashMode) {
      // In flash mode: only shuffle the remaining cards after current index
      dispatch(shuffleRemaining());
    } else {
      // In list mode: shuffle list order only
      dispatch(shuffleList());
    }
  };

  // Mobile presentation preferences: respect user's toggles on all devices
  const effectiveCompact = compact;
  const effectiveShowExamples = showExamples;

  // Detect when shuffle finished (order changed)
  useEffect(() => {
    const key = flashcard.order.join(",");
    if (prevOrderKeyRef.current && prevOrderKeyRef.current !== key) {
      setIsShuffling(false);
    }
    prevOrderKeyRef.current = key;
  }, [flashcard.order]);

  // Initialize state from URL (once)
  useEffect(() => {
    if (urlInitedRef.current) return;
    if (!searchParams) return;
    urlInitedRef.current = true;
    const sp = searchParams;
    const getBool = (k: string, def: boolean) => {
      const v = sp.get(k);
      if (v === null) return def;
      return v === "1" || v.toLowerCase() === "true";
    };
    const getNum = (k: string, def: number) => {
      const raw = sp.get(k);
      if (raw == null) return def;
      const v = Number(raw);
      return Number.isFinite(v) && v > 0 ? v : def;
    };
    const getCSV = (k: string) => {
      const v = sp.get(k);
      return v ? v.split(",").filter(Boolean) : [];
    };
    const q = sp.get("q");
    if (q !== null) setSearch(q);
    setStart(getNum("s", 1));
    const eParam = sp.get("e");
    if (eParam !== null) {
      const v = Number(eParam);
      setEnd(Number.isFinite(v) && v > 0 ? v : null);
    } else {
      setEnd(null);
    }
    const topicsCSV = getCSV("topics");
    if (topicsCSV.length) setSelectedTopics(topicsCSV);
    const lvlsCSV = getCSV("lvls");
    if (lvlsCSV.length) setFilterLevels(lvlsCSV);
    const kf = sp.get("kf");
    const allowed: Array<"all" | "unknown" | "learning" | "known"> = [
      "all",
      "unknown",
      "learning",
      "known",
    ];
    if (kf && (allowed as readonly string[]).includes(kf))
      setKnowledgeFilter(kf as (typeof allowed)[number]);
    setShuffleTopicMix(getBool("mix", false));
    setCompact(getBool("compact", false));
    setShowExamples(getBool("showEx", true));
    // no group-by-topic
  }, [searchParams]);

  // Sync state to URL
  useEffect(() => {
    if (!pathname) return;
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (start) params.set("s", String(start));
    if (end != null) params.set("e", String(end));
    if (selectedTopics.length) params.set("topics", selectedTopics.join(","));
    if (filterLevels.length) params.set("lvls", filterLevels.join(","));
    if (knowledgeFilter !== "all") params.set("kf", knowledgeFilter);
    if (shuffleTopicMix) params.set("mix", "1");
    if (compact) params.set("compact", "1");
    if (!showExamples) params.set("showEx", "0");
    // no group-by-topic param
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    pathname,
    router,
    search,
    start,
    end,
    selectedTopics,
    filterLevels,
    knowledgeFilter,
    shuffleTopicMix,
    compact,
    showExamples,
  ]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Từ vựng thông dụng
      </Typography>
      {!flashMode && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Đã lọc: {listOrder.length || 0} từ
        </Typography>
      )}
      {status === "loading" && <LinearProgress />}

      {/* Top controls: hidden entirely in flash mode */}
      {!flashMode && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            {/* Search (left) + Actions (right) on md+, stacked on xs */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ md: "center" }}
            >
              <TextField
                size="medium"
                placeholder="từ, nghĩa hoặc ví dụ"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearch(e.target.value)
                }
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ccc",
                  },
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "#00c793",
                    },
                  "& .MuiInputBase-input::placeholder": {
                    color: "#a0a0a0",
                    fontStyle: "italic",
                  },
                }}
              />

              {/* Action buttons: Filter | HỌC THẺ | XÁO TRỘN */}
              <Stack
                direction="row"
                spacing={{ xs: 1, md: 1.5 }}
                alignItems="center"
                sx={{ ml: { md: "auto" } }}
                flexWrap="nowrap"
              >
                <Tooltip title="Bộ lọc">
                  <Button
                    aria-label="Mở bộ lọc"
                    variant="outlined"
                    onClick={() => setMobileFilterOpen(true)}
                    sx={{
                      width: 44,
                      minWidth: 44,
                      height: 44,
                      p: 0,
                      borderRadius: 1.5,
                      borderColor: "#00c793",
                      borderWidth: 2,
                      color: "#00c793",
                      "&:hover": {
                        bgcolor: "#f0fafa",
                        borderColor: "#00a87a",
                        color: "#00a87a",
                      },
                    }}
                  >
                    <FilterListIcon fontSize="small" />
                  </Button>
                </Tooltip>

                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon fontSize="small" />}
                  onClick={startFlashcards}
                  sx={{
                    height: 44,
                    textTransform: "uppercase",
                    fontWeight: 700,
                    fontSize: { xs: 12, md: 14 },
                    px: { xs: 1.25, md: 2 },
                    whiteSpace: "nowrap",
                    minWidth: { xs: 0, md: 64 },
                    borderRadius: 1.5,
                    bgcolor: "#00a87a",
                    color: "#fff",
                    border: "1px solid #00a87a",
                    boxShadow: "0 4px 8px rgba(0, 168, 122, 0.2)",
                    "&:hover": {
                      bgcolor: "#008f6c",
                      borderColor: "#008f6c",
                    },
                  }}
                >
                  Học thẻ
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<ShuffleIcon fontSize="small" />}
                  onClick={handleShuffle}
                  sx={{
                    height: 44,
                    textTransform: "uppercase",
                    fontWeight: 700,
                    fontSize: { xs: 12, md: 14 },
                    px: { xs: 1.25, md: 2 },
                    whiteSpace: "nowrap",
                    minWidth: { xs: 0, md: 64 },
                    borderRadius: 1.5,
                    borderColor: "#00c793",
                    color: "#00c793",
                    borderWidth: 2,
                    "&:hover": {
                      bgcolor: "#f0fafa",
                      borderColor: "#00a87a",
                      color: "#00a87a",
                    },
                  }}
                >
                  Xáo trộn
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", lg: "flex-start" }}
      >
        {/* Sidebar removed: all filters moved to Drawer */}
        <Box sx={{ display: "none" }} />

        {/* Main content: remove large background card wrapper */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {flashMode ? (
            <FlashcardView
              entry={current}
              showAnswer={flashcard.showAnswer}
              showExamples={effectiveShowExamples}
              index={flashcard.index}
              total={flashcard.order.length}
              onToggleAnswer={() => dispatch(toggleAnswer())}
              onNext={() => dispatch(nextCard())}
              onPrev={() => dispatch(prevCard())}
              onExit={() => setFlashMode(false)}
              onShuffle={() => {
                // Shuffle current and remaining cards; keep progress/index
                dispatch(shuffleFromCurrent());
              }}
              knowledgeState={current ? knowledge[current.id] : undefined}
              onMarkKnown={() => current && dispatch(markKnown(current.id))}
              onMarkLearning={() =>
                current && dispatch(markLearning(current.id))
              }
              onMarkUnknown={() => current && dispatch(markUnknown(current.id))}
            />
          ) : status === "loading" || isShuffling ? (
            <VocabularyListSkeleton
              rows={effectiveCompact ? 10 : 5}
              compact={effectiveCompact}
            />
          ) : (
            <VocabularyList
              entries={entries}
              order={listOrder.length ? listOrder : []}
              knowledge={knowledge}
              topicName={topicName}
              search={search}
              showExamples={effectiveShowExamples}
              compact={effectiveCompact}
              onMarkKnown={(id) => dispatch(markKnown(id))}
              onMarkLearning={(id) => dispatch(markLearning(id))}
              onMarkUnknown={(id) => dispatch(markUnknown(id))}
            />
          )}
        </Box>
      </Stack>

      {/* Filter drawer (hidden in flash mode) */}
      {!flashMode && (
        <Drawer
          anchor="right"
          open={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          PaperProps={{
            sx: {
              width: "80vw",
              maxWidth: 320,
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
            },
          }}
        >
          <Box sx={{ p: 2 }} role="presentation">
            {/* Title */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                pb: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              Bộ lọc
            </Typography>

            {/* Range filter */}
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                color: "text.secondary",
                mb: 1,
              }}
            >
              Phạm vi từ vựng
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <TextField
                size="small"
                type="number"
                value={start}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setStart(Number(e.target.value) || 1)
                }
                placeholder="1"
                inputProps={{ min: 1, style: { textAlign: "center" } }}
                sx={{ flex: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                đến
              </Typography>
              <TextField
                size="small"
                type="number"
                value={end ?? ""}
                placeholder="Tổng số từ"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const v = e.target.value;
                  if (v === "") setEnd(null);
                  else setEnd(Number(v));
                }}
                inputProps={{ min: 1, style: { textAlign: "center" } }}
                sx={{ flex: 1 }}
              />
            </Stack>

            {/* Topics */}
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                color: "text.secondary",
                mb: 1,
              }}
            >
              Chủ đề
            </Typography>
            <Box
              sx={{
                maxHeight: 240,
                overflowY: "auto",
                pr: 1,
                mb: 1,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
              }}
            >
              {topics.map((t) => {
                const st = topicStats[t.id] || {
                  total: 0,
                  known: 0,
                  learning: 0,
                  unknown: 0,
                };
                const checked = selectedTopics.includes(t.id);
                const pctKnown =
                  st.total > 0 ? Math.round((st.known / st.total) * 100) : 0;
                const toggleTopic = () =>
                  setSelectedTopics((prev) =>
                    prev.includes(t.id)
                      ? prev.filter((x) => x !== t.id)
                      : [...prev, t.id]
                  );
                return (
                  <Box
                    key={t.id}
                    onClick={toggleTopic}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      py: 1,
                      px: 1.25,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: (t) => t.palette.action.hover,
                      },
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTopic();
                      }}
                      disableRipple
                      icon={<CheckBoxOutlineBlankIcon />}
                      checkedIcon={<CheckBoxIcon color="primary" />}
                    />

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        sx={{ fontWeight: 600 }}
                        variant="body2"
                        noWrap
                      >
                        {t.name}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          {st.total} từ • {pctKnown}% đã thuộc
                        </Typography>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={pctKnown}
                            sx={{ height: 5, borderRadius: 2.5 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mb: 2 }}
              justifyContent="flex-end"
            >
              <Button
                size="small"
                onClick={() => setSelectedTopics(topics.map((t) => t.id))}
                sx={{ fontWeight: 700 }}
              >
                TẤT CẢ
              </Button>
              <Button
                size="small"
                onClick={() => setSelectedTopics([])}
                sx={{ fontWeight: 700 }}
              >
                XÓA
              </Button>
            </Stack>

            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                color: "text.secondary",
                mb: 1,
              }}
            >
              Cấp độ (CEFR)
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={filterLevels}
              onChange={(_, vals: string[]) => setFilterLevels(vals || [])}
              aria-label="level-filter"
              sx={{
                flexWrap: "wrap",
                gap: 1,
                mb: 2,
                border: 0,
                "& .MuiToggleButton-root": {
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  px: 1.25,
                  py: 0.5,
                  textTransform: "uppercase",
                  fontWeight: 600,
                },
                "& .MuiToggleButton-root.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "#fff",
                  borderColor: "primary.main",
                  "&:hover": { bgcolor: "primary.main" },
                },
              }}
            >
              {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map((lv) => (
                <ToggleButton key={lv} value={lv} aria-label={lv}>
                  {lv}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                color: "text.secondary",
                mb: 1,
              }}
            >
              Trạng thái học
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={knowledgeFilter}
              exclusive
              onChange={(_, val) => val && setKnowledgeFilter(val)}
              sx={{
                width: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                overflow: "hidden",
                mb: 2,
                "& .MuiToggleButton-root": {
                  flex: 1,
                  border: 0,
                  py: 1,
                  fontWeight: 600,
                  color: "text.secondary",
                },
                "& .MuiToggleButton-root.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "#fff",
                  "&:hover": { bgcolor: "primary.main" },
                },
              }}
            >
              <ToggleButton value="all">TẤT CẢ</ToggleButton>
              <ToggleButton value="unknown">CHƯA THUỘC</ToggleButton>
              <ToggleButton value="learning">CHƯA CHẮC</ToggleButton>
              <ToggleButton value="known">ĐÃ THUỘC</ToggleButton>
            </ToggleButtonGroup>

            {/* Toggle options */}
            <Box
              sx={{
                pt: 1.5,
                mt: 1,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack spacing={1.25} sx={{ mb: 1.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showExamples}
                      onChange={(e) => setShowExamples(e.target.checked)}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <VisibilityIcon fontSize="small" color="primary" />
                      <Typography>Hiện ví dụ</Typography>
                    </Stack>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={compact}
                      onChange={(e) => setCompact(e.target.checked)}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ViewListIcon fontSize="small" color="primary" />
                      <Typography>Danh sách gọn</Typography>
                    </Stack>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={shuffleTopicMix}
                      onChange={(e) => setShuffleTopicMix(e.target.checked)}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ShuffleIcon fontSize="small" color="primary" />
                      <Typography>Xáo trộn chủ đề</Typography>
                    </Stack>
                  }
                />
              </Stack>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 2,
                pt: 1.5,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Tooltip title="Reset mọi lọc">
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    setSelectedTopics([]);
                    setFilterLevels([]);
                    setKnowledgeFilter("all");
                    setShowExamples(true);
                    setCompact(false);
                    setShuffleTopicMix(false);
                    setStart(1);
                    setEnd(null);
                  }}
                >
                  RESET LỌC
                </Button>
              </Tooltip>
              <Button
                variant="contained"
                onClick={() => setMobileFilterOpen(false)}
              >
                ÁP DỤNG
              </Button>
            </Box>
          </Box>
        </Drawer>
      )}
    </Box>
  );
}

// removed unused shuffleSimple

// Highlight component
const Highlighted: React.FC<{ text: string; query: string }> = ({
  text,
  query,
}) => {
  if (!query.trim()) return <>{text}</>;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(safe, "ig");
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last)
      out.push(<span key={key++}>{text.slice(last, m.index)}</span>);
    out.push(
      <Box
        key={key++}
        component="mark"
        sx={{ px: 0.25, borderRadius: 0.5, backgroundColor: "warning.light" }}
      >
        {m[0]}
      </Box>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<span key={key++}>{text.slice(last)}</span>);
  return <>{out}</>;
};

// Example list reused
type ExampleItem = { en: string; vi: string };
function ExampleList({
  examples,
  max = 1,
  dense = false,
}: {
  examples?: ExampleItem[];
  max?: number;
  dense?: boolean;
}) {
  const items = (examples || []).slice(0, max);
  if (!items.length) return null;
  return (
    <Box
      sx={{
        mt: dense ? 0.5 : 1,
        pl: 1.5,
        pt: 1,
        borderLeft: "4px solid #ffc048",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "#ffc048",
          fontWeight: 700,
          mb: 0.5,
          display: "inline-block",
        }}
      >
        💡 Ví dụ
      </Typography>
      <Stack spacing={0.5}>
        {items.map((ex, i) => (
          <Box key={i}>
            <Typography
              variant={dense ? "body2" : "body1"}
              sx={{ whiteSpace: "normal", wordBreak: "break-word", mb: 0.25 }}
            >
              {ex.en}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "normal",
                wordBreak: "break-word",
                fontStyle: "italic",
                color: "text.secondary",
              }}
            >
              {ex.vi}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

// Vocabulary list component
import type { VocabEntry, KnowledgeState } from "@/types/vocab";

function VocabularyList({
  entries,
  order,
  knowledge,
  topicName,
  search,
  showExamples,
  compact,
  // keep for prop parity with parent
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isMobile,
}: {
  entries: VocabEntry[];
  order: number[];
  knowledge: Record<string, KnowledgeState>;
  topicName: Record<string, string>;
  search: string;
  showExamples: boolean;
  compact: boolean;
  isMobile?: boolean;
  onMarkKnown: (id: string) => void;
  onMarkLearning: (id: string) => void;
  onMarkUnknown: (id: string) => void;
}) {
  // Simple TTS for pronunciation
  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US";
    utt.rate = 0.9;
    utt.pitch = 0.9;
    const voices = synth.getVoices?.() || [];
    const voice = voices.find((v) => v.lang?.toLowerCase().startsWith("en"));
    if (voice) utt.voice = voice;
    synth.cancel();
    synth.speak(utt);
  };
  // Empty state
  if (!order.length) {
    return (
      <Box
        sx={{
          p: 3,
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 2,
          textAlign: "center",
          color: "text.secondary",
        }}
      >
        <Typography variant="body1">Không có từ phù hợp.</Typography>
        <Typography variant="body2">
          Hãy thay đổi bộ lọc hoặc xóa bớt điều kiện tìm kiếm.
        </Typography>
      </Box>
    );
  }

  const items: React.ReactNode[] = [];

  order.forEach((idx, i) => {
    const e = entries[idx];
    if (!e) return;
    const k: KnowledgeState = knowledge[e.id] || "unknown";

    // no group-by-topic header; topic is shown via chip

    if (compact) {
      items.push(
        <Box
          key={e.id}
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "minmax(120px,160px) 1fr",
            },
            gap: 1,
            p: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 0,
            position: "relative",
          }}
        >
          <Box sx={{ position: "absolute", top: 6, right: 8 }}>
            <Typography variant="caption" color="text.secondary">
              #{i + 1}
            </Typography>
          </Box>
          <Typography
            sx={{ fontWeight: 700, fontSize: { xs: "1.05rem", sm: "1rem" } }}
          >
            {e.word}
          </Typography>
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                pl: 1,
                py: 0.5,
                borderLeft: "3px solid",
                borderColor: "primary.light",
                bgcolor: "action.hover",
                borderRadius: 0.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  fontWeight: 600,
                }}
              >
                <Highlighted text={e.meaningVi} query={search} />
              </Typography>
            </Box>
          </Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color:
                k === "known"
                  ? "success.main"
                  : k === "learning"
                  ? "warning.main"
                  : "text.secondary",
            }}
          >
            {k === "known"
              ? "Đã thuộc"
              : k === "learning"
              ? "Chưa chắc"
              : "Chưa thuộc"}
          </Typography>
        </Box>
      );
      return;
    }

    items.push(
      <Card
        key={e.id}
        variant="outlined"
        sx={{
          borderRadius: 2,
          position: "relative",
          boxShadow: (t) => t.shadows[1],
          border: (t) =>
            `1px solid ${
              t.palette.mode === "light" ? "#E0E0E0" : t.palette.divider
            }`,
        }}
      >
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.28rem", sm: "1.4rem" },
                  lineHeight: 1.2,
                  color: "#1a73e8",
                }}
              >
                {e.word}
              </Typography>
              <Tooltip title="Phát âm">
                <IconButton
                  size="small"
                  onClick={() => speak(e.word)}
                  aria-label="phat-am"
                  sx={{
                    color: "#00b894",
                    "&:hover": { backgroundColor: "#e6ffee" },
                  }}
                >
                  <VolumeUpOutlinedIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          }
          subheader={
            <Stack direction="row" spacing={1} alignItems="center">
              {e.phonetic ? (
                <Typography
                  sx={{ fontWeight: 400, color: "#5f6368", opacity: 0.95 }}
                >
                  {e.phonetic}
                </Typography>
              ) : null}
              {e.pos ? (
                <Box
                  component="span"
                  sx={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontWeight: 700,
                    fontSize: { xs: "0.8rem", sm: "0.85rem" },
                    color: "#34495e",
                    backgroundColor: "#f2f4f8",
                    borderRadius: 1,
                    px: 0.75,
                    lineHeight: 1.6,
                  }}
                >
                  {`[${
                    e.pos.length <= 4
                      ? e.pos + (/[.]$/.test(e.pos) ? "" : ".")
                      : e.pos
                  }]`}
                </Box>
              ) : null}
            </Stack>
          }
          sx={{
            py: 1,
            px: { xs: 1, sm: 2 },
            "& .MuiCardHeader-content": { minWidth: 0 },
          }}
        />
        {/* Top-right index badge */}
        <Box sx={{ position: "absolute", top: 6, right: 8, zIndex: 2 }}>
          <Typography variant="caption" color="text.secondary">
            #{i + 1}
          </Typography>
        </Box>
        <CardContent
          sx={{ pt: 0.5, px: { xs: 1, sm: 2 }, pb: { xs: 1.25, sm: 2 } }}
        >
          <Stack spacing={1.1}>
            <Divider sx={{ mb: 0.75, borderColor: "#eeeeee" }} />
            <Typography
              sx={{
                whiteSpace: "normal",
                wordBreak: "break-word",
                fontWeight: 600,
                fontSize: { xs: "1.06rem", sm: "1.14rem" },
                lineHeight: 1.5,
                display: "block",
                width: "100%",
              }}
            >
              <Highlighted text={e.meaningVi} query={search} />
            </Typography>
            {showExamples && e.examples?.length ? (
              <ExampleList examples={e.examples} max={1} dense />
            ) : null}
            {/* Footer chips styled like mock */}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                size="small"
                label={`Level: ${e.level}`}
                sx={{
                  backgroundColor: "#e6ffee",
                  color: "#1e8449",
                  fontWeight: 600,
                }}
              />
              <Chip
                size="small"
                label={`Chủ đề: ${topicName[e.topicId] || e.topicId}`}
                sx={{
                  backgroundColor: "#f0f5ff",
                  color: "#34495e",
                  fontWeight: 600,
                }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  });

  return (
    <Stack spacing={{ xs: compact ? 0.5 : 1.25, sm: compact ? 0.75 : 2 }}>
      {items}
    </Stack>
  );
}

// Skeleton for list during loading/shuffle
function VocabularyListSkeleton({
  rows = 8,
  compact = false,
}: {
  rows?: number;
  compact?: boolean;
}) {
  const items: React.ReactNode[] = [];
  for (let i = 0; i < rows; i++) {
    if (compact) {
      items.push(
        <Box
          key={i}
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(120px,160px) 1fr auto auto",
            gap: 1,
            p: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 0,
          }}
        >
          <Skeleton width={100} height={20} />
          <Skeleton width="100%" height={18} />
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={90} height={24} />
        </Box>
      );
    } else {
      items.push(
        <Card key={i} variant="outlined" sx={{ borderRadius: 0 }}>
          <CardHeader
            title={<Skeleton width={160} height={28} />}
            subheader={<Skeleton width={120} height={18} />}
            action={<Skeleton variant="rounded" width={160} height={28} />}
          />
          <CardContent>
            <Stack spacing={1}>
              <Skeleton width="80%" height={18} />
              <Skeleton width="60%" height={18} />
              <Stack direction="row" spacing={1}>
                <Skeleton variant="rounded" width={80} height={26} />
                <Skeleton variant="rounded" width={80} height={26} />
                <Skeleton variant="rounded" width={80} height={26} />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      );
    }
  }
  return <Stack spacing={compact ? 0.75 : 2}>{items}</Stack>;
}
