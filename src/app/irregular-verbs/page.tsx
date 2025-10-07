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
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
// Mobile-first UI styled to match example/verb.html

type Verb = { base: string; past: string; pp: string; meaning?: string };

export default function IrregularVerbsPage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<Verb[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showMeaning] = useState(true);

  // Color tokens to mirror the sample UI
  const colors = {
    v1: "#28a745",
    v2: "#ffc107",
    v3: "#dc3545",
    blue: "#007bff",
    textMuted: "#6c757d",
    cardBg: "#ffffff",
    pageBg: "#f7f7f7",
    divider: "#eee",
  } as const;

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
            fontWeight: 700,
            fontSize: { xs: 18, sm: 20 },
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
    <Box sx={{ bgcolor: colors.pageBg, mx: -2, px: 2, py: 1 }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          bgcolor: colors.cardBg,
          px: 0,
          pt: 2,
          pb: 1.5,
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <Typography
          component="h1"
          sx={{
            color: colors.blue,
            fontSize: 24,
            fontWeight: 700,
            mb: 1.5,
            textAlign: "center",
          }}
        >
          Bảng Động Từ Bất Quy Tắc
        </Typography>

        {/* Search input group */}
        <TextField
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm kiếm từ gốc / quá khứ..."
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: colors.textMuted }} fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
            },
          }}
        />

        {/* Tag group V1/V2/V3 */}
        <Stack
          direction="row"
          spacing={1}
          justifyContent="space-around"
          sx={{ mb: 0.5 }}
        >
          <Box
            component="span"
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              bgcolor: colors.v1,
              minWidth: 34,
              textAlign: "center",
            }}
          >
            V1
          </Box>
          <Box
            component="span"
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              color: "#333",
              bgcolor: colors.v2,
              minWidth: 34,
              textAlign: "center",
            }}
          >
            V2
          </Box>
          <Box
            component="span"
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              bgcolor: colors.v3,
              minWidth: 34,
              textAlign: "center",
            }}
          >
            V3
          </Box>
        </Stack>
        <Typography
          sx={{ color: colors.textMuted, fontSize: 14, textAlign: "center" }}
        >
          Kết quả: {filtered.length.toLocaleString("vi-VN")}
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ pt: 1 }}>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {filtered.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{ p: 4, textAlign: "center", color: colors.textMuted }}
          >
            Không tìm thấy kết quả.
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {filtered.map((v) => (
              <Card
                key={`${v.base}-${v.past}-${v.pp}`}
                sx={{
                  backgroundColor: colors.cardBg,
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  {/* V1 */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        mr: 1.5,
                        borderRadius: 0.75,
                        fontWeight: 700,
                        color: "#fff",
                        bgcolor: colors.v1,
                        minWidth: 35,
                        textAlign: "center",
                        fontSize: 13,
                      }}
                    >
                      V1
                    </Box>
                    <Box
                      className="verb-word"
                      sx={{ fontSize: 18, fontWeight: 600, color: "#333" }}
                    >
                      {renderForms(v.base)}
                    </Box>
                  </Box>

                  {/* V2 */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        mr: 1.5,
                        borderRadius: 0.75,
                        fontWeight: 700,
                        color: "#333",
                        bgcolor: colors.v2,
                        minWidth: 35,
                        textAlign: "center",
                        fontSize: 13,
                      }}
                    >
                      V2
                    </Box>
                    <Box sx={{ fontSize: 18, fontWeight: 600, color: "#555" }}>
                      {renderForms(v.past)}
                    </Box>
                  </Box>

                  {/* V3 */}
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        mr: 1.5,
                        borderRadius: 0.75,
                        fontWeight: 700,
                        color: "#fff",
                        bgcolor: colors.v3,
                        minWidth: 35,
                        textAlign: "center",
                        fontSize: 13,
                      }}
                    >
                      V3
                    </Box>
                    <Box sx={{ fontSize: 18, fontWeight: 600, color: "#555" }}>
                      {renderForms(v.pp)}
                    </Box>
                  </Box>

                  {showMeaning && v.meaning && (
                    <Box
                      sx={{
                        mt: 1.5,
                        pt: 1,
                        borderTop: `1px dashed ${colors.divider}`,
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 14, color: colors.textMuted }}
                      >
                        <Box
                          component="span"
                          sx={{ mr: 0.5, color: colors.blue }}
                        >
                          📚
                        </Box>
                        Nghĩa: {highlight(v.meaning)}
                      </Typography>
                    </Box>
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
