"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  Divider,
  Paper,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

type TopicBox = {
  id: string;
  title: string; // tiêu đề hộp
  problem: string; // vấn đề hay sai
  quickRule: string; // quy tắc vàng
  examples: { wrong: string; right: string }[]; // tối thiểu 1 cặp ví dụ
  takeaway: string; // ghi nhớ nhanh
};

// Dữ liệu 5 Hộp Chủ Đề theo yêu cầu
const TOPICS: TopicBox[] = [
  {
    id: "sv-agreement-hidden-subject",
    title: "🚨 Cảnh Báo S-V: Chủ Ngữ Bị Che Giấu",
    problem:
      "Người học hay chia động từ theo danh từ đứng gần nhất, quên mất chủ ngữ thật sự (ví dụ: one of the books is...).",
    quickRule:
      "Động từ chia theo CHỦ NGỮ THẬT, không theo danh từ gần nhất. After 'one of + plural noun' → động từ ở SỐ ÍT cho 'one'.",
    examples: [
      {
        wrong: "❌ One of the books are missing.",
        right: "✅ One of the books is missing.",
      },
      {
        wrong: "❌ The price of these shoes are too high.",
        right: "✅ The price of these shoes is too high.",
      },
      {
        wrong: "❌ A list of items were provided.",
        right: "✅ A list of items was provided.",
      },
    ],
    takeaway:
      "Nhìn TỪ TRƯỚC DẤU 'of' để xác định chủ ngữ chính. 'One', 'price', 'list' → số ít → dùng is/was/verbs-s.",
  },
  {
    id: "adjective-position-exceptions",
    title: "💡 Vị Trí Của Tính Từ: Ngoại Lệ Cần Nhớ",
    problem:
      "Lẫn lộn vị trí tính từ với các từ kết thúc bằng -body, -one, -thing (someone, anyone, something...).",
    quickRule:
      "Với -body/-one/-thing: tính từ đứng SAU, không đứng trước. Ví dụ: 'something new' (không phải 'new something').",
    examples: [
      {
        wrong: "❌ I want a new something.",
        right: "✅ I want something new.",
      },
      {
        wrong: "❌ Did you meet an interesting someone?",
        right: "✅ Did you meet someone interesting?",
      },
      {
        wrong: "❌ She needs any helpful thing.",
        right: "✅ She needs anything helpful.",
      },
    ],
    takeaway:
      "-body/-one/-thing → TÍNH TỪ ĐỨNG SAU: someone nice, something important, nothing new.",
  },
  {
    id: "zero-article-when-no-the",
    title: "❌ Zero Article: Khi nào BỎ 'THE'?",
    problem:
      "Lạm dụng 'the' trước bữa ăn, môn học, ngôn ngữ, và các cụm cố định (go to bed/work/school/hospital).",
    quickRule:
      "KHÔNG dùng 'the' trước: bữa ăn (breakfast, lunch), môn học (math, history), ngôn ngữ (English), và cụm đi ngủ/đi làm (go to bed/work).",
    examples: [
      { wrong: "❌ I had the breakfast.", right: "✅ I had breakfast." },
      {
        wrong: "❌ She studies the English.",
        right: "✅ She studies English.",
      },
      {
        wrong: "❌ He goes to the work at 8.",
        right: "✅ He goes to work at 8.",
      },
      { wrong: "❌ I'm going to the bed.", right: "✅ I'm going to bed." },
    ],
    takeaway:
      "Bữa ăn, môn học, ngôn ngữ, và 'go to bed/work/school/hospital' → KHÔNG có 'the' (trừ khi xác định cụ thể).",
  },
  {
    id: "time-prep-on-in-at",
    title: "⏱️ ON, IN, AT: Mẹo Nhớ Tam Giác",
    problem:
      "Nhầm lẫn 'at' cho thời điểm cụ thể, 'on' cho NGÀY, và 'in' cho THÁNG/NĂM; quên ngoại lệ Giáng Sinh.",
    quickRule:
      "AT + giờ/điểm cụ thể; ON + ngày/thứ; IN + tháng/năm/mùa. Ngoại lệ: at Christmas (mùa lễ), on Christmas Day (ngày 25/12).",
    examples: [
      { wrong: "❌ See you in 7 pm.", right: "✅ See you at 7 pm." },
      {
        wrong: "❌ My birthday is in Monday.",
        right: "✅ My birthday is on Monday.",
      },
      { wrong: "❌ The event is on July.", right: "✅ The event is in July." },
      {
        wrong: "❌ We visit our grandparents on Christmas.",
        right: "✅ We visit our grandparents at Christmas.",
      },
      {
        wrong: "❌ They have a big dinner at Christmas Day.",
        right: "✅ They have a big dinner on Christmas Day.",
      },
    ],
    takeaway:
      "Tam giác nhớ nhanh: AT (điểm) → ON (ngày) → IN (khoảng lớn). Giáng Sinh: 'at Christmas' nhưng 'on Christmas Day'.",
  },
  {
    id: "gerund-vs-infinitive-meaning",
    title: "💡 Đừng Rối: TO V hay V-ING Sau Động Từ?",
    problem:
      "Một số động từ thay đổi nghĩa khi đi với to V hoặc V-ing (như remember, stop, try, forget, regret).",
    quickRule:
      "Nhớ nhóm nghĩa: remember/forget/regret + V-ing (quá khứ đã làm); remember/forget/regret + to V (việc cần/định làm). stop + V-ing (dừng hẳn), stop + to V (dừng lại để làm). try + V-ing (thử nghiệm), try + to V (cố gắng).",
    examples: [
      {
        wrong: "❌ I stopped to smoke because it was unhealthy.",
        right: "✅ I stopped smoking because it was unhealthy.",
      },
      {
        wrong: "❌ Remember doing your homework tonight.",
        right: "✅ Remember to do your homework tonight.",
      },
      {
        wrong: "❌ He tried to take some aspirin to see if it helps.",
        right: "✅ He tried taking some aspirin to see if it helps.",
      },
      {
        wrong: "❌ I regret to tell you I lost your book yesterday.",
        right: "✅ I regret telling you I lost your book yesterday.",
      },
    ],
    takeaway:
      "Công thức nhớ nhanh: remember/forget/regret + V-ing = chuyện ĐÃ LÀM; + to V = việc CẦN/ĐỊNH LÀM. stop + V-ing = dừng hẳn; + to V = dừng để làm. try + V-ing = thử; + to V = cố gắng.",
  },
];

