"use client";
import React from "react";
import {
  Card,
  CardContent,
  Stack,
  Chip,
  Typography,
  alpha,
  Box,
  List,
  Button,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
// Removed inline reorder arrows per request
import {
  AnyQuizQuestion,
  SentenceOrderQuestion,
  VocabMcqQuestion,
  GrammarMcqQuestion,
} from "@/types";

// Module-level helpers for deterministic shuffle so hook deps stay stable
function hashString(s: string) {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: number) {
  // xorshift32
  let x = seed || 123456789;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    // convert to [0,1)
    return ((x >>> 0) % 1_000_000) / 1_000_000;
  };
}
function shuffleWithSeed<T>(arr: T[], seedStr: string) {
  const out = [...arr];
  const r = rng(hashString(seedStr));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface Props {
  q: AnyQuizQuestion;
  index: number;
  total: number;
  userAnswer: unknown;
  submitted: boolean;
  resultDetail?: { correct: boolean; explanation: string } | undefined;
  onAnswer: (value: number | string | string[]) => void;
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
  const answered = isMcq
    ? typeof userAnswer === "number"
    : Array.isArray(userAnswer)
    ? (userAnswer as string[]).length > 0
    : typeof userAnswer === "string" && (userAnswer as string).trim() !== "";

  // Animation: fly a temporary chip from source to the selected area
  const selectedBoxRef = React.useRef<HTMLDivElement | null>(null);
  const suggestionsBoxRef = React.useRef<HTMLDivElement | null>(null);

  // Prepare sentence-order memoized shuffle at top-level to satisfy hooks rules
  const sentenceQTop =
    q.type === "sentence-order" ? (q as SentenceOrderQuestion) : null;
  const shuffledTop = React.useMemo(() => {
    if (!sentenceQTop) return null as string[] | null;
    return shuffleWithSeed(sentenceQTop.tokens, `${sentenceQTop.id}-v1`);
  }, [sentenceQTop]);

  const flyToSelected = (sourceEl: HTMLElement, label: string) => {
    try {
      const from = sourceEl.getBoundingClientRect();
      const toContainer = selectedBoxRef.current;
      if (!toContainer) return;
      const to = toContainer.getBoundingClientRect();

      const ghost = document.createElement("div");
      ghost.textContent = label;
      const cs = getComputedStyle(sourceEl);
      ghost.style.position = "fixed";
      ghost.style.left = `${from.left}px`;
      ghost.style.top = `${from.top}px`;
      ghost.style.width = `${from.width}px`;
      ghost.style.height = `${from.height}px`;
      ghost.style.lineHeight = `${from.height}px`;
      ghost.style.borderRadius = cs.borderRadius || "16px";
      ghost.style.background = cs.backgroundColor || "#0284c7";
      ghost.style.color = cs.color || "#fff";
      ghost.style.padding = "0 10px";
      ghost.style.boxShadow = "0 6px 18px rgba(0,0,0,0.18)";
      ghost.style.font = cs.font || "500 14px/1.4 system-ui, sans-serif";
      ghost.style.zIndex = "9999";
      ghost.style.pointerEvents = "none";
      ghost.style.display = "inline-flex";
      ghost.style.alignItems = "center";
      ghost.style.justifyContent = "center";
      document.body.appendChild(ghost);

      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);

      const anim = ghost.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.9)`, opacity: 0.2 },
        ],
        { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" }
      );
      anim.addEventListener("finish", () => {
        ghost.remove();
        // Pop effect on the newly added chip
        const container = selectedBoxRef.current;
        if (container) {
          const chips = container.querySelectorAll("[data-chip-index]");
          const target = chips[chips.length - 1] as HTMLElement | undefined;
          if (target) {
            target.animate(
              [
                { transform: "scale(0.95)", offset: 0 },
                { transform: "scale(1.02)", offset: 0.6 },
                { transform: "scale(1)", offset: 1 },
              ],
              { duration: 220, easing: "ease-out" }
            );
          }
        }
      });
    } catch {
      // no-op on animation failure
    }
  };

  // Generic fly animation between two arbitrary elements (used for Undo)
  const flyBetween = (
    fromEl: HTMLElement,
    toEl: HTMLElement,
    label: string,
    duration = 320
  ) => {
    try {
      const from = fromEl.getBoundingClientRect();
      const to = toEl.getBoundingClientRect();
      const ghost = document.createElement("div");
      ghost.textContent = label;
      const cs = getComputedStyle(fromEl);
      ghost.style.position = "fixed";
      ghost.style.left = `${from.left}px`;
      ghost.style.top = `${from.top}px`;
      ghost.style.width = `${from.width}px`;
      ghost.style.height = `${from.height}px`;
      ghost.style.lineHeight = `${from.height}px`;
      ghost.style.borderRadius = cs.borderRadius || "16px";
      ghost.style.background = cs.backgroundColor || "#0284c7";
      ghost.style.color = cs.color || "#fff";
      ghost.style.padding = "0 10px";
      ghost.style.boxShadow = "0 6px 18px rgba(0,0,0,0.18)";
      ghost.style.font = cs.font || "500 14px/1.4 system-ui, sans-serif";
      ghost.style.zIndex = "9999";
      ghost.style.pointerEvents = "none";
      ghost.style.display = "inline-flex";
      ghost.style.alignItems = "center";
      ghost.style.justifyContent = "center";
      document.body.appendChild(ghost);

      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      const anim = ghost.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.9)`, opacity: 0.2 },
        ],
        { duration, easing: "cubic-bezier(.2,.8,.2,1)" }
      );
      anim.addEventListener("finish", () => ghost.remove());
    } catch {}
  };

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
          (() => {
            const shuffled = (shuffledTop || []) as string[];

            // Current selected tokens from userAnswer
            const selectedTokens: string[] = Array.isArray(userAnswer)
              ? (userAnswer as string[])
              : typeof userAnswer === "string" && (userAnswer as string).trim()
              ? (userAnswer as string).trim().split(/\s+/)
              : [];

            // Map selected tokens to their indices in the shuffled array
            const selectedIdxs: number[] = [];
            const used = new Array(shuffled.length).fill(false);
            for (const tok of selectedTokens) {
              const idx = shuffled.findIndex((t, i) => !used[i] && t === tok);
              if (idx >= 0) {
                selectedIdxs.push(idx);
                used[idx] = true;
              }
            }

            const onPick = (i: number) => {
              if (submitted) return;
              const next = [...selectedTokens, shuffled[i]];
              onAnswer(next);
            };

            const onRemove = (i: number) => {
              if (submitted) return;
              const token = selectedTokens[i];
              const fromChip = selectedBoxRef.current?.querySelector(
                `[data-chip-index="${i}"]`
              ) as HTMLElement | null;
              const suggestIndex = selectedIdxs[i];
              const toSuggest =
                typeof suggestIndex === "number"
                  ? (suggestionsBoxRef.current?.querySelector(
                      `[data-suggest-index="${suggestIndex}"]`
                    ) as HTMLElement | null)
                  : null;
              if (fromChip && toSuggest) {
                flyBetween(fromChip, toSuggest, token, 260);
              }
              const next = selectedTokens.slice();
              next.splice(i, 1);
              onAnswer(next);
            };

            const onUndo = () => {
              if (submitted || selectedTokens.length === 0) return;
              onRemove(selectedTokens.length - 1);
            };

            const onClear = () => {
              if (submitted || selectedTokens.length === 0) return;
              onAnswer([]);
            };

            return (
              <Box sx={{ mt: { xs: 1.25, sm: 1.5 } }}>
                {/* Available shuffled tokens (on top) */}
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.75,
                    mb: 1.25,
                  }}
                  ref={suggestionsBoxRef}
                >
                  {shuffled.map((t, i) => {
                    const picked = selectedIdxs.includes(i);
                    return (
                      <Chip
                        key={`${t}-${i}`}
                        label={t}
                        data-suggest-index={i}
                        variant={picked ? "outlined" : "filled"}
                        color={picked ? "default" : "info"}
                        onClick={
                          !submitted && !picked
                            ? (ev) => {
                                const el = ev.currentTarget as HTMLElement;
                                flyToSelected(el, t);
                                onPick(i);
                              }
                            : undefined
                        }
                        disabled={submitted}
                        sx={{
                          cursor: picked || submitted ? "default" : "pointer",
                          opacity: picked ? 0.45 : 1,
                          pointerEvents: picked ? "none" : undefined,
                        }}
                      />
                    );
                  })}
                </Box>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Câu của bạn
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ sm: "stretch" }}
                >
                  {/* Selected (built) sentence as the input (below) */}
                  <Box
                    sx={{
                      p: { xs: 1, sm: 1.25 },
                      borderRadius: 2,
                      border: "2px dashed",
                      borderColor: selectedTokens.length
                        ? "primary.main"
                        : "divider",
                      bgcolor: (th) =>
                        selectedTokens.length
                          ? alpha(th.palette.primary.light, 0.12)
                          : th.palette.background.default,
                      minHeight: { xs: 52, sm: 60 },
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 0.5,
                      flexGrow: 1,
                      boxShadow: (th) =>
                        selectedTokens.length
                          ? `inset 0 0 0 1px ${alpha(
                              th.palette.primary.main,
                              0.15
                            )}`
                          : "none",
                    }}
                    ref={selectedBoxRef}
                    role="listbox"
                    aria-label="Câu đã sắp xếp"
                  >
                    {selectedTokens.length ? (
                      selectedTokens.map((t, i) => (
                        <Chip
                          key={`${t}-${i}`}
                          label={t}
                          data-chip-index={i}
                          onDelete={!submitted ? () => onRemove(i) : undefined}
                          variant="filled"
                          color="primary"
                          size="small"
                          role="option"
                          aria-selected
                        />
                      ))
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ pl: 0.5 }}
                      >
                        Chọn thẻ ở trên theo thứ tự để ghép câu
                      </Typography>
                    )}
                  </Box>

                  {/* Action buttons (responsive position) */}
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent={{ xs: "flex-end", sm: "center" }}
                    alignItems="center"
                  >
                    <Button
                      size="small"
                      startIcon={<UndoIcon />}
                      onClick={onUndo}
                      disabled={submitted || selectedTokens.length === 0}
                    >
                      Hoàn tác
                    </Button>
                    <Button
                      size="small"
                      color="warning"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={onClear}
                      disabled={submitted || selectedTokens.length === 0}
                    >
                      Xóa hết
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            );
          })()
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
