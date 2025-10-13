"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  Stack,
  LinearProgress,
  Tabs,
  Tab,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAppDispatch, useAppSelector, type RootState } from "@/store";
import { loadGrammar } from "@/store/slices/grammarSlice";
// Removed unused GrammarTopic type import to satisfy no-unused-vars lint rule

export default function GrammarPage() {
  const dispatch = useAppDispatch();
  const { topics, status } = useAppSelector((s: RootState) => s.grammar);

  // Phân loại 12 thì thành 3 nhóm
  const presentIds = [
    "present-simple",
    "present-continuous",
    "present-perfect",
    "present-perfect-continuous",
  ];
  const pastIds = [
    "past-simple",
    "past-continuous",
    "past-perfect",
    "past-perfect-continuous",
  ];
  const futureIds = [
    "future-simple",
    "future-continuous",
    "future-perfect",
    "future-perfect-continuous",
  ];
  const [tab, setTab] = useState(0);
  const tenses = [
    { label: "Hiện tại", ids: presentIds },
    { label: "Quá khứ", ids: pastIds },
    { label: "Tương lai", ids: futureIds },
  ];
  // English display names for the 12 tenses
  const englishById: Record<string, string> = {
    "present-simple": "Present Simple",
    "present-continuous": "Present Continuous",
    "present-perfect": "Present Perfect",
    "present-perfect-continuous": "Present Perfect Continuous",
    "past-simple": "Past Simple",
    "past-continuous": "Past Continuous",
    "past-perfect": "Past Perfect",
    "past-perfect-continuous": "Past Perfect Continuous",
    "future-simple": "Future Simple",
    "future-continuous": "Future Continuous",
    "future-perfect": "Future Perfect",
    "future-perfect-continuous": "Future Perfect Continuous",
  };
  // Lọc các topic là thì (tenses)
  const tenseTopics = topics.filter((t) =>
    [...presentIds, ...pastIds, ...futureIds].includes(t.id)
  );
  // Các chủ đề khác (nếu có)
  const otherTopics = topics.filter(
    (t) => ![...presentIds, ...pastIds, ...futureIds].includes(t.id)
  );

  useEffect(() => {
    if (status === "idle") dispatch(loadGrammar());
  }, [status, dispatch]);
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ngữ pháp tiếng Anh
      </Typography>
      {status === "loading" && <LinearProgress />}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{
          mb: 2,
          borderBottom: "2px solid #e0e0e0",
          "& .MuiTab-root": {
            textTransform: "uppercase",
            fontWeight: 700,
            color: "#666",
          },
          "& .MuiTab-root.Mui-selected": {
            color: "#00a87a",
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "#00a87a",
            height: 2,
          },
        }}
      >
        {tenses.map((g) => (
          <Tab key={g.label} label={g.label} />
        ))}
      </Tabs>
      <Stack spacing={2}>
        {tenses.map((group, idx) =>
          tab === idx
            ? tenseTopics
                .filter((t) => group.ids.includes(t.id))
                .map((g, i) => {
                  const pal =
                    idx === 0
                      ? { bg: "#ebf9f5", border: "#d0f0e8" } // Present: mint
                      : idx === 1
                      ? { bg: "#f3e5f5", border: "#e5cdee" } // Past: light purple
                      : { bg: "#e3f2fd", border: "#cfe5fb" }; // Future: light blue
                  return (
                    <Accordion
                      key={g.id}
                      disableGutters
                      square={false}
                      sx={{
                        borderRadius: 1.5,
                        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                        mb: 1.5,
                        bgcolor: pal.bg,
                        border: `1px solid ${pal.border}`,
                        overflow: "hidden",
                        "&:before": { display: "none" },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={
                          <ExpandMoreIcon
                            sx={{ fontSize: 18, color: "#666" }}
                          />
                        }
                        sx={{
                          px: 2.5,
                          py: 1.5,
                          "& .MuiAccordionSummary-content": { m: 0 },
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.5}
                          sx={{ width: "100%" }}
                        >
                          <Box
                            sx={{
                              bgcolor: "#00a87a",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 700,
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              textTransform: "uppercase",
                            }}
                          >
                            Tenses
                          </Box>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: "1rem",
                              flexGrow: 1,
                            }}
                          >
                            {`${i + 1}. ${g.title}`}
                          </Typography>
                          <Typography
                            sx={{
                              color: "#666",
                              fontSize: "0.9rem",
                              display: { xs: "none", sm: "inline" },
                            }}
                          >
                            {`(${englishById[g.id] ?? g.category ?? ""})`}
                          </Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails
                        sx={{
                          bgcolor: "#f7fcfb",
                          borderTop: "1px solid #e0f0eb",
                          px: 2.5,
                          py: 2,
                        }}
                      >
                        <Typography
                          color="text.secondary"
                          sx={{ mb: 1, fontStyle: "italic" }}
                        >
                          {g.brief}
                        </Typography>
                        <Stack spacing={2}>
                          {g.points.map((p, idx2) => {
                            const type:
                              | "positive"
                              | "negative"
                              | "question"
                              | "note" = /^Khẳng định:/i.test(p.rule)
                              ? "positive"
                              : /^Phủ định:/i.test(p.rule)
                              ? "negative"
                              : /^Nghi vấn:/i.test(p.rule)
                              ? "question"
                              : "note";

                            const palette = {
                              positive: {
                                border: "#28a745",
                                icon: "✅",
                                iconSize: 22,
                                iconColor: "#28a745",
                              },
                              negative: {
                                border: "#dc3545",
                                icon: "❌",
                                iconSize: 22,
                                iconColor: "#dc3545",
                              },
                              question: {
                                border: "#ffc107",
                                icon: "❓",
                                iconSize: 22,
                                iconColor: "#ffc107",
                              },
                              note: {
                                border: "#1a73e8",
                                icon: "📝",
                                iconSize: 18,
                                iconColor: "#1a73e8",
                              },
                            } as const;

                            const { border, icon, iconSize, iconColor } =
                              palette[type as keyof typeof palette];

                            const title = p.rule
                              .replace(
                                /^(Khẳng định|Phủ định|Nghi vấn):\s*/i,
                                ""
                              )
                              .trim();

                            const renderStyledTitle = (text: string) => {
                              if (type === "note") {
                                const [head, rest] = text.split(/:\s*/, 2);
                                const terms = (rest ?? "").split(/(,\s*)/);
                                return (
                                  <>
                                    <Box
                                      component="span"
                                      sx={{
                                        color: "#1a73e8",
                                        fontWeight: 600,
                                        mr: 0.5,
                                      }}
                                    >
                                      {head}
                                    </Box>
                                    {terms.map((t, i) => {
                                      const isSep = /,\s*/.test(t);
                                      return (
                                        <Box
                                          key={i}
                                          component="span"
                                          sx={{
                                            color: isSep
                                              ? undefined
                                              : "#dc3545",
                                            fontWeight: isSep ? undefined : 700,
                                          }}
                                        >
                                          {t}
                                        </Box>
                                      );
                                    })}
                                  </>
                                );
                              }

                              const parts = text
                                .split(/(\s+|\+|\(|\)|;|,|\?|:)/g)
                                .filter((p) => p !== "");
                              const isVerbToken = (s: string) =>
                                /^(V(?:\(s\/es\))?|V2\/ed|V3|V-?ing)$/i.test(s);
                              const isAux = (s: string) =>
                                /^(am|is|are|was|were|have|has|had|do|does|did|will|been|be)$/i.test(
                                  s
                                ) || /^(Do\/Does|Have\/Has)$/i.test(s);
                              const isSubject = (s: string) =>
                                /^S$/i.test(s) ||
                                /^(He\/She\/It|I\/You\/We\/They)$/i.test(s);
                              const isWhitespace = (s: string) =>
                                /^\s+$/.test(s);
                              const nextNonSpace = (i: number) => {
                                for (let j = i + 1; j < parts.length; j++) {
                                  if (!isWhitespace(parts[j])) return j;
                                }
                                return -1;
                              };
                              const prevNonSpace = (i: number) => {
                                for (let j = i - 1; j >= 0; j--) {
                                  if (!isWhitespace(parts[j])) return j;
                                }
                                return -1;
                              };
                              const parenIsForSEs = (
                                i: number,
                                raw: string
                              ) => {
                                if (raw !== "(" && raw !== ")") return false;
                                if (raw === "(") {
                                  const n1 = nextNonSpace(i);
                                  const n2 = n1 >= 0 ? nextNonSpace(n1) : -1;
                                  return (
                                    n1 >= 0 &&
                                    n2 >= 0 &&
                                    parts[n1].trim().toLowerCase() === "s/es" &&
                                    parts[n2].trim() === ")"
                                  );
                                } else {
                                  const p1 = prevNonSpace(i);
                                  const p2 = p1 >= 0 ? prevNonSpace(p1) : -1;
                                  return (
                                    p1 >= 0 &&
                                    p2 >= 0 &&
                                    parts[p1].trim().toLowerCase() === "s/es" &&
                                    parts[p2].trim() === "("
                                  );
                                }
                              };
                              return (
                                <>
                                  {parts.map((tk, idx) => {
                                    const raw = tk.trim();
                                    let color: string | undefined;
                                    let fontWeight: number | undefined;
                                    let fontSize: number | undefined;
                                    if (/^not$/i.test(raw)) {
                                      color = "#dc3545"; // red
                                      fontWeight = 700;
                                    } else if (isVerbToken(raw) || isAux(raw)) {
                                      color = "#1a73e8"; // blue
                                      fontWeight = 700;
                                    } else if (/^s\/es$/i.test(raw)) {
                                      // làm 's/es' nhỏ hơn chữ V để dễ nhìn
                                      color = "#1a73e8";
                                      fontWeight = 700;
                                      fontSize = 13;
                                    } else if (parenIsForSEs(idx, raw)) {
                                      // thu nhỏ cả dấu ngoặc của (s/es)
                                      color = "#1a73e8";
                                      fontWeight = 700;
                                      fontSize = 13;
                                    } else if (isSubject(raw)) {
                                      color = "#5f6368"; // gray
                                    }
                                    return (
                                      <Box
                                        key={idx}
                                        component="span"
                                        sx={{ color, fontWeight, fontSize }}
                                      >
                                        {tk}
                                      </Box>
                                    );
                                  })}
                                </>
                              );
                            };

                            return (
                              <Box
                                key={idx2}
                                sx={{
                                  position: "relative",
                                  bgcolor: "#ffffff",
                                  borderRadius: 2,
                                  p: 2.25, // ~18px
                                  mb: 1.5,
                                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
                                  borderLeft: `6px solid ${border}`,
                                  lineHeight: 1.5,
                                }}
                              >
                                {/* Icon góc phải */}
                                <Box
                                  sx={{
                                    position: "absolute",
                                    top: 12,
                                    right: 12,
                                    fontSize: iconSize,
                                    fontWeight: 700,
                                    color: iconColor,
                                  }}
                                >
                                  {icon}
                                </Box>

                                {/* Tiêu đề công thức */}
                                <Typography
                                  sx={{
                                    fontSize: 17,
                                    fontWeight: 600,
                                    color: "#333",
                                    pr: 5, // chừa chỗ cho icon
                                    mb: 1,
                                  }}
                                >
                                  {renderStyledTitle(title)}
                                </Typography>

                                {/* Ví dụ */}
                                <Box
                                  sx={{
                                    mt: 1.5,
                                    pt: 1,
                                    borderTop: "1px solid #eee",
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{ mb: 0.5 }}
                                  >
                                    <Box
                                      sx={{ color: "#ffc107", fontSize: 16 }}
                                    >
                                      💡
                                    </Box>
                                    <Typography
                                      sx={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: "#5f6368",
                                      }}
                                    >
                                      Ví dụ:
                                    </Typography>
                                  </Stack>
                                  <Typography
                                    sx={{
                                      fontSize: 14,
                                      color: "#444",
                                      mb: 0.5,
                                    }}
                                  >
                                    {p.example.en}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: "#666",
                                      fontStyle: "italic",
                                      fontSize: 14,
                                    }}
                                  >
                                    {p.example.vi}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          })}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  );
                })
            : null
        )}
        {/* Chủ đề khác ngoài 12 thì */}
        {tab === 0 && otherTopics.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mt: 3 }}>
              Chủ đề khác
            </Typography>
            {otherTopics.map((g) => (
              <Accordion key={g.id} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={g.category} />
                    <Typography variant="h6">{g.title}</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    {g.brief}
                  </Typography>
                  <Stack spacing={1}>
                    {g.points.map((p, idx: number) => (
                      <Box key={idx}>
                        <Typography>• {p.rule}</Typography>
                        <Typography color="text.secondary">
                          Ví dụ: {p.example.en} — {p.example.vi}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </>
        )}
      </Stack>
    </Box>
  );
}
