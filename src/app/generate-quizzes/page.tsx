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
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GavelIcon from "@mui/icons-material/Gavel";
import SortIcon from "@mui/icons-material/Sort";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
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
            }}
          >
            <AutoAwesomeIcon
              color="primary"
              sx={{ fontSize: { xs: 24, sm: 28 } }}
            />
            Tạo bài tập bằng AI
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

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                sx={{ mb: 1, flexWrap: "wrap" }}
              >
                <Card
                  variant="outlined"
                  sx={{ flex: "1 1 200px", minWidth: 200 }}
                >
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
                      sx={{ py: 1.25, minHeight: { xs: 72, sm: 80 } }}
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
                <Card
                  variant="outlined"
                  sx={{ flex: "1 1 200px", minWidth: 200 }}
                >
                  <CardActionArea
                    onClick={() => {
                      setAllowedTypes(["grammar-mcq"]);
                      setMixTypes(false);
                    }}
                  >
                    <CardContent
                      sx={{ py: 1.25, minHeight: { xs: 72, sm: 80 } }}
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
                <Card
                  variant="outlined"
                  sx={{ flex: "1 1 200px", minWidth: 200 }}
                >
                  <CardActionArea
                    onClick={() => {
                      setAllowedTypes(["vocab-mcq"]);
                      setMixTypes(false);
                    }}
                  >
                    <CardContent
                      sx={{ py: 1.25, minHeight: { xs: 72, sm: 80 } }}
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
                onClick={() => setRequirements("")}
                sx={{
                  alignSelf: { xs: "center", sm: "flex-start" },
                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                🗑️ XÓA YÊU CẦU
              </Button>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={loading || !requirements.trim() || !isCountValid}
                startIcon={<PsychologyAltIcon />}
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
                {loading ? "Đang tạo..." : "✨ SINH CÂU HỎI"}
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
      </Container>
    </Box>
  );
}
