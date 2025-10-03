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
  Tooltip,
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
          p: 2,
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
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            size="small"
            color={percentage === 100 ? "success" : "default"}
            label={`Tiến độ: ${answeredCount}/${questions.length} (${percentage}%)`}
          />
          {source === "ai" && (
            <Chip size="small" variant="outlined" label="Nguồn: AI" />
          )}
          {result && (
            <Chip
              size="small"
              color={
                result.correct / (result.total || 1) >= 0.7
                  ? "success"
                  : "warning"
              }
              label={`Điểm: ${result.correct}/${result.total}`}
            />
          )}
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {!result && (
            <Tooltip title="Chấm điểm bài làm">
              <span>
                <Button
                  variant="contained"
                  disabled={!questions.length || !answeredCount}
                  onClick={() => dispatch(submit())}
                >
                  Nộp bài
                </Button>
              </span>
            </Tooltip>
          )}
          <Button variant="outlined" onClick={() => dispatch(reset())}>
            {result ? "Làm lại" : "Reset"}
          </Button>
          {source === "ai" && !result && (
            <Button
              variant="text"
              onClick={() => dispatch(loadQuizzes())}
              sx={{ textTransform: "none" }}
            >
              Tải bộ tĩnh
            </Button>
          )}
          {!source || source === "static" ? (
            <Button
              variant="text"
              href="/generate-quizzes"
              sx={{ textTransform: "none" }}
            >
              Tạo bằng AI
            </Button>
          ) : null}
        </Stack>
      </Paper>
    </Box>
  );
}
