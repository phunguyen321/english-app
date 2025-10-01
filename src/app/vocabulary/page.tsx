"use client";
import React, { useEffect, useMemo, useState } from "react";
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
  Stack,
  TextField,
  Button,
  Chip,
  LinearProgress,
  InputAdornment,
  Switch,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import FlashcardView from "./FlashcardView";

export default function VocabularyPage() {
  const dispatch = useAppDispatch();
  const { topics, entries, status, flashcard, knowledge } = useAppSelector(
    (s: RootState) => s.vocab
  );

  // UI state
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [showExamples, setShowExamples] = useState(true);
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(50);
  const [flashMode, setFlashMode] = useState(false);
  const [shuffleTopicMix, setShuffleTopicMix] = useState(false);
  const [filterLevels, setFilterLevels] = useState<string[]>([]);
  const [knowledgeFilter, setKnowledgeFilter] = useState<
    "all" | "unknown" | "learning" | "known"
  >("all");
  const [compact, setCompact] = useState(false);

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
        if (parsed && typeof parsed === "object")
          dispatch(loadKnowledge(parsed));
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
    const s = Math.max(1, Math.min(start, n));
    const e = Math.max(s, Math.min(end, n));
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

  const topicName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of topics) map[t.id] = t.name;
    return map;
  }, [topics]);

  const current = entries[flashcard.order[flashcard.index]];

  const startFlashcards = () => {
    setFlashMode(true);
    dispatch(shuffleFlashcards());
  };

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
                onClick={() => dispatch(shuffleFlashcards())}
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
        alignItems="flex-start"
      >
        {/* Sidebar */}
        <Box sx={{ width: { xs: "100%", lg: 320 }, flexShrink: 0 }}>
          <Card
            variant="outlined"
            sx={{ position: { lg: "sticky" }, top: { lg: 16 } }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chủ đề
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                {topics.map((t) => {
                  const active = selectedTopics.includes(t.id);
                  return (
                    <Chip
                      key={t.id}
                      size="small"
                      clickable
                      color={active ? "primary" : "default"}
                      variant={active ? "filled" : "outlined"}
                      label={t.name}
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
          <Card sx={{ p: 2 }}>
            <CardContent>
              {flashMode ? (
                <FlashcardView
                  entry={current}
                  showAnswer={flashcard.showAnswer}
                  showExamples={showExamples}
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
              ) : (
                <VocabularyList
                  entries={entries}
                  order={flashcard.order}
                  knowledge={knowledge}
                  topicName={topicName}
                  search={search}
                  showExamples={showExamples}
                  compact={compact}
                  onMarkKnown={(id) => dispatch(markKnown(id))}
                  onMarkLearning={(id) => dispatch(markLearning(id))}
                  onMarkUnknown={(id) => dispatch(markUnknown(id))}
                />
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>
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
  return (
    <Stack spacing={compact ? 0.75 : 2}>
      {order.map((idx, i) => {
        const e = entries[idx];
        if (!e) return null;
        const k: KnowledgeState = knowledge[e.id] || "unknown";
        if (compact) {
          return (
            <Box
              key={e.id}
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(120px,160px) 1fr auto auto",
                gap: 1,
                p: 1,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Typography fontWeight={600}>{e.word}</Typography>
              <Typography
                variant="body2"
                sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
              >
                <Highlighted text={e.meaningVi} query={search} />
              </Typography>
              <Chip
                size="small"
                label={e.level}
                color="info"
                variant="outlined"
              />
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
            </Box>
          );
        }
        return (
          <Card key={e.id} variant="outlined">
            <CardHeader
              title={e.word}
              subheader={
                e.phonetic
                  ? `${e.phonetic}${e.pos ? " • " + e.pos : ""}`
                  : e.pos || undefined
              }
              action={
                <Stack direction="row" spacing={1} alignItems="center">
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
                  sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
                >
                  <Highlighted text={e.meaningVi} query={search} />
                </Typography>
                {showExamples && e.examples?.length ? (
                  <ExampleList examples={e.examples} max={1} dense />
                ) : null}
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Typography variant="caption" color="text.secondary">
                    #{i + 1}
                  </Typography>
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
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
