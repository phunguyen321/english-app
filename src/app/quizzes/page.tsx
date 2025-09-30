"use client";
import { useEffect } from "react";
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
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Chip,
  TextField,
  LinearProgress,
} from "@mui/material";

export default function QuizzesPage() {
  const dispatch = useAppDispatch();
  const { questions, status, userAnswers, result } = useAppSelector(
    (s: RootState) => s.quiz
  );

  useEffect(() => {
    if (status === "idle") dispatch(loadQuizzes());
  }, [status, dispatch]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bài tập
      </Typography>
      {status === "loading" && <LinearProgress />}
      <Stack spacing={2}>
        {questions.map((q) => (
          <Card key={q.id}>
            <CardContent>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Chip size="small" label={q.type} />
                <Chip
                  size="small"
                  label={q.difficulty}
                  color={
                    q.difficulty === "hard"
                      ? "error"
                      : q.difficulty === "medium"
                      ? "warning"
                      : "default"
                  }
                />
              </Stack>
              <Typography sx={{ mb: 1 }}>
                {q.type === "sentence-order"
                  ? "Sắp xếp câu:"
                  : "Chọn đáp án đúng:"}
              </Typography>
              {q.type !== "sentence-order" && (
                <Typography variant="h6">{q.prompt}</Typography>
              )}
              {q.type === "vocab-mcq" || q.type === "grammar-mcq" ? (
                <RadioGroup
                  value={
                    typeof userAnswers[q.id] === "number"
                      ? String(userAnswers[q.id])
                      : ""
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    dispatch(
                      answerQuestion({
                        id: q.id,
                        answer: Number(e.target.value),
                      })
                    )
                  }
                >
                  {q.options.map((opt: string, idx: number) => (
                    <FormControlLabel
                      key={idx}
                      value={String(idx)}
                      control={<Radio />}
                      label={opt}
                    />
                  ))}
                </RadioGroup>
              ) : (
                <TextField
                  fullWidth
                  placeholder={q.tokens.join(" | ")}
                  value={
                    typeof userAnswers[q.id] === "string"
                      ? (userAnswers[q.id] as string)
                      : ""
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    dispatch(
                      answerQuestion({ id: q.id, answer: e.target.value })
                    )
                  }
                />
              )}
              {result && (
                <Typography
                  color={
                    result.details.find((d) => d.id === q.id)?.correct
                      ? "success.main"
                      : "error.main"
                  }
                  sx={{ mt: 1 }}
                >
                  {result.details.find((d) => d.id === q.id)?.correct
                    ? "Đúng"
                    : "Sai"}{" "}
                  — {result.details.find((d) => d.id === q.id)?.explanation}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}

        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={() => dispatch(submit())}>
            Nộp bài
          </Button>
          <Button onClick={() => dispatch(reset())}>Làm lại</Button>
          {result && (
            <Chip
              label={`Kết quả: ${result.correct}/${result.total}`}
              color={
                result.correct / (result.total || 1) >= 0.7
                  ? "success"
                  : "warning"
              }
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
