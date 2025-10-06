"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  Stack,
  Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
// no breakpoint-specific UI; same layout for all sizes

type Verb = { base: string; past: string; pp: string; meaning?: string };

export default function IrregularVerbsPage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<Verb[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showMeaning] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/mock/irregular-verbs.json")
      .then((r) => r.json())
      .then((json) => {
        if (mounted) setData(Array.isArray(json) ? json : []);
      })
      .catch(() => mounted && setError("Không tải được dữ liệu."));
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const source = data;
    if (!needle) return source;
    return source.filter((v) =>
      [v.base, v.past, v.pp, v.meaning || ""].some((s) =>
        s.toLowerCase().includes(needle)
      )
    );
  }, [q, data]);

  // Helpers
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const highlight = (text: string): React.ReactNode => {
    const query = q.trim();
    if (!query) return text;
    try {
      const re = new RegExp(`(${escapeRegExp(query)})`, "ig");
      const parts = text.split(re);
      return (
        <>
          {parts.map((part, i) =>
            i % 2 === 1 ? (
              <Box
                key={i}
                component="mark"
                sx={{ px: 0.25, py: 0, bgcolor: "warning.light" }}
              >
                {part}
              </Box>
            ) : (
              <React.Fragment key={i}>{part}</React.Fragment>
            )
          )}
        </>
      );
    } catch {
      return text;
    }
  };
  const splitVariants = (s: string) =>
    s
      .split("/")
      .map((x) => x.trim())
      .filter(Boolean);

  const renderForms = (forms: string, color?: string) => {
    const arr = splitVariants(forms);
    return arr.map((form, i) => (
      <React.Fragment key={i}>
        <Box
          component="span"
          sx={{
            fontWeight: 800,
            fontSize: { xs: 20, sm: 22 },
            lineHeight: 1.2,
            color,
          }}
        >
          {highlight(form)}
        </Box>
        {i < arr.length - 1 && (
          <Box component="span" sx={{ mx: 0.5, opacity: 0.6 }}>
            /
          </Box>
        )}
      </React.Fragment>
    ));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bảng động từ bất quy tắc
      </Typography>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <TextField
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo từ gốc / quá khứ / quá khứ phân từ / nghĩa"
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Typography
            variant="caption"
            sx={{ mt: 1, display: "block", color: "text.secondary" }}
          >
            Kết quả: {filtered.length.toLocaleString("vi-VN")}
          </Typography>
          {/* Legend for V1/V2/V3 */}
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
            <Chip size="small" variant="outlined" label="V1 = Base form" />
            <Chip
              size="small"
              variant="outlined"
              color="primary"
              label="V2 = Past simple"
            />
            <Chip
              size="small"
              variant="outlined"
              color="secondary"
              label="V3 = Past participle"
            />
          </Stack>
        </CardContent>
      </Card>
      <Box>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {filtered.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{ p: 4, textAlign: "center", color: "text.secondary" }}
          >
            Không tìm thấy kết quả.
          </Paper>
        ) : (
          <Stack spacing={1.25}>
            {filtered.map((v) => (
              <Card key={`${v.base}-${v.past}-${v.pp}`} variant="outlined">
                <CardContent sx={{ py: 1.25 }}>
                  {/* V1 */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1,
                      borderLeft: "4px solid",
                      borderLeftColor: "text.disabled",
                      pl: 1.25,
                      py: 0.5,
                    }}
                  >
                    <Chip size="small" label="V1" />
                    <Box>{renderForms(v.base)}</Box>
                  </Box>

                  {/* V2/V3 side by side on desktop, stacked on mobile */}
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} md={6}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 1,
                          borderLeft: "4px solid",
                          borderLeftColor: "primary.main",
                          pl: 1.25,
                          py: 0.5,
                        }}
                      >
                        <Chip size="small" color="primary" label="V2" />
                        <Box>{renderForms(v.past, "primary.main")}</Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 1,
                          borderLeft: "4px solid",
                          borderLeftColor: "secondary.main",
                          pl: 1.25,
                          py: 0.5,
                        }}
                      >
                        <Chip size="small" color="secondary" label="V3" />
                        <Box>{renderForms(v.pp, "secondary.main")}</Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {showMeaning && v.meaning && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 1, color: "text.secondary" }}
                    >
                      Nghĩa: {highlight(v.meaning)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
