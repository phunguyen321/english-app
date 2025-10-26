"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import { setQuestions } from "@/store/slices/quizSlice";
import {
  Box,
  Container,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Paper,
  Stack,
  Alert,
  Divider,
  Chip,
  LinearProgress,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardActionArea,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GavelIcon from "@mui/icons-material/Gavel";
import SortIcon from "@mui/icons-material/Sort";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SchoolIcon from "@mui/icons-material/School";
import SpeedIcon from "@mui/icons-material/Speed";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TopicIcon from "@mui/icons-material/Topic";
import SaveIcon from "@mui/icons-material/Save";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import AppAPI from "@/lib/api";
import type { AnyQuizQuestion } from "@/types/quiz";
import { alpha } from "@mui/material/styles";

export default function GenerateQuizzesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [requirements, setRequirements] = useState("");
  const [countInput, setCountInput] = useState<string>("8");
  const [mixTypes, setMixTypes] = useState(true);
  const [allowedTypes, setAllowedTypes] = useState<string[]>([
    "vocab-mcq",
    "grammar-mcq",
    "sentence-order",
  ]);
  const TYPE_LABELS: Record<string, string> = {
    "vocab-mcq": "Từ vựng",
    "grammar-mcq": "Ngữ pháp",
    "sentence-order": "Sắp xếp câu",
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawPreview, setRawPreview] = useState<string>("");
  const [typeRatios, setTypeRatios] = useState<Record<string, number>>({
    "vocab-mcq": 1,
    "grammar-mcq": 1,
    "sentence-order": 1,
  });

  // NEW: Difficulty & CEFR Level states
  const [difficulty, setDifficulty] = useState<string>("mixed");
  const [cefrLevel, setCefrLevel] = useState<string>("auto");
  const [grammarFocus, setGrammarFocus] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  // NEW: Topic/Theme selector
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // NEW: Template management
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<
    Array<{
      name: string;
      config: {
        requirements: string;
        count: string;
        difficulty: string;
        cefrLevel: string;
        allowedTypes: string[];
        typeRatios: Record<string, number>;
        grammarFocus: string[];
        selectedTopics: string[];
      };
    }>
  >([]);
  const [showLoadTemplateDialog, setShowLoadTemplateDialog] = useState(false);

  // NEW: Prompt preview
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  const TOPICS = [
    "Daily Life",
    "Travel & Tourism",
    "Business & Work",
    "Education & Learning",
    "Technology & Internet",
    "Health & Fitness",
    "Food & Cooking",
    "Shopping & Fashion",
    "Entertainment & Hobbies",
    "Family & Relationships",
    "Environment & Nature",
    "Sports & Games",
    "Culture & Traditions",
    "Science & Innovation",
    "News & Current Events",
  ];

  const DIFFICULTY_OPTIONS = [
    { value: "mixed", label: "Hỗn hợp (Đề xuất)" },
    { value: "easy", label: "Dễ" },
    { value: "medium", label: "Trung bình" },
    { value: "hard", label: "Khó" },
  ];

  const CEFR_LEVELS = [
    { value: "auto", label: "Tự động (từ yêu cầu)" },
    { value: "A1", label: "A1 - Beginner" },
    { value: "A2", label: "A2 - Elementary" },
    { value: "B1", label: "B1 - Intermediate" },
    { value: "B2", label: "B2 - Upper-Intermediate" },
    { value: "C1", label: "C1 - Advanced" },
    { value: "C2", label: "C2 - Proficiency" },
  ];

  const GRAMMAR_TOPICS = [
    "Present Simple",
    "Present Continuous",
    "Past Simple",
    "Past Continuous",
    "Present Perfect",
    "Past Perfect",
    "Future Simple",
    "Modal Verbs",
    "Conditionals",
    "Passive Voice",
    "Reported Speech",
    "Relative Clauses",
    "Comparatives & Superlatives",
    "Gerunds & Infinitives",
    "Articles (a/an/the)",
    "Prepositions",
    "Phrasal Verbs",
  ];

  // Load templates from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("quiz-templates");
      if (saved) {
        setSavedTemplates(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to load templates", err);
    }
  }, []);

  // Save templates to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem("quiz-templates", JSON.stringify(savedTemplates));
    } catch (err) {
      console.error("Failed to save templates", err);
    }
  }, [savedTemplates]);

  const parsedCount = useMemo(() => {
    const v = parseInt(countInput, 10);
    return Number.isFinite(v) ? v : NaN;
  }, [countInput]);
  const isCountValid =
    Number.isFinite(parsedCount) && parsedCount >= 1 && parsedCount <= 50;
  const allocCount = isCountValid ? (parsedCount as number) : 0;

  const normalizedRatios = useMemo(() => {
    const active = Object.entries(typeRatios).filter(([k]) =>
      allowedTypes.includes(k)
    );
    const sum = active.reduce((a, [, v]) => a + v, 0) || 1;
    return Object.fromEntries(
      active.map(([k, v]) => [k, Number(((v / sum) * 100).toFixed(1))])
    );
  }, [typeRatios, allowedTypes]);

  const predictedCounts = useMemo(() => {
    const raw = allowedTypes.map((t) => ({
      t,
      val: ((normalizedRatios[t] || 0) * allocCount) / 100,
    }));
    const floors = raw.map((r) => ({
      t: r.t,
      floor: Math.floor(r.val),
      frac: r.val - Math.floor(r.val),
    }));
    const base: Record<string, number> = Object.fromEntries(
      floors.map((f) => [f.t, f.floor])
    );
    const used = floors.reduce((a, f) => a + f.floor, 0);
    let left = allocCount - used;
    const fracSorted = [...floors].sort((a, b) => b.frac - a.frac);
    let i = 0;
    while (left > 0 && fracSorted.length) {
      base[fracSorted[i % fracSorted.length].t] += 1;
      left--;
      i++;
    }
    return base;
  }, [allowedTypes, normalizedRatios, allocCount]);

  const updateRatio = (key: string, value: number) =>
    setTypeRatios((p) => ({ ...p, [key]: value }));
  const resetRatios = () =>
    setTypeRatios((p) => ({
      ...p,
      ...Object.fromEntries(allowedTypes.map((t) => [t, 1])),
    }));
  const isBalanced = useMemo(() => {
    if (allowedTypes.length <= 1) return true;
    const vals = allowedTypes.map((t) => typeRatios[t] || 0);
    if (vals.some((v) => v <= 0)) return false;
    return vals.every((v) => Math.abs(v - vals[0]) < 0.0001);
  }, [allowedTypes, typeRatios]);

  // Template management functions
  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      setError("Nhập tên template trước khi lưu.");
      return;
    }
    const newTemplate = {
      name: templateName.trim(),
      config: {
        requirements,
        count: countInput,
        difficulty,
        cefrLevel,
        allowedTypes,
        typeRatios,
        grammarFocus,
        selectedTopics,
      },
    };
    setSavedTemplates((prev) => [...prev, newTemplate]);
    setTemplateName("");
    setShowTemplateDialog(false);
    setError(null);
  };

  const handleLoadTemplate = (template: (typeof savedTemplates)[0]) => {
    setRequirements(template.config.requirements);
    setCountInput(template.config.count);
    setDifficulty(template.config.difficulty);
    setCefrLevel(template.config.cefrLevel);
    setAllowedTypes(template.config.allowedTypes);
    setTypeRatios(template.config.typeRatios);
    setGrammarFocus(template.config.grammarFocus);
    setSelectedTopics(template.config.selectedTopics);
    setShowLoadTemplateDialog(false);
  };

  const handleDeleteTemplate = (index: number) => {
    setSavedTemplates((prev) => prev.filter((_, i) => i !== index));
  };

  // Build enhanced prompt
  const buildEnhancedPrompt = () => {
    let enhanced = requirements;

    if (selectedTopics.length > 0) {
      enhanced = `[Topics: ${selectedTopics.join(", ")}] ${enhanced}`;
    }

    if (cefrLevel && cefrLevel !== "auto") {
      enhanced = `[CEFR Level: ${cefrLevel}] ${enhanced}`;
    }

    if (difficulty && difficulty !== "mixed") {
      enhanced = `[Difficulty: ${difficulty}] ${enhanced}`;
    }

    if (grammarFocus.length > 0 && allowedTypes.includes("grammar-mcq")) {
      enhanced = `[Grammar Focus: ${grammarFocus.join(", ")}] ${enhanced}`;
    }

    return enhanced;
  };

  const handleGenerate = async () => {
    if (!requirements.trim()) {
      setError("Nhập yêu cầu / chủ đề trước.");
      return;
    }
    setError(null);
    setLoading(true);
    setRawPreview("");
    setShowSummary(false);
    try {
      const enhancedRequirements = buildEnhancedPrompt();

      const json = await AppAPI.generateQuiz({
        requirements: enhancedRequirements,
        count: parsedCount,
        mixTypes,
        allowedTypes,
        typeRatios: Object.fromEntries(
          allowedTypes.map((k) => [k, typeRatios[k] || 1])
        ),
      });
      if (!json.success) throw new Error(json.error || "Lỗi không xác định");
      // json.data should be AnyQuizQuestion[]
      dispatch(
        setQuestions({
          questions: json.data as AnyQuizQuestion[],
          source: "ai",
        })
      );
      setRawPreview(JSON.stringify(json.data, null, 2));
      router.push("/quizzes");
    } catch (e: unknown) {
      setError((e as Error).message || "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: { xs: 2, sm: 3 } }}>
      <Container maxWidth="sm" sx={{ pb: 6 }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
            mb: 2,
            border: (t) => `1px solid ${t.palette.divider}`,
            backgroundColor: "#fff",
          }}
        >
          <Typography
            gutterBottom
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              typography: { xs: "h5", sm: "h4" },
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <AutoAwesomeIcon
                color="primary"
                sx={{ fontSize: { xs: 24, sm: 28 } }}
              />
              Tạo bài tập bằng AI
            </Box>
            <Stack direction="row" spacing={1}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => setShowLoadTemplateDialog(true)}
                title="Tải template"
                sx={{
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                  "&:hover": {
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.2),
                  },
                }}
              >
                <FolderOpenIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="success"
                onClick={() => setShowTemplateDialog(true)}
                title="Lưu template"
                disabled={!requirements.trim()}
                sx={{
                  bgcolor: (t) => alpha(t.palette.success.main, 0.1),
                  "&:hover": {
                    bgcolor: (t) => alpha(t.palette.success.main, 0.2),
                  },
                }}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="info"
                onClick={() => setShowPromptPreview(true)}
                title="Xem prompt"
                disabled={!requirements.trim()}
                sx={{
                  bgcolor: (t) => alpha(t.palette.info.main, 0.1),
                  "&:hover": {
                    bgcolor: (t) => alpha(t.palette.info.main, 0.2),
                  },
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mb: 3, fontSize: { xs: 14, sm: 16 } }}
          >
            Mô tả yêu cầu: trình độ, chủ đề, loại ngữ pháp, kiểu câu... Hệ thống
            sẽ sinh ra bộ câu hỏi bạn có thể làm ngay ở trang Bài tập.
          </Typography>

          <Stack spacing={3}>
            <TextField
              label="Yêu cầu / Chủ đề"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Viết về ngữ pháp thì hiện tại đơn cho học sinh A1..."
              multiline
              minRows={3}
              disabled={loading}
              fullWidth
            />

            {/* Preset Templates Quick Actions */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                gutterBottom
                sx={{ display: "block" }}
              >
                ⚡ Template nhanh:
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                <Chip
                  label="🎯 Luyện tập nhanh"
                  size="small"
                  clickable
                  onClick={() => {
                    setRequirements(
                      "Tạo bài tập luyện tập tổng hợp cho người học tiếng Anh"
                    );
                    setCountInput("10");
                    setDifficulty("mixed");
                    setCefrLevel("auto");
                    setAllowedTypes([
                      "vocab-mcq",
                      "grammar-mcq",
                      "sentence-order",
                    ]);
                  }}
                  sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.1) }}
                />
                <Chip
                  label="📚 Ôn thi"
                  size="small"
                  clickable
                  onClick={() => {
                    setRequirements("Tạo bài tập ôn thi cho kỳ thi quan trọng");
                    setCountInput("20");
                    setDifficulty("medium");
                    setCefrLevel("B1");
                    setAllowedTypes(["vocab-mcq", "grammar-mcq"]);
                  }}
                  sx={{ bgcolor: (t) => alpha(t.palette.warning.main, 0.1) }}
                />
                <Chip
                  label="👶 Trẻ em/Cơ bản"
                  size="small"
                  clickable
                  onClick={() => {
                    setRequirements(
                      "Tạo bài tập đơn giản, thân thiện cho trẻ em mới học tiếng Anh"
                    );
                    setCountInput("8");
                    setDifficulty("easy");
                    setCefrLevel("A1");
                    setAllowedTypes(["vocab-mcq", "sentence-order"]);
                    setSelectedTopics(["Daily Life", "Family & Relationships"]);
                  }}
                  sx={{ bgcolor: (t) => alpha(t.palette.success.main, 0.1) }}
                />
                <Chip
                  label="💼 Business English"
                  size="small"
                  clickable
                  onClick={() => {
                    setRequirements(
                      "Tạo bài tập tiếng Anh thương mại cho môi trường công sở"
                    );
                    setCountInput("15");
                    setDifficulty("medium");
                    setCefrLevel("B2");
                    setAllowedTypes(["vocab-mcq", "grammar-mcq"]);
                    setSelectedTopics(["Business & Work"]);
                  }}
                  sx={{ bgcolor: (t) => alpha(t.palette.info.main, 0.1) }}
                />
              </Stack>
            </Box>

            {/* Count section styled like a card */}
            <Box>
              <Typography gutterBottom fontWeight={600}>
                Số câu hỏi
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                  border: (t) =>
                    `1px solid ${alpha(t.palette.primary.main, 0.2)}`,
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ sm: "center" }}
                  spacing={1.5}
                >
                  <TextField
                    type="number"
                    size="small"
                    disabled={loading}
                    value={countInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setCountInput("");
                        return;
                      }
                      const v = parseInt(val, 10);
                      if (Number.isNaN(v)) setCountInput(val);
                      else setCountInput(String(Math.min(v, 50)));
                    }}
                    inputProps={{ max: 50 }}
                    sx={{ width: { xs: "100%", sm: 120 }, fontWeight: 700 }}
                    error={!isCountValid}
                    helperText={
                      isCountValid
                        ? "(Tối đa 50, không đặt min). Trống/lỗi sẽ không thể bấm tạo."
                        : "Số hợp lệ từ 1 đến 50."
                    }
                    label="Số lượng"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Có thể nhập trực tiếp số lớn (ví dụ 50) nhưng lưu ý thời
                    gian tạo lâu hơn.
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* Difficulty Level Section */}
            <Box>
              <Typography
                gutterBottom
                fontWeight={600}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SpeedIcon fontSize="small" color="primary" />
                Độ khó
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={loading}
                  sx={{
                    borderRadius: 2,
                    bgcolor: (t) => alpha(t.palette.info.main, 0.04),
                  }}
                >
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Chọn &quot;Hỗn hợp&quot; để có sự đa dạng trong bộ câu hỏi
              </Typography>
            </Box>

            {/* CEFR Level Section */}
            <Box>
              <Typography
                gutterBottom
                fontWeight={600}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SchoolIcon fontSize="small" color="primary" />
                Trình độ CEFR
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={cefrLevel}
                  onChange={(e) => setCefrLevel(e.target.value)}
                  disabled={loading}
                  sx={{
                    borderRadius: 2,
                    bgcolor: (t) => alpha(t.palette.success.main, 0.04),
                  }}
                >
                  {CEFR_LEVELS.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Chọn &quot;Tự động&quot; để AI xác định dựa trên yêu cầu của bạn
              </Typography>
            </Box>

            {/* Topic/Theme Selector Section */}
            <Box>
              <Typography
                gutterBottom
                fontWeight={600}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <TopicIcon fontSize="small" color="primary" />
                Chủ đề / Theme (Tùy chọn)
              </Typography>
              <Autocomplete
                multiple
                options={TOPICS}
                value={selectedTopics}
                onChange={(_, newValue) => setSelectedTopics(newValue)}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Chọn chủ đề cho bài tập..."
                    size="small"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                      key={option}
                      sx={{ borderRadius: 1 }}
                      color="secondary"
                    />
                  ))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: (t) => alpha(t.palette.secondary.main, 0.04),
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Chọn 1 hoặc nhiều chủ đề để làm ngữ cảnh cho câu hỏi
              </Typography>
            </Box>

            {/* Grammar Focus Section - Only show when grammar is selected */}
            {allowedTypes.includes("grammar-mcq") && (
              <Box>
                <Typography
                  gutterBottom
                  fontWeight={600}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <GavelIcon fontSize="small" color="primary" />
                  Tập trung Ngữ pháp (Tùy chọn)
                </Typography>
                <Autocomplete
                  multiple
                  options={GRAMMAR_TOPICS}
                  value={grammarFocus}
                  onChange={(_, newValue) => setGrammarFocus(newValue)}
                  disabled={loading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Chọn cấu trúc ngữ pháp..."
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                        key={option}
                        sx={{ borderRadius: 1 }}
                      />
                    ))
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: (t) => alpha(t.palette.warning.main, 0.04),
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  Để trống nếu muốn AI tự chọn dựa trên yêu cầu
                </Typography>
              </Box>
            )}

            {/* Types with pill-style toggles */}
            <Box>
              <Typography gutterBottom fontWeight={600}>
                Loại câu hỏi
              </Typography>
              <ToggleButtonGroup
                value={allowedTypes}
                onChange={(e, v: string[]) => {
                  if (!v || v.length === 0) return;
                  setAllowedTypes(v);
                }}
                aria-label="Chọn loại câu hỏi"
                sx={{
                  flexWrap: "wrap",
                  gap: 1,
                  mb: 1,
                  "& .MuiToggleButton-root": {
                    borderRadius: "20px",
                    textTransform: "none",
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 0.6, sm: 1 },
                    bgcolor: "#f9fafb",
                    color: "text.secondary",
                    borderColor: "divider",
                    transition: "all .2s",
                    fontSize: { xs: 12, sm: 14 },
                  },
                  "& .MuiToggleButton-root.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    borderColor: "primary.main",
                    boxShadow: "0 2px 4px rgba(59,130,246,0.4)",
                    transform: "translateY(-1px)",
                    "&:hover": { bgcolor: "primary.main" },
                  },
                }}
              >
                <ToggleButton
                  value="vocab-mcq"
                  aria-label="Từ vựng"
                  sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 0.6, sm: 1 } }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <MenuBookIcon fontSize="small" />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ fontSize: { xs: 12, sm: 14 } }}
                    >
                      Từ vựng
                    </Typography>
                  </Stack>
                </ToggleButton>
                <ToggleButton
                  value="grammar-mcq"
                  aria-label="Ngữ pháp"
                  sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 0.6, sm: 1 } }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <GavelIcon fontSize="small" />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ fontSize: { xs: 12, sm: 14 } }}
                    >
                      Ngữ pháp
                    </Typography>
                  </Stack>
                </ToggleButton>
                <ToggleButton
                  value="sentence-order"
                  aria-label="Sắp xếp câu"
                  sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 0.6, sm: 1 } }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SortIcon fontSize="small" />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ fontSize: { xs: 12, sm: 14 } }}
                    >
                      Sắp xếp câu
                    </Typography>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography
                variant="caption"
                color="primary"
                sx={{ display: "block", mb: 1 }}
              >
                ✅ Đang chọn:{" "}
                {allowedTypes.map((t) => TYPE_LABELS[t] || t).join(", ")}
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 1,
                  mb: 1,
                }}
              >
                <Card variant="outlined">
                  <CardActionArea
                    onClick={() => {
                      setAllowedTypes([
                        "vocab-mcq",
                        "grammar-mcq",
                        "sentence-order",
                      ]);
                      setMixTypes(true);
                    }}
                  >
                    <CardContent
                      sx={{ py: 1.25, minHeight: { sm: 88, md: 96 } }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        gutterBottom
                      >
                        Gợi ý: Đa dạng
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Nên chọn cả 3 loại để tạo bộ phong phú.
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
                <Card variant="outlined">
                  <CardActionArea
                    onClick={() => {
                      setAllowedTypes(["grammar-mcq"]);
                      setMixTypes(false);
                    }}
                  >
                    <CardContent
                      sx={{ py: 1.25, minHeight: { sm: 88, md: 96 } }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        gutterBottom
                      >
                        Chỉ Ngữ pháp
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Luyện tập trọng tâm cấu trúc & quy tắc.
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
                <Card variant="outlined">
                  <CardActionArea
                    onClick={() => {
                      setAllowedTypes(["vocab-mcq"]);
                      setMixTypes(false);
                    }}
                  >
                    <CardContent
                      sx={{ py: 1.25, minHeight: { sm: 88, md: 96 } }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        gutterBottom
                      >
                        Chỉ Từ vựng
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tập trung mở rộng vốn từ.
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={mixTypes}
                    onChange={(e) => setMixTypes(e.target.checked)}
                    disabled={loading || allowedTypes.length <= 1}
                  />
                }
                label="Trộn ngẫu nhiên các loại (khi >= 2 loại chọn)"
              />

              {allowedTypes.length > 1 && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ mb: 1 }}
                  >
                    Tỉ lệ mong muốn (% mỗi loại)
                  </Typography>
                  <Stack spacing={1.5}>
                    {allowedTypes.map((t) => (
                      <Box key={t}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          sx={{ mb: 0.25 }}
                        >
                          <Typography variant="caption" fontWeight={600}>
                            {TYPE_LABELS[t]}
                          </Typography>
                          <Typography variant="caption" color="primary">
                            {normalizedRatios[t] ?? 0}% (~
                            {predictedCounts[t] || 0})
                          </Typography>
                        </Stack>
                        <Slider
                          value={normalizedRatios[t] ?? 0}
                          min={0}
                          max={100}
                          step={1}
                          onChange={(_, val) => {
                            const p = Array.isArray(val)
                              ? val[0]
                              : (val as number);
                            const others = allowedTypes
                              .filter((k) => k !== t)
                              .reduce((a, k) => a + (typeRatios[k] || 0), 0);
                            const pct = Math.max(0, Math.min(99, p));
                            const w =
                              others <= 0
                                ? pct === 0
                                  ? 0
                                  : 1
                                : (pct * others) / (100 - pct);
                            updateRatio(t, Number(w.toFixed(4)));
                          }}
                          disabled={loading}
                          sx={{
                            height: { xs: 6, sm: 8 },
                            "& .MuiSlider-rail": {
                              bgcolor: (th) =>
                                alpha(th.palette.primary.main, 0.12),
                            },
                            "& .MuiSlider-track": { bgcolor: "primary.main" },
                            "& .MuiSlider-thumb": {
                              width: { xs: 14, sm: 16 },
                              height: { xs: 14, sm: 16 },
                              bgcolor: "primary.main",
                              border: "3px solid #fff",
                              boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
                              "&:hover, &.Mui-focusVisible": {
                                boxShadow: "0 0 0 8px rgba(59,130,246,0.2)",
                              },
                            },
                          }}
                          aria-label={`Tỉ lệ ${TYPE_LABELS[t]} hiện tại ${
                            normalizedRatios[t] || 0
                          }%, dự kiến khoảng ${predictedCounts[t] || 0} câu`}
                        />
                      </Box>
                    ))}
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RestartAltIcon fontSize="small" />}
                      onClick={resetRatios}
                      disabled={loading || isBalanced}
                    >
                      Cân bằng lại
                    </Button>
                  </Stack>

                  {/* Yellow rebalance info box */}
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      display: "flex",
                      alignItems: "flex-start",
                      borderRadius: 2,
                      bgcolor: "#fffbeb",
                      border: "1px solid #fde68a",
                      color: "#b45309",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ lineHeight: 0, mt: "2px" }}>
                      <RestartAltIcon
                        sx={{ color: "#f59e0b" }}
                        fontSize="small"
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: "#b45309", fontSize: { xs: 13, sm: 14 } }}
                      >
                        CÂN BẰNG LẠI
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#b45309", fontSize: { xs: 11, sm: 12 } }}
                      >
                        Tỉ lệ sẽ được tự động chuẩn hóa tổng = 100%. Kéo thanh
                        để ưu tiên loại.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Actions */}
            <Divider />
            {error && <Alert severity="error">{error}</Alert>}

            {/* Validation Summary Dialog */}
            <Dialog
              open={showSummary}
              onClose={() => setShowSummary(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle
                sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}
              >
                <CheckCircleIcon color="primary" />
                Xác nhận cấu hình
              </DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      color="primary"
                      gutterBottom
                    >
                      📝 Yêu cầu / Chủ đề:
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, bgcolor: "grey.50" }}
                    >
                      <Typography variant="body2">
                        {requirements || "(Chưa nhập)"}
                      </Typography>
                    </Paper>
                  </Box>

                  <Divider />

                  <Stack direction="row" spacing={2}>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">
                        Số câu hỏi
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {parsedCount}
                      </Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">
                        Độ khó
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {
                          DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)
                            ?.label
                        }
                      </Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">
                        Trình độ
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {cefrLevel === "auto" ? "Tự động" : cefrLevel}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      color="primary"
                      gutterBottom
                    >
                      📊 Loại câu hỏi & Tỉ lệ:
                    </Typography>
                    <Stack spacing={1}>
                      {allowedTypes.map((t) => (
                        <Box
                          key={t}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Chip
                            label={TYPE_LABELS[t]}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Typography variant="body2" fontWeight={600}>
                            {normalizedRatios[t] ?? 0}% (~
                            {predictedCounts[t] || 0} câu)
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {selectedTopics.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          color="primary"
                          gutterBottom
                        >
                          📚 Chủ đề:
                        </Typography>
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selectedTopics.map((topic) => (
                            <Chip
                              key={topic}
                              label={topic}
                              size="small"
                              color="secondary"
                            />
                          ))}
                        </Box>
                      </Box>
                    </>
                  )}

                  {grammarFocus.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          color="primary"
                          gutterBottom
                        >
                          🎯 Tập trung Ngữ pháp:
                        </Typography>
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {grammarFocus.map((topic) => (
                            <Chip
                              key={topic}
                              label={topic}
                              size="small"
                              color="warning"
                            />
                          ))}
                        </Box>
                      </Box>
                    </>
                  )}

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Nhấn <strong>XÁC NHẬN</strong> để bắt đầu tạo câu hỏi. Quá
                      trình có thể mất 10-30 giây tùy số lượng.
                    </Typography>
                  </Alert>
                </Stack>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                  onClick={() => setShowSummary(false)}
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button
                  variant="contained"
                  onClick={handleGenerate}
                  disabled={loading}
                  startIcon={loading ? null : <PsychologyAltIcon />}
                  sx={{ minWidth: 140 }}
                >
                  {loading ? "Đang tạo..." : "✨ XÁC NHẬN"}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Save Template Dialog */}
            <Dialog
              open={showTemplateDialog}
              onClose={() => setShowTemplateDialog(false)}
              maxWidth="xs"
              fullWidth
            >
              <DialogTitle
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SaveIcon color="success" />
                Lưu Template
              </DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  label="Tên Template"
                  fullWidth
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ví dụ: Luyện Grammar A2"
                  sx={{ mt: 2 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  Template sẽ lưu tất cả cấu hình hiện tại để sử dụng lại sau.
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowTemplateDialog(false)}>
                  Hủy
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                  startIcon={<SaveIcon />}
                >
                  Lưu
                </Button>
              </DialogActions>
            </Dialog>

            {/* Load Template Dialog */}
            <Dialog
              open={showLoadTemplateDialog}
              onClose={() => setShowLoadTemplateDialog(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <FolderOpenIcon color="primary" />
                Templates đã lưu ({savedTemplates.length})
              </DialogTitle>
              <DialogContent>
                {savedTemplates.length === 0 ? (
                  <Alert severity="info">
                    Chưa có template nào. Hãy cấu hình và lưu template đầu tiên!
                  </Alert>
                ) : (
                  <List>
                    {savedTemplates.map((template, index) => (
                      <ListItem
                        key={index}
                        disablePadding
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteTemplate(index)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemButton
                          onClick={() => handleLoadTemplate(template)}
                        >
                          <ListItemIcon>
                            <FolderOpenIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={template.name}
                            secondary={`${template.config.count} câu • ${
                              DIFFICULTY_OPTIONS.find(
                                (d) => d.value === template.config.difficulty
                              )?.label
                            } • ${
                              template.config.cefrLevel === "auto"
                                ? "Auto"
                                : template.config.cefrLevel
                            }`}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowLoadTemplateDialog(false)}>
                  Đóng
                </Button>
              </DialogActions>
            </Dialog>

            {/* Prompt Preview Dialog */}
            <Dialog
              open={showPromptPreview}
              onClose={() => setShowPromptPreview(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <VisibilityIcon color="info" />
                Preview Prompt gửi đến AI
              </DialogTitle>
              <DialogContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Đây là prompt đã được xử lý sẽ gửi đến AI. Kiểm tra để đảm bảo
                  chính xác.
                </Alert>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    fontFamily: "monospace",
                    fontSize: 13,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {buildEnhancedPrompt()}
                </Paper>
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    Chi tiết cấu hình:
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    <Typography variant="caption">
                      • Số câu hỏi: {parsedCount}
                    </Typography>
                    <Typography variant="caption">
                      • Loại:{" "}
                      {allowedTypes.map((t) => TYPE_LABELS[t]).join(", ")}
                    </Typography>
                    <Typography variant="caption">
                      • Trộn ngẫu nhiên: {mixTypes ? "Có" : "Không"}
                    </Typography>
                    {selectedTopics.length > 0 && (
                      <Typography variant="caption">
                        • Chủ đề: {selectedTopics.join(", ")}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowPromptPreview(false)}>
                  Đóng
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setShowPromptPreview(false);
                    setShowSummary(true);
                  }}
                  startIcon={<CheckCircleIcon />}
                >
                  OK, Tiếp tục tạo
                </Button>
              </DialogActions>
            </Dialog>

            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              spacing={2}
              alignItems={{ sm: "center" }}
              justifyContent="space-between"
            >
              <Button
                variant="text"
                color="error"
                disabled={loading || !requirements}
                onClick={() => {
                  setRequirements("");
                  setDifficulty("mixed");
                  setCefrLevel("auto");
                  setGrammarFocus([]);
                  setSelectedTopics([]);
                  setCountInput("8");
                  setAllowedTypes([
                    "vocab-mcq",
                    "grammar-mcq",
                    "sentence-order",
                  ]);
                  resetRatios();
                }}
                sx={{
                  alignSelf: { xs: "center", sm: "flex-start" },
                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                🗑️ ĐẶT LẠI TẤT CẢ
              </Button>
              <Button
                variant="contained"
                onClick={() => setShowSummary(true)}
                disabled={loading || !requirements.trim() || !isCountValid}
                startIcon={<CheckCircleIcon />}
                sx={{
                  borderRadius: 50,
                  px: { xs: 2.25, sm: 3 },
                  py: { xs: 0.9, sm: 1.25 },
                  fontSize: { xs: "1rem", sm: "1.125rem" },
                  boxShadow:
                    "0 10px 15px rgba(59,130,246,0.2), 0 4px 6px rgba(59,130,246,0.1)",
                  transform: "translateZ(0)",
                  "&:hover": { transform: "scale(1.02)" },
                }}
              >
                ✨ XEM TÓM TẮT & TẠO
              </Button>
            </Stack>

            {loading && <LinearProgress />}
            {rawPreview && (
              <Box>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Chip size="small" label="Preview JSON" />
                  <Typography variant="caption" color="text.secondary">
                    (đã điều hướng sang Bài tập – xem tại đó để làm bài)
                  </Typography>
                </Stack>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    bgcolor: "grey.900",
                    color: "grey.100",
                    fontSize: 12,
                    maxHeight: 260,
                    overflow: "auto",
                    borderRadius: 1,
                  }}
                >
                  {rawPreview}
                </Box>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Blue info box */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            display: "flex",
            alignItems: "flex-start",
            borderRadius: 2,
            bgcolor: "#e0f2fe",
            border: "1px solid #93c5fd",
            color: "#1d4ed8",
            gap: 1,
          }}
        >
          <Box sx={{ fontSize: 18, lineHeight: 1 }}>ⓘ</Box>
          <Typography
            variant="body2"
            sx={{ fontSize: { xs: ".9rem", sm: "1rem" } }}
          >
            Sau khi tạo bài, bạn sẽ được chuyển tới trang Bài tập với bộ câu hỏi
            nguồn: <strong>AI</strong> (có thể reset để quay lại bộ tình trạng
            ban đầu).
          </Typography>
        </Box>

        {/* Green info box for new features */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            display: "flex",
            alignItems: "flex-start",
            borderRadius: 2,
            bgcolor: "#dcfce7",
            border: "1px solid #86efac",
            color: "#166534",
            gap: 1,
          }}
        >
          <Box sx={{ fontSize: 18, lineHeight: 1 }}>✨</Box>
          <Box>
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ fontSize: { xs: ".9rem", sm: "1rem" }, mb: 0.5 }}
            >
              Tính năng nổi bật:
            </Typography>
            <Typography
              variant="caption"
              component="div"
              sx={{ fontSize: { xs: ".85rem", sm: ".9rem" } }}
            >
              <strong>Ưu tiên CAO:</strong>
              <br />• <strong>Độ khó & Trình độ CEFR</strong>: Tùy chỉnh chính
              xác
              <br />• <strong>Tập trung Ngữ pháp</strong>: Chọn cấu trúc cụ thể
              <br />• <strong>Xem tóm tắt</strong>: Kiểm tra trước khi tạo
              <br />
              <br />
              <strong>Ưu tiên TRUNG BÌNH:</strong>
              <br />• <strong>🏷️ Chủ đề/Theme</strong>: Chọn ngữ cảnh cho bài
              tập
              <br />• <strong>💾 Lưu/Tải Template</strong>: Tái sử dụng cấu hình
              <br />• <strong>👁️ Preview Prompt</strong>: Xem prompt gửi AI
              <br />• <strong>⚡ Template nhanh</strong>: 4 preset có sẵn
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
