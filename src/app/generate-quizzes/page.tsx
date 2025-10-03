"use client";
import React, { useState } from "react";
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
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";

export default function GenerateQuizzesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [requirements, setRequirements] = useState("");
  const [count, setCount] = useState<number>(8);
  const [mixTypes, setMixTypes] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawPreview, setRawPreview] = useState<string>("");

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
        body: JSON.stringify({ requirements, count, mixTypes }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Lỗi không xác định");
      dispatch(setQuestions({ questions: json.data, source: "ai" }));
      setRawPreview(JSON.stringify(json.data, null, 2));
      router.push("/quizzes");
    } catch (e: any) {
      setError(e.message || "Đã xảy ra lỗi.");
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
              value={count}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (isNaN(v)) return setCount(3);
                setCount(Math.min(Math.max(v, 3), 50));
              }}
              inputProps={{ min: 3, max: 50 }}
              sx={{ width: 160, maxWidth: "100%" }}
              helperText="Nhập số từ 3 đến 50"
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
          <FormControlLabel
            control={
              <Switch
                checked={mixTypes}
                onChange={(e) => setMixTypes(e.target.checked)}
                disabled={loading}
              />
            }
            label="Trộn nhiều loại câu hỏi (MCQ từ vựng, ngữ pháp, sắp xếp câu)"
          />
          <Divider />
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={loading}
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
