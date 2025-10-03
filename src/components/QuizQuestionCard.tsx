"use client";
import React from "react";
import {
  Card,
  CardContent,
  Stack,
  Chip,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Alert,
  alpha,
  Box,
} from "@mui/material";
import {
  AnyQuizQuestion,
  VocabMcqQuestion,
  GrammarMcqQuestion,
  SentenceOrderQuestion,
} from "@/types";

interface Props {
  q: AnyQuizQuestion;
  index: number;
  total: number;
  userAnswer: unknown;
  submitted: boolean;
  resultDetail?: { correct: boolean; explanation: string } | undefined;
  onAnswer: (value: number | string) => void;
}

export const QuizQuestionCard: React.FC<Props> = ({
  q,
  index,
  total,
  userAnswer,
  submitted,
  resultDetail,
  onAnswer,
}) => {
  const isMcq = q.type === "vocab-mcq" || q.type === "grammar-mcq";
  const answered =
    (isMcq && typeof userAnswer === "number") ||
    (!isMcq &&
      typeof userAnswer === "string" &&
      (userAnswer as string).trim() !== "");

  return (
    <Card
      variant={answered ? "elevation" : "outlined"}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderColor: answered ? "primary.light" : undefined,
        transition: "border-color .25s, box-shadow .25s, background .35s",
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 1, flexWrap: "wrap" }}
        >
          <Chip
            size="small"
            color="primary"
            label={`Câu ${index + 1}/${total}`}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            size="small"
            variant="outlined"
            label={
              q.type === "vocab-mcq"
                ? "Từ vựng"
                : q.type === "grammar-mcq"
                ? "Ngữ pháp"
                : "Sắp xếp câu"
            }
          />
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
          {answered && !submitted && (
            <Chip
              size="small"
              label="Đã trả lời"
              color="success"
              variant="outlined"
            />
          )}
          {submitted && resultDetail && (
            <Chip
              size="small"
              label={resultDetail.correct ? "Đúng" : "Sai"}
              color={resultDetail.correct ? "success" : "error"}
            />
          )}
        </Stack>

        <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
          {q.type === "sentence-order"
            ? "Sắp xếp câu thành câu hoàn chỉnh"
            : "Chọn đáp án đúng"}
        </Typography>
        {isMcq && (
          <Typography variant="h6" sx={{ mb: 1, lineHeight: 1.35 }}>
            {(q as VocabMcqQuestion | GrammarMcqQuestion).prompt}
          </Typography>
        )}

        {isMcq ? (
          <RadioGroup
            value={typeof userAnswer === "number" ? String(userAnswer) : ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              !submitted && onAnswer(Number(e.target.value))
            }
          >
            {(q as VocabMcqQuestion | GrammarMcqQuestion).options.map(
              (opt: string, idx: number) => {
                const selected = userAnswer === idx;
                const isCorrect =
                  submitted &&
                  idx ===
                    (q as VocabMcqQuestion | GrammarMcqQuestion).answerIndex;
                const isWrong = submitted && selected && !isCorrect;
                return (
                  <FormControlLabel
                    key={idx}
                    value={String(idx)}
                    control={<Radio disabled={submitted} />}
                    label={
                      <Box
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: isCorrect
                            ? (theme) =>
                                alpha(theme.palette.success.light, 0.35)
                            : isWrong
                            ? (theme) => alpha(theme.palette.error.light, 0.35)
                            : selected
                            ? (theme) =>
                                alpha(theme.palette.primary.light, 0.25)
                            : undefined,
                          transition: "background .3s",
                        }}
                      >
                        {opt}
                      </Box>
                    }
                    sx={{
                      m: 0,
                      mb: 0.5,
                      alignItems: "flex-start",
                      ".MuiFormControlLabel-label": { width: "100%" },
                    }}
                  />
                );
              }
            )}
          </RadioGroup>
        ) : (
          <TextField
            fullWidth
            disabled={submitted}
            placeholder={(q as SentenceOrderQuestion).tokens.join(" | ")}
            value={typeof userAnswer === "string" ? (userAnswer as string) : ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              !submitted && onAnswer(e.target.value)
            }
          />
        )}

        {submitted && resultDetail && (
          <Alert
            severity={resultDetail.correct ? "success" : "error"}
            variant="outlined"
            sx={{ mt: 1.5, lineHeight: 1.4 }}
          >
            <Typography variant="body2" component="span" fontWeight={600}>
              {resultDetail.correct ? "Chính xác:" : "Giải thích:"}{" "}
            </Typography>
            <Typography variant="body2" component="span">
              {resultDetail.explanation || "(Không có giải thích)"}
            </Typography>
            {isMcq && !resultDetail.correct && (
              <Typography
                variant="caption"
                sx={{ display: "block", mt: 0.5, opacity: 0.75 }}
              >
                Đáp án đúng:{" "}
                {
                  (q as VocabMcqQuestion | GrammarMcqQuestion).options[
                    (q as VocabMcqQuestion | GrammarMcqQuestion).answerIndex
                  ]
                }
              </Typography>
            )}
            {!isMcq && !resultDetail.correct && (
              <Typography
                variant="caption"
                sx={{ display: "block", mt: 0.5, opacity: 0.75 }}
              >
                Đáp án đúng: {(q as SentenceOrderQuestion).answer}
              </Typography>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizQuestionCard;
