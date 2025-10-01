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
import { GrammarTopic } from "@/types";

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
        sx={{ mb: 2 }}
        variant="fullWidth"
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
                .map((g, i) => (
                  <Accordion
                    key={g.id}
                    disableGutters
                    sx={{
                      borderRadius: 2,
                      boxShadow: 1,
                      mb: 1,
                      bgcolor:
                        idx === 0
                          ? "#e3f2fd"
                          : idx === 1
                          ? "#f3e5f5"
                          : "#e8f5e9",
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" label={g.category} color="primary" />
                        <Typography variant="h6" fontWeight={700}>
                          {`${i + 1}. ${g.title}`}
                        </Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography
                        color="text.secondary"
                        sx={{ mb: 1, fontStyle: "italic" }}
                      >
                        {g.brief}
                      </Typography>
                      <Stack spacing={2}>
                        {g.points.map((p, idx2) => (
                          <Box
                            key={idx2}
                            sx={{
                              bgcolor: "#fff",
                              borderRadius: 1,
                              p: 2,
                              boxShadow: 0,
                              borderLeft: "4px solid #1976d2",
                              mb: 1,
                            }}
                          >
                            <Typography
                              fontWeight={600}
                              sx={{ color: "#1976d2", mb: 0.5 }}
                            >
                              {p.rule
                                .replace(/^Khẳng định:/i, "✅")
                                .replace(/^Phủ định:/i, "❌")
                                .replace(/^Nghi vấn:/i, "❓")}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Box
                                sx={{ color: "#43a047", fontSize: 20, mr: 1 }}
                              >
                                💡
                              </Box>
                              <Typography>
                                <b>Ví dụ:</b>{" "}
                                <span style={{ color: "#1565c0" }}>
                                  {p.example.en}
                                </span>{" "}
                                —{" "}
                                <span style={{ color: "#6d4c41" }}>
                                  {p.example.vi}
                                </span>
                              </Typography>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))
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
