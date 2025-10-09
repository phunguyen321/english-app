"use client";
import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector, type RootState } from "@/store";
import {
  loadQuizzes,
  answerQuestion,
  submit,
  reset,
} from "@/store/slices/quizSlice";
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  LinearProgress,
  Paper,
} from "@mui/material";
import QuizQuestionCard from "@/components/QuizQuestionCard";

export default function QuizzesPage() {
  const dispatch = useAppDispatch();
  const { questions, status, userAnswers, result, source } = useAppSelector(
    (s: RootState) => s.quiz
  );

  useEffect(() => {
    if (status === "idle") dispatch(loadQuizzes());
  }, [status, dispatch]);

  const answeredCount = useMemo(
    () =>
      questions.reduce((acc, q) => {
        const a = userAnswers[q.id];
        if (q.type === "vocab-mcq" || q.type === "grammar-mcq") {
          return acc + (typeof a === "number" ? 1 : 0);
        }
        return acc + (typeof a === "string" && a.trim() ? 1 : 0);
      }, 0),
    [questions, userAnswers]
  );

  const percentage = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  return (
    <Box sx={{ pb: 10 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ mr: 1 }}>
          Bài tập
        </Typography>
        {source === "ai" && <Chip size="small" color="info" label="AI" />}
        {result && (
          <Chip
            size="small"
            color={
              result.correct / (result.total || 1) >= 0.7
                ? "success"
                : "warning"
            }
            label={`Kết quả: ${result.correct}/${result.total}`}
          />
        )}
      </Box>
      {status === "loading" && <LinearProgress sx={{ mb: 2 }} />}

      {!questions.length && status === "succeeded" && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Chưa có câu hỏi
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Hãy tạo bộ câu hỏi AI hoặc tải lại dữ liệu.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button href="/generate-quizzes" variant="contained">
              Tạo bằng AI
            </Button>
            <Button onClick={() => dispatch(loadQuizzes())}>Tải lại</Button>
          </Stack>
        </Paper>
      )}

      <Stack spacing={2} sx={{ mb: 4 }}>
        {questions.map((q, idx) => (
          <QuizQuestionCard
            key={q.id}
            q={q}
            index={idx}
            total={questions.length}
            userAnswer={userAnswers[q.id]}
            submitted={!!result}
            resultDetail={result?.details.find((d) => d.id === q.id)}
            onAnswer={(value) => {
              dispatch(
                answerQuestion({ id: q.id, answer: value as number | string })
              );
            }}
          />
        ))}
      </Stack>

      <Paper
        elevation={3}
        sx={{
          position: { xs: "fixed", md: "sticky" },
          bottom: { xs: 0, md: "unset" },
          top: { md: 72 },
          left: 0,
          right: 0,
          zIndex: 10,
          p: { xs: 1.75, sm: 2.5 },
          borderRadius: { xs: 0, md: 2 },
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
          justifyContent: "space-between",
          background: (theme) =>
            theme.palette.mode === "light"
              ? "rgba(255,255,255,0.9)"
              : "rgba(30,30,30,0.9)",
          backdropFilter: "blur(8px)",
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: { xs: 14, sm: 16 } }}>
              {`Tiến độ: ${answeredCount}/${questions.length}`} ({percentage}%)
            </Typography>
            <Box
              sx={{
                width: { xs: 120, sm: 150 },
                height: { xs: 6, sm: 8 },
                bgcolor: "divider",
                borderRadius: 1,
                overflow: "hidden",
                mt: 0.5,
              }}
            >
              <Box
                sx={{
                  height: 1,
                  width: `${percentage}%`,
                  bgcolor: "success.main",
                }}
              />
            </Box>
          </Box>
          {result && (
            <Typography
              sx={{
                fontWeight: 600,
                color: "error.main",
                fontSize: { xs: 14, sm: 16 },
              }}
            >
              {`Điểm: ${result.correct}/${result.total}`}
            </Typography>
          )}
        </Box>

        <Box>
          {!result ? (
            <Button
              variant="contained"
              disabled={!questions.length || !answeredCount}
              onClick={() => dispatch(submit())}
              sx={{ minWidth: { xs: 120, sm: 140 }, py: { xs: 0.75, sm: 1 } }}
            >
              Kiểm tra
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => dispatch(reset())}
              sx={{ minWidth: { xs: 120, sm: 140 }, py: { xs: 0.75, sm: 1 } }}
            >
              Làm lại
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
