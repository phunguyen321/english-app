"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import { setQuestions } from "@/store/slices/quizSlice";
import {
  Box,
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
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardActionArea,
  CardContent,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GavelIcon from "@mui/icons-material/Gavel";
import SortIcon from "@mui/icons-material/Sort";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

export default function GenerateQuizzesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [requirements, setRequirements] = useState("");
  // Keep raw input as string to avoid forcing a default like 0 when user clears the field
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

  // Parse and validate count without mutating user input
  const parsedCount = useMemo(() => {
    const v = parseInt(countInput, 10);
    return Number.isFinite(v) ? v : NaN;
  }, [countInput]);
  // Valid when between 1 and 50 inclusive
  const isCountValid =
    Number.isFinite(parsedCount) && parsedCount >= 1 && parsedCount <= 50;
  // For calculations, treat invalid as 0 so predictedCounts show 0 without blocking typing
  const allocCount = isCountValid ? (parsedCount as number) : 0;

  // Compute normalized ratios for display
  const normalizedRatios = useMemo(() => {
    const activeEntries = Object.entries(typeRatios).filter(([k]) =>
      allowedTypes.includes(k)
    );
    const sum = activeEntries.reduce((a, [, v]) => a + v, 0) || 1;
    return Object.fromEntries(
      activeEntries.map(([k, v]) => [k, Number(((v / sum) * 100).toFixed(1))])
    );
  }, [typeRatios, allowedTypes]);

  // Predicted question counts per type (integer allocation similar to backend logic)
  const predictedCounts = useMemo(() => {
    const entries = allowedTypes.map((t) => ({
      type: t,
      pct: normalizedRatios[t] || 0,
    }));
    const rawAllocs = entries.map((e) => ({
      type: e.type,
      raw: (e.pct / 100) * allocCount,
      floor: Math.floor((e.pct / 100) * allocCount),
    }));
    const allocated = rawAllocs.reduce((a, r) => a + r.floor, 0);
    let leftover = allocCount - allocated;
    // distribute leftover by largest fractional part
    const fracSorted = [...rawAllocs]
      .map((r) => ({ type: r.type, frac: r.raw - r.floor }))
      .sort((a, b) => b.frac - a.frac);
    const result: Record<string, number> = Object.fromEntries(
      rawAllocs.map((r) => [r.type, r.floor])
    );
    let idx = 0;
    while (leftover > 0 && fracSorted.length) {
      result[fracSorted[idx % fracSorted.length].type] += 1;
      leftover--;
      idx++;
    }
    return result;
  }, [allowedTypes, normalizedRatios, allocCount]);

  const updateRatio = (key: string, value: number) => {
    setTypeRatios((prev) => ({ ...prev, [key]: value }));
  };

  const resetRatios = () => {
    setTypeRatios((prev) => {
      const next = { ...prev };
      allowedTypes.forEach((t) => {
        next[t] = 1; // equal weight
      });
      return next;
    });
  };

  const isBalanced = useMemo(() => {
    if (allowedTypes.length <= 1) return true;
    const vals = allowedTypes.map((t) => typeRatios[t] || 0);
    if (vals.some((v) => v <= 0)) return false;
    const first = vals[0];
    return vals.every((v) => Math.abs(v - first) < 0.0001);
  }, [allowedTypes, typeRatios]);

  const handleGenerate = async () => {
    if (!requirements.trim()) {
      setError("Nhập yêu cầu / chủ đề trước.");
      return;
    }
    setError(null);
    setLoading(true);
    setRawPreview("");
    try {
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements,
          count: parsedCount,
          mixTypes,
          allowedTypes,
          typeRatios: Object.fromEntries(
            allowedTypes.map((k) => [k, typeRatios[k] || 1])
          ),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Lỗi không xác định");
      dispatch(setQuestions({ questions: json.data, source: "ai" }));
      setRawPreview(JSON.stringify(json.data, null, 2));
      router.push("/quizzes");
    } catch (e: unknown) {
      const msg = (e instanceof Error && e.message) || "Đã xảy ra lỗi.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", gap: 1, alignItems: "center" }}
      >
        <AutoAwesomeIcon color="primary" /> Tạo bài tập bằng AI
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Mô tả yêu cầu: trình độ, chủ đề, loại ngữ pháp, kiểu câu... Hệ thống sẽ
        sinh ra bộ câu hỏi bạn có thể làm ngay ở trang Bài tập.
      </Typography>
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Yêu cầu / Chủ đề"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Ví dụ: 10 câu về thì hiện tại hoàn thành mức B1, trộn từ vựng du lịch và ngữ pháp"
            multiline
            minRows={3}
            disabled={loading}
            fullWidth
          />
          <Box>
            <Typography gutterBottom fontWeight={600}>
              Số câu hỏi
            </Typography>
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
                if (Number.isNaN(v)) {
                  // Keep raw text to not force a default like 0
                  setCountInput(val);
                } else {
                  // Cap only the maximum; no minimum enforcement
                  setCountInput(String(Math.min(v, 50)));
                }
              }}
              inputProps={{ max: 50 }}
              sx={{ width: 160, maxWidth: "100%" }}
              error={!isCountValid}
              helperText={
                isCountValid
                  ? "Tối đa 50 (không đặt min). Để trống/sai sẽ không thể bấm tạo."
                  : "Số hợp lệ từ 1 đến 50."
              }
              label="Số lượng"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              Có thể nhập trực tiếp số lớn (ví dụ 50) nhưng lưu ý thời gian tạo
              lâu hơn.
            </Typography>
          </Box>
          <Box>
            <Typography gutterBottom fontWeight={600}>
              Loại câu hỏi
            </Typography>
            <ToggleButtonGroup
              value={allowedTypes}
              onChange={(e, newValue: string[]) => {
                if (!newValue || newValue.length === 0) return; // không cho rỗng
                setAllowedTypes(newValue);
              }}
              aria-label="Chọn loại câu hỏi"
              sx={{ flexWrap: "wrap", gap: 1, mb: 1 }}
            >
              <ToggleButton
                value="vocab-mcq"
                aria-label="Từ vựng"
                sx={{ px: 2, py: 1 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <MenuBookIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Từ vựng
                  </Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton
                value="grammar-mcq"
                aria-label="Ngữ pháp"
                sx={{ px: 2, py: 1 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <GavelIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Ngữ pháp
                  </Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton
                value="sentence-order"
                aria-label="Sắp xếp câu"
                sx={{ px: 2, py: 1 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <SortIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Sắp xếp câu
                  </Typography>
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              sx={{ mb: 1 }}
            >
              <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
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
                  <CardContent sx={{ py: 1.25 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      gutterBottom
                    >
                      Gợi ý: Đa dạng
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Chọn cả 3 loại để tạo bộ phong phú.
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
              <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
                <CardActionArea
                  onClick={() => {
                    setAllowedTypes(["grammar-mcq"]);
                    setMixTypes(false);
                  }}
                >
                  <CardContent sx={{ py: 1.25 }}>
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
              <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
                <CardActionArea
                  onClick={() => {
                    setAllowedTypes(["vocab-mcq"]);
                    setMixTypes(false);
                  }}
                >
                  <CardContent sx={{ py: 1.25 }}>
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
            </Stack>
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.5 }}
            >
              Đang chọn:{" "}
              {allowedTypes.map((t) => TYPE_LABELS[t] || t).join(", ")}
            </Typography>
            {allowedTypes.length > 1 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
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
                        <Typography variant="caption" color="text.secondary">
                          {normalizedRatios[t] ?? 0}% (~
                          {predictedCounts[t] || 0})
                        </Typography>
                      </Stack>
                      <input
                        type="range"
                        min={1}
                        max={100}
                        value={Math.min(
                          100,
                          Math.max(1, Math.round((typeRatios[t] || 1) * 10))
                        )}
                        onChange={(e) => {
                          const raw = Number(e.target.value);
                          // Store raw /10 to keep small numbers usable
                          updateRatio(t, raw / 10);
                        }}
                        disabled={loading}
                        style={{ width: "100%" }}
                        aria-label={`Tỉ lệ ${TYPE_LABELS[t]} hiện tại ${
                          normalizedRatios[t] || 0
                        } phần trăm, dự kiến khoảng ${
                          predictedCounts[t] || 0
                        } câu`}
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
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.75, display: "block" }}
                >
                  Tỉ lệ sẽ được tự động chuẩn hóa tổng = 100%. Kéo thanh để ưu
                  tiên loại.
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.25, display: "block" }}
                >
                  Dự kiến phân bổ:{" "}
                  {allowedTypes
                    .map((t) => `${TYPE_LABELS[t]} ~${predictedCounts[t] || 0}`)
                    .join(" · ")}
                </Typography>
              </Box>
            )}
          </Box>
          <Divider />
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={loading || !requirements.trim() || !isCountValid}
              startIcon={<PsychologyAltIcon />}
            >
              {loading ? "Đang tạo..." : "Sinh câu hỏi"}
            </Button>
            <Button
              disabled={loading || !requirements}
              onClick={() => setRequirements("")}
            >
              Xóa yêu cầu
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
      <Alert severity="info" variant="outlined">
        Sau khi tạo, bạn sẽ được chuyển tới trang Bài tập với bộ câu hỏi nguồn:{" "}
        <strong>AI</strong> (có thể reset để quay lại bộ tĩnh ban đầu).
      </Alert>
    </Box>
  );
}
