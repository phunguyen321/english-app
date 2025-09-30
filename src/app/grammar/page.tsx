"use client";
import { useEffect } from "react";
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  Stack,
  LinearProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAppDispatch, useAppSelector, type RootState } from "@/store";
import { loadGrammar } from "@/store/slices/grammarSlice";
import { GrammarTopic } from "@/types";

export default function GrammarPage() {
  const dispatch = useAppDispatch();
  const { topics, status } = useAppSelector((s: RootState) => s.grammar);

  useEffect(() => {
    if (status === "idle") dispatch(loadGrammar());
  }, [status, dispatch]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ngữ pháp tiếng Anh
      </Typography>
      {status === "loading" && <LinearProgress />}
      <Stack spacing={1}>
        {topics.map((g: GrammarTopic) => (
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
      </Stack>
    </Box>
  );
}
