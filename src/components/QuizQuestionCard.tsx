"use client";
import React from "react";
import {
  Card,
  CardContent,
  Stack,
  Chip,
  Typography,
  TextField,
  alpha,
  Box,
  List,
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
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
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
            color="info"
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
          <Typography
            sx={{
              typography: { xs: "h6", sm: "h5" },
              mb: { xs: 1, sm: 1.5 },
              lineHeight: 1.35,
              fontWeight: 700,
            }}
          >
            {(q as VocabMcqQuestion | GrammarMcqQuestion).prompt}
          </Typography>
        )}

        {isMcq ? (
          <List sx={{ p: 0, m: 0 }}>
            {(q as VocabMcqQuestion | GrammarMcqQuestion).options.map(
              (opt: string, idx: number) => {
                const selected = userAnswer === idx;
                const answerIndex = (q as VocabMcqQuestion | GrammarMcqQuestion)
                  .answerIndex;
                const isCorrect = submitted && idx === answerIndex;
                const isWrong = submitted && selected && !isCorrect;

                return (
                  <Box
                    key={idx}
                    onClick={() => !submitted && onAnswer(idx)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: { xs: 1.25, sm: 1.8 },
                      mb: { xs: 0.9, sm: 1.2 },
                      borderRadius: { xs: 1.5, sm: 2 },
                      border: "2px solid",
                      borderColor: isCorrect
                        ? "success.main"
                        : isWrong
                        ? "error.main"
                        : selected
                        ? "primary.main"
                        : "divider",
                      bgcolor: (theme) =>
                        isCorrect
                          ? alpha(theme.palette.success.light, 0.25)
                          : isWrong
                          ? alpha(theme.palette.error.light, 0.25)
                          : theme.palette.background.paper,
                      cursor: submitted ? "default" : "pointer",
                      transition: "all .2s ease-in-out",
                      userSelect: "none",
                      position: "relative",
                      "&:hover": !submitted
                        ? {
                            borderColor: "primary.main",
                            boxShadow: "0 0 10px rgba(74,144,226,.15)",
                          }
                        : undefined,
                    }}
                  >
                    {/* Custom radio */}
                    <Box
                      sx={{
                        width: { xs: 16, sm: 20 },
                        height: { xs: 16, sm: 20 },
                        borderRadius: "50%",
                        border: "2px solid",
                        borderColor: isCorrect
                          ? "success.main"
                          : isWrong
                          ? "error.main"
                          : selected
                          ? "primary.main"
                          : "text.secondary",
                        mr: { xs: 1.25, sm: 1.5 },
                        flexShrink: 0,
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all .2s",
                        bgcolor: isCorrect
                          ? "success.main"
                          : isWrong
                          ? "error.main"
                          : "transparent",
                        ...(isCorrect
                          ? {
                              "&::after": {
                                content: '""',
                                position: "absolute",
                                width: { xs: 4, sm: 5 },
                                height: { xs: 8, sm: 10 },
                                border: "2px solid white",
                                borderWidth: "0 2px 2px 0",
                                transform: "rotate(45deg)",
                                top: { xs: 1, sm: 1 },
                                left: { xs: 5, sm: 6 },
                              },
                            }
                          : isWrong
                          ? {
                              "&::before": {
                                content: '""',
                                position: "absolute",
                                height: "100%",
                                width: { xs: 1.6, sm: 2 },
                                bgcolor: "common.white",
                                top: 0,
                                left: "calc(50% - 1px)",
                                transform: "rotate(-45deg)",
                                borderRadius: 1,
                              },
                              "&::after": {
                                content: '""',
                                position: "absolute",
                                height: "100%",
                                width: { xs: 1.6, sm: 2 },
                                bgcolor: "common.white",
                                top: 0,
                                left: "calc(50% - 1px)",
                                transform: "rotate(45deg)",
                                borderRadius: 1,
                              },
                            }
                          : selected
                          ? {
                              "&::after": {
                                content: '""',
                                width: { xs: 8, sm: 10 },
                                height: { xs: 8, sm: 10 },
                                borderRadius: "50%",
                                bgcolor: "primary.main",
                              },
                            }
                          : {}),
                      }}
                    />

                    <Typography
                      className="option-label"
                      sx={{
                        fontSize: { xs: "1rem", sm: "1.1rem" },
                        fontWeight: 500,
                        flexGrow: 1,
                      }}
                    >
                      {opt}
                    </Typography>
                  </Box>
                );
              }
            )}
          </List>
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
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) =>
                theme.palette.mode === "light"
                  ? "#f7f9fc"
                  : alpha(theme.palette.primary.light, 0.08),
              borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
              fontSize: { xs: ".9rem", sm: ".95rem" },
              lineHeight: 1.6,
            }}
          >
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <Box component="strong" sx={{ color: "primary.main" }}>
                Giải thích:
              </Box>{" "}
              {resultDetail.explanation || "(Không có giải thích)"}
            </Typography>
            {isMcq && (
              <Typography variant="body2">
                Đáp án đúng:{" "}
                <Box
                  component="span"
                  sx={{ color: "success.main", fontWeight: 700 }}
                >
                  {
                    (q as VocabMcqQuestion | GrammarMcqQuestion).options[
                      (q as VocabMcqQuestion | GrammarMcqQuestion).answerIndex
                    ]
                  }
                </Box>
              </Typography>
            )}
            {!isMcq && (
              <Typography variant="body2">
                Đáp án đúng:{" "}
                <Box
                  component="span"
                  sx={{ color: "success.main", fontWeight: 700 }}
                >
                  {(q as SentenceOrderQuestion).answer}
                </Box>
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizQuestionCard;
