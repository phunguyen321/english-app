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
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
// no breakpoint-specific UI; same layout for all sizes

type Verb = { base: string; past: string; pp: string; meaning?: string };

export default function IrregularVerbsPage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<Verb[]>([]);
  const [error, setError] = useState<string | null>(null);

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
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ flexWrap: "wrap" }}
                  >
                    <Chip size="small" label="V1 (Base)" />
                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{ flexWrap: "wrap" }}
                    >
                      {splitVariants(v.base).map((bv, i) => (
                        <Chip
                          key={i}
                          size="small"
                          variant="outlined"
                          label={highlight(bv)}
                        />
                      ))}
                    </Stack>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  {/* V2 */}
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ flexWrap: "wrap" }}
                  >
                    <Chip size="small" color="primary" label="V2 (Past)" />
                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{ flexWrap: "wrap" }}
                    >
                      {splitVariants(v.past).map((pv, i) => (
                        <Chip
                          key={i}
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={highlight(pv)}
                        />
                      ))}
                    </Stack>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  {/* V3 */}
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ flexWrap: "wrap" }}
                  >
                    <Chip size="small" color="secondary" label="V3 (PP)" />
                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{ flexWrap: "wrap" }}
                    >
                      {splitVariants(v.pp).map((ppv, i) => (
                        <Chip
                          key={i}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          label={highlight(ppv)}
                        />
                      ))}
                    </Stack>
                  </Stack>
                  {v.meaning && (
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
