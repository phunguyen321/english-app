"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector, type RootState } from "@/store";
import {
  loadVocab,
  shuffleFlashcards,
  toggleAnswer,
  setFlashcardSubset,
  nextCard,
  prevCard,
  markKnown,
  markLearning,
  markUnknown,
  loadKnowledge,
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
  ListSubheader,
  Checkbox,
  Drawer,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import FilterListIcon from "@mui/icons-material/FilterList";
import FlashcardView from "./FlashcardView";

export default function VocabularyPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { topics, entries, status, flashcard, knowledge } = useAppSelector(
    (s: RootState) => s.vocab
  );

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

  // Recompute subset order whenever filters change
  useEffect(() => {
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
    const finalOrder = shuffleTopicMix ? shuffleSimple(pipeline) : pipeline;
    dispatch(setFlashcardSubset(finalOrder));
  }, [
    entries,
    start,
    end,
    selectedTopics,
    search,
    shuffleTopicMix,
    filterLevels,
    knowledgeFilter,
    knowledge,
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
    setFlashMode(true);
    setIsShuffling(true);
    dispatch(shuffleFlashcards());
  };
  const handleShuffle = () => {
    setIsShuffling(true);
    dispatch(shuffleFlashcards());
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Đã lọc: {flashcard.order.length} từ
      </Typography>
      {status === "loading" && <LinearProgress />}

      {/* Top controls */}
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
              value={end ?? ""}
              placeholder="cuối danh sách"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const v = e.target.value;
                if (v === "") setEnd(null);
                else setEnd(Number(v));
              }}
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
            <FormControlLabel
              control={
                <Switch
                  checked={compact}
                  onChange={(e) => setCompact(e.target.checked)}
                />
              }
              label="Danh sách gọn"
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
                onClick={handleShuffle}
              >
                Xáo trộn
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", lg: "flex-start" }}
      >
        {/* Sidebar (hidden on mobile) */}
        <Box
          sx={{
            width: { xs: "100%", lg: 320 },
            flexShrink: 0,
            display: { xs: "none", lg: "block" },
          }}
        >
          <Card
            variant="outlined"
            sx={{ position: { lg: "sticky" }, top: { lg: 16 } }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chủ đề
              </Typography>
              <List
                dense
                subheader={
                  <ListSubheader component="div" disableSticky>
                    Chọn chủ đề để lọc
                  </ListSubheader>
                }
                sx={{
                  maxHeight: 300,
                  overflowY: "auto",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  mb: 1,
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
                  return (
                    <ListItemButton
                      key={t.id}
                      dense
                      selected={checked}
                      onClick={() =>
                        setSelectedTopics((prev) =>
                          prev.includes(t.id)
                            ? prev.filter((x) => x !== t.id)
                            : [...prev, t.id]
                        )
                      }
                    >
                      <Checkbox
                        edge="start"
                        size="small"
                        tabIndex={-1}
                        checked={checked}
                      />
                      <ListItemText
                        disableTypography
                        primary={
                          <Typography variant="body2" component="span">
                            {t.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.25 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {st.total} từ • {pctKnown}% đã thuộc
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={pctKnown}
                              sx={{ height: 4, borderRadius: 999, mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button
                  size="small"
                  onClick={() => setSelectedTopics(topics.map((t) => t.id))}
                >
                  Tất cả
                </Button>
                <Button size="small" onClick={() => setSelectedTopics([])}>
                  Xóa
                </Button>
              </Stack>
              {/* POS filter removed */}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>
                Trạng thái học
              </Typography>
              <ToggleButtonGroup
                size="small"
                value={knowledgeFilter}
                exclusive
                onChange={(_, val) => val && setKnowledgeFilter(val)}
              >
                <ToggleButton value="all">Tất cả</ToggleButton>
                <ToggleButton value="unknown">Chưa thuộc</ToggleButton>
                <ToggleButton value="learning">Chưa chắc</ToggleButton>
                <ToggleButton value="known">Đã thuộc</ToggleButton>
              </ToggleButtonGroup>
              <Divider sx={{ my: 1 }} />
              <Tooltip title="Reset mọi lọc">
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedTopics([]);
                    setFilterLevels([]);
                    setKnowledgeFilter("all");
                  }}
                >
                  Reset lọc
                </Button>
              </Tooltip>
            </CardContent>
          </Card>
        </Box>

        {/* Main content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card
            sx={{
              width: "100%",
              px: { xs: 0, sm: 2 },
              py: { xs: 1, sm: 2 },
              borderRadius: { xs: 0, sm: 1 },
            }}
          >
            <CardContent sx={{ width: "100%", px: { xs: 0, sm: 2 } }}>
              {/* Mobile quick actions */}
              {!flashMode && isMobile ? (
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <IconButton
                    color="primary"
                    onClick={() => setMobileFilterOpen(true)}
                    aria-label="Mở bộ lọc"
                  >
                    <FilterListIcon />
                  </IconButton>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ShuffleIcon />}
                    onClick={handleShuffle}
                  >
                    Xáo trộn
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={startFlashcards}
                  >
                    Học thẻ
                  </Button>
                </Stack>
              ) : null}

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
                  knowledgeState={current ? knowledge[current.id] : undefined}
                  onMarkKnown={() => current && dispatch(markKnown(current.id))}
                  onMarkLearning={() =>
                    current && dispatch(markLearning(current.id))
                  }
                  onMarkUnknown={() =>
                    current && dispatch(markUnknown(current.id))
                  }
                />
              ) : status === "loading" || isShuffling ? (
                <VocabularyListSkeleton
                  rows={effectiveCompact ? 10 : 5}
                  compact={effectiveCompact}
                />
              ) : (
                <VocabularyList
                  entries={entries}
                  order={flashcard.order}
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
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Mobile filter drawer */}
      <Drawer
        anchor="right"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        PaperProps={{ sx: { width: "90vw", maxWidth: 360 } }}
      >
        <Box sx={{ p: 2 }} role="presentation">
          <Typography variant="h6" gutterBottom>
            Bộ lọc
          </Typography>
          <Divider sx={{ mb: 1 }} />

          <Typography variant="subtitle2" gutterBottom>
            Chủ đề
          </Typography>
          <List
            dense
            sx={{
              maxHeight: 300,
              overflowY: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              mb: 1,
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
              return (
                <ListItemButton
                  key={t.id}
                  dense
                  selected={checked}
                  onClick={() =>
                    setSelectedTopics((prev) =>
                      prev.includes(t.id)
                        ? prev.filter((x) => x !== t.id)
                        : [...prev, t.id]
                    )
                  }
                >
                  <Checkbox
                    edge="start"
                    size="small"
                    tabIndex={-1}
                    checked={checked}
                  />
                  <ListItemText
                    disableTypography
                    primary={
                      <Typography variant="body2" component="span">
                        {t.name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 0.25 }}>
                        <Typography variant="caption" color="text.secondary">
                          {st.total} từ • {pctKnown}% đã thuộc
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={pctKnown}
                          sx={{ height: 4, borderRadius: 999, mt: 0.5 }}
                        />
                      </Box>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button
              size="small"
              onClick={() => setSelectedTopics(topics.map((t) => t.id))}
            >
              Tất cả
            </Button>
            <Button size="small" onClick={() => setSelectedTopics([])}>
              Xóa
            </Button>
          </Stack>

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" gutterBottom>
            Trạng thái học
          </Typography>
          <ToggleButtonGroup
            size="small"
            value={knowledgeFilter}
            exclusive
            onChange={(_, val) => val && setKnowledgeFilter(val)}
          >
            <ToggleButton value="all">Tất cả</ToggleButton>
            <ToggleButton value="unknown">Chưa thuộc</ToggleButton>
            <ToggleButton value="learning">Chưa chắc</ToggleButton>
            <ToggleButton value="known">Đã thuộc</ToggleButton>
          </ToggleButtonGroup>

          {/* no group-by-topic toggle in mobile */}

          <Divider sx={{ my: 1 }} />
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => setMobileFilterOpen(false)}
            >
              Đóng
            </Button>
            <Tooltip title="Reset mọi lọc">
              <Button
                onClick={() => {
                  setSelectedTopics([]);
                  setFilterLevels([]);
                  setKnowledgeFilter("all");
                }}
              >
                Reset lọc
              </Button>
            </Tooltip>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}

// Simple shuffle
function shuffleSimple(indices: number[]) {
  const arr = [...indices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
          <Box sx={{ pt: 0.25, color: "text.disabled" }}>
            <FormatQuoteRoundedIcon fontSize="small" />
          </Box>
          <Stack spacing={0.25}>
            <Typography
              variant={dense ? "body2" : "body1"}
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

// Vocabulary list component
import type { VocabEntry } from "@/types";
type KnowledgeState = "unknown" | "learning" | "known";

function VocabularyList({
  entries,
  order,
  knowledge,
  topicName,
  search,
  showExamples,
  compact,
  onMarkKnown,
  onMarkLearning,
  onMarkUnknown,
}: {
  entries: VocabEntry[];
  order: number[];
  knowledge: Record<string, KnowledgeState>;
  topicName: Record<string, string>;
  search: string;
  showExamples: boolean;
  compact: boolean;
  onMarkKnown: (id: string) => void;
  onMarkLearning: (id: string) => void;
  onMarkUnknown: (id: string) => void;
}) {
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
        sx={{ borderRadius: 0, position: "relative" }}
      >
        <CardHeader
          title={e.word}
          titleTypographyProps={{
            sx: {
              fontWeight: 700,
              fontSize: { xs: "1.25rem", sm: "1.35rem" },
              lineHeight: 1.2,
            },
          }}
          subheader={
            e.phonetic
              ? `${e.phonetic}${e.pos ? " • " + e.pos : ""}`
              : e.pos || undefined
          }
          subheaderTypographyProps={{
            sx: {
              color: "text.secondary",
              fontSize: { xs: "0.95rem", sm: "1rem" },
              letterSpacing: 0.15,
            },
          }}
          action={
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ display: { xs: "none", md: "flex" } }}
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
            <Divider sx={{ mb: 0.5 }} />
            <Typography
              sx={{
                whiteSpace: "normal",
                wordBreak: "break-word",
                fontWeight: 600,
                fontSize: { xs: "1.05rem", sm: "1.125rem" },
                lineHeight: 1.5,
                p: 1,
                borderRadius: 1,
                bgcolor: "action.hover",
                display: "block",
                width: "100%",
              }}
            >
              <Highlighted text={e.meaningVi} query={search} />
            </Typography>
            {showExamples && e.examples?.length ? (
              <Box
                sx={{
                  pl: 1.25,
                  py: 0.75,
                  borderLeft: "3px solid",
                  borderColor: "primary.light",
                  bgcolor: "action.hover",
                  borderRadius: 1,
                  width: "100%",
                }}
              >
                <ExampleList examples={e.examples} max={1} dense />
              </Box>
            ) : null}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Chip
                size="small"
                label={
                  k === "known"
                    ? "Đã thuộc"
                    : k === "learning"
                    ? "Chưa chắc"
                    : "Chưa thuộc"
                }
                color={
                  k === "known"
                    ? "success"
                    : k === "learning"
                    ? "warning"
                    : "default"
                }
                variant={k === "unknown" ? "outlined" : "filled"}
              />
              <Button size="small" onClick={() => onMarkKnown(e.id)}>
                Thuộc
              </Button>
              <Button size="small" onClick={() => onMarkLearning(e.id)}>
                Chưa chắc
              </Button>
              <Button size="small" onClick={() => onMarkUnknown(e.id)}>
                Chưa thuộc
              </Button>
            </Stack>
            {/* Subtle context line for small screens */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: "block", md: "none" }, mt: 0.5 }}
            >
              {`Chủ đề: ${topicName[e.topicId] || e.topicId}`}
              {e.level ? ` · Level: ${e.level}` : ""}
            </Typography>
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