function toCSV(topics: TopicBox[]) {
  // Xuất theo cột: Title | Problem | Quick Rule | Wrong | Right | Takeaway
  const header = [
    "Title",
    "Problem",
    "Quick Rule",
    "Wrong Example",
    "Right Example",
    "Takeaway",
  ];
  const rows: string[][] = [];
  topics.forEach((t) => {
    t.examples.forEach((ex, idx) => {
      rows.push([
        t.title,
        idx === 0 ? t.problem : "",
        idx === 0 ? t.quickRule : "",
        ex.wrong.replace(/^❌\s*/g, ""),
        ex.right.replace(/^✅\s*/g, ""),
        idx === t.examples.length - 1 ? t.takeaway : "",
      ]);
    });
  });

  const escape = (v: string) => {
    const needsQuote = /[",\n]/.test(v);
    const s = v.replace(/"/g, '""');
    return needsQuote ? `"${s}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  return csv;
}

export default function GrammarNotesPage() {
  const csv = useMemo(() => toCSV(TOPICS), []);
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [tocOpen, setTocOpen] = useState<boolean>(true);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [activeIdx, setActiveIdx] = useState<number>(0);

  useEffect(() => {
    // Auto-collapse TOC on mobile, expand on desktop
    setTocOpen(!smDown);
  }, [smDown]);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  };

  const downloadCSV = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grammar-notes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCSV = async () => {
    try {
      await navigator.clipboard.writeText(csv);
      alert("Đã copy CSV. Dán vào Google Sheets/Excel.");
    } catch (e) {
      console.error(e);
      alert("Không thể copy. Hãy dùng nút Tải CSV.");
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: { xs: 1.5, sm: 2 }, gap: { xs: 1.25, sm: 0 } }}
      >
        <Typography
          fontWeight={800}
          sx={{
            fontSize: { xs: 20, sm: 28 },
            lineHeight: { xs: 1.25, sm: 1.2 },
            letterSpacing: { xs: 0.1, sm: 0 },
          }}
        >
          NGỮ PHÁP CẤP TỐC: BỎ TÚI CÁC ĐIỂM LƯU Ý, MẸO VÀ NGOẠI LỆ
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            width: { xs: "100%", sm: "auto" },
            alignItems: { xs: "stretch", sm: "center" },
          }}
        >
          <Button variant="outlined" onClick={copyCSV} fullWidth>
            Sao chép CSV
          </Button>
          <Button variant="contained" onClick={downloadCSV} fullWidth>
            Tải CSV
          </Button>
          <FormControlLabel
            sx={{ ml: { xs: 0, sm: 1 }, mr: 0, mt: { xs: 0.5, sm: 0 } }}
            control={
              <Switch
                checked={focusMode}
                onChange={(e) => setFocusMode(e.target.checked)}
              />
            }
            label="Focus"
          />
        </Stack>
      </Stack>
      <Typography
        color="text.secondary"
        sx={{
          mb: { xs: 2, sm: 3 },
          fontSize: { xs: 14.5, sm: 16 },
          lineHeight: { xs: 1.7, sm: 1.6 },
        }}
      >
        Trang này dành cho người học B1–B2 muốn tăng độ chính xác khi nói/viết.
        Tập trung lỗi kinh điển, công thức nhanh, ví dụ sai–đúng, và câu chốt dễ
        nhớ.
      </Typography>

      {/* Table of Contents */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1, sm: 1.5 },
          mb: { xs: 1.5, sm: 2 },
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <ListAltIcon color="primary" />
            <Typography fontWeight={800} sx={{ fontSize: { xs: 15, sm: 16 } }}>
              Mục lục
            </Typography>
          </Stack>
          <IconButton
            size="small"
            onClick={() => setTocOpen((v) => !v)}
            aria-label="Toggle mục lục"
          >
            {tocOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>
        <Collapse in={tocOpen} timeout="auto" unmountOnExit>
          <List dense>
            {TOPICS.map((t, i) => (
              <ListItemButton
                key={t.id}
                selected={focusMode && i === activeIdx}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveIdx(i);
                  if (focusMode) {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    scrollToId(t.id);
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Chip size="small" label={i + 1} color="default" />
                </ListItemIcon>
                <ListItemText
                  primary={t.title}
                  primaryTypographyProps={{
                    fontSize: { xs: 13.5, sm: 14.5 },
                    fontWeight: focusMode && i === activeIdx ? 700 : 500,
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      </Paper>

      {/* Content area: Focus mode or All */}
      {focusMode ? (
        <Stack spacing={1.25}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 0.5 }}
          >
            <Button
              startIcon={<ArrowBackIosNewIcon fontSize="small" />}
              size="small"
              variant="outlined"
              disabled={activeIdx === 0}
              onClick={() => {
                setActiveIdx((i) => Math.max(0, i - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Trước
            </Button>
            <Typography sx={{ fontSize: 13.5 }}>
              Topic {activeIdx + 1} / {TOPICS.length}
            </Typography>
            <Button
              endIcon={<ArrowForwardIosIcon fontSize="small" />}
              size="small"
              variant="contained"
              disabled={activeIdx === TOPICS.length - 1}
              onClick={() => {
                setActiveIdx((i) => Math.min(TOPICS.length - 1, i + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Tiếp
            </Button>
          </Stack>

          {(() => {
            const t = TOPICS[activeIdx];
            return (
              <Paper
                key={t.id}
                id={t.id}
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 2.25 },
                  borderRadius: 2,
                  border: 1,
                  borderColor: "divider",
                  boxShadow: {
                    xs: "0 2px 8px rgba(0,0,0,.05)",
                    sm: "0 6px 20px rgba(0,0,0,.06)",
                  },
                  bgcolor: "background.paper",
                  scrollMarginTop: { xs: 8, sm: 12 },
                }}
              >
                <Stack spacing={{ xs: 1, sm: 1.25 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ flexWrap: "wrap" }}
                  >
                    <Chip
                      label={`Topic ${activeIdx + 1}`}
                      color="primary"
                      size="small"
                    />
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      sx={{ fontSize: { xs: 16, sm: 18 } }}
                    >
                      {t.title}
                    </Typography>
                  </Stack>

                  <Box>
                    <Typography
                      fontWeight={700}
                      sx={{ mb: 0.5, fontSize: { xs: 14, sm: 15 } }}
                    >
                      Vấn đề (Problem)
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: 14.5, sm: 15.5 },
                        lineHeight: { xs: 1.7, sm: 1.65 },
                      }}
                    >
                      {t.problem}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      fontWeight={700}
                      sx={{ mb: 0.5, fontSize: { xs: 14, sm: 15 } }}
                    >
                      Quy tắc Vàng (Quick Rule)
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: 14.5, sm: 15.5 },
                        lineHeight: { xs: 1.7, sm: 1.65 },
                      }}
                    >
                      {t.quickRule}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      fontWeight={700}
                      sx={{ mb: 1, fontSize: { xs: 14, sm: 15 } }}
                    >
                      Ví dụ (Show, Don&apos;t Tell)
                    </Typography>
                    <Stack spacing={{ xs: 0.75, sm: 0.75 }}>
                      {t.examples.map((ex, i) => (
                        <Box
                          key={i}
                          sx={{
                            bgcolor: "action.hover",
                            borderRadius: 1.5,
                            p: { xs: 1, sm: 1 },
                            borderLeft: "4px solid #dc3545",
                          }}
                        >
                          <Typography
                            sx={{
                              color: "#dc3545",
                              fontWeight: 700,
                              fontSize: { xs: 14.5, sm: 15 },
                            }}
                          >
                            {ex.wrong}
                          </Typography>
                          <Typography
                            sx={{
                              color: "#28a745",
                              fontWeight: 800,
                              mt: 0.25,
                              fontSize: { xs: 14.5, sm: 15 },
                            }}
                          >
                            {ex.right}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  <Divider sx={{ my: { xs: 1, sm: 1.25 } }} />
                  <Box>
                    <Typography
                      fontWeight={800}
                      sx={{
                        fontSize: { xs: 14.5, sm: 16 },
                        lineHeight: { xs: 1.6, sm: 1.55 },
                      }}
                    >
                      Ghi nhớ Nhanh (Takeaway):{" "}
                      <Box component="span" sx={{ color: "primary.main" }}>
                        {t.takeaway}
                      </Box>
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            );
          })()}
        </Stack>
      ) : (
        <Stack spacing={2}>
          {TOPICS.map((t, idx) => (
            <Paper
              key={t.id}
              id={t.id}
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2.25 },
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                boxShadow: {
                  xs: "0 2px 8px rgba(0,0,0,.05)",
                  sm: "0 6px 20px rgba(0,0,0,.06)",
                },
                bgcolor: "background.paper",
                scrollMarginTop: { xs: 8, sm: 12 },
              }}
            >
              <Stack spacing={{ xs: 1, sm: 1.25 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ flexWrap: "wrap" }}
                >
                  <Chip
                    label={`Topic ${idx + 1}`}
                    color="primary"
                    size="small"
                  />
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{ fontSize: { xs: 16, sm: 18 } }}
                  >
                    {t.title}
                  </Typography>
                </Stack>

                <Box>
                  <Typography
                    fontWeight={700}
                    sx={{ mb: 0.5, fontSize: { xs: 14, sm: 15 } }}
                  >
                    Vấn đề (Problem)
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: 14.5, sm: 15.5 },
                      lineHeight: { xs: 1.7, sm: 1.65 },
                    }}
                  >
                    {t.problem}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    fontWeight={700}
                    sx={{ mb: 0.5, fontSize: { xs: 14, sm: 15 } }}
                  >
                    Quy tắc Vàng (Quick Rule)
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: 14.5, sm: 15.5 },
                      lineHeight: { xs: 1.7, sm: 1.65 },
                    }}
                  >
                    {t.quickRule}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    fontWeight={700}
                    sx={{ mb: 1, fontSize: { xs: 14, sm: 15 } }}
                  >
                    Ví dụ (Show, Don&apos;t Tell)
                  </Typography>
                  <Stack spacing={{ xs: 0.75, sm: 0.75 }}>
                    {t.examples.map((ex, i) => (
                      <Box
                        key={i}
                        sx={{
                          bgcolor: "action.hover",
                          borderRadius: 1.5,
                          p: { xs: 1, sm: 1 },
                          borderLeft: "4px solid #dc3545",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#dc3545",
                            fontWeight: 700,
                            fontSize: { xs: 14.5, sm: 15 },
                          }}
                        >
                          {ex.wrong}
                        </Typography>
                        <Typography
                          sx={{
                            color: "#28a745",
                            fontWeight: 800,
                            mt: 0.25,
                            fontSize: { xs: 14.5, sm: 15 },
                          }}
                        >
                          {ex.right}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Divider sx={{ my: { xs: 1, sm: 1.25 } }} />
                <Box>
                  <Typography
                    fontWeight={800}
                    sx={{
                      fontSize: { xs: 14.5, sm: 16 },
                      lineHeight: { xs: 1.6, sm: 1.55 },
                    }}
                  >
                    Ghi nhớ Nhanh (Takeaway):{" "}
                    <Box component="span" sx={{ color: "primary.main" }}>
                      {t.takeaway}
                    </Box>
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
