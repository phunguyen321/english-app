"use client";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
} from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

export default function Home() {
  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 6 },
      }}
    >
      {/* Header */}
      <Typography
        variant="h3"
        gutterBottom
        sx={{ fontWeight: 700, color: "primary.main", textAlign: "center" }}
      >
        English Learner
      </Typography>
      <Typography
        color="text.secondary"
        sx={{
          mb: { xs: 3, sm: 5 },
          textAlign: "center",
          maxWidth: 720,
          mx: "auto",
        }}
      >
        Ứng dụng học tiếng Anh: Từ vựng, Ngữ pháp và Bài tập tương tác.
      </Typography>

      {/* Feature Cards */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        <Card
          sx={{
            flex: 1,
            height: "100%",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            transition: "transform .2s ease, box-shadow .2s ease",
            ":hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "12px",
                  bgcolor: "rgba(0,137,123,0.10)",
                  display: "grid",
                  placeItems: "center",
                  mr: 1.5,
                }}
              >
                <MenuBookRoundedIcon
                  sx={{ color: "primary.main", fontSize: 30 }}
                />
              </Box>
              <Typography variant="h6">Từ vựng</Typography>
            </Box>

            <Typography color="text.secondary">
              Học 3000+ từ vựng theo chủ đề và cấp độ, hỗ trợ flashcard và luyện
              nghe.
            </Typography>
            <Button
              LinkComponent={Link}
              href="/vocabulary"
              variant="contained"
              sx={{ mt: 2.5, textTransform: "uppercase" }}
            >
              BẮT ĐẦU
            </Button>
          </CardContent>
        </Card>

        <Card
          sx={{
            flex: 1,
            height: "100%",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            transition: "transform .2s ease, box-shadow .2s ease",
            ":hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "12px",
                  bgcolor: "rgba(0,137,123,0.10)",
                  display: "grid",
                  placeItems: "center",
                  mr: 1.5,
                }}
              >
                <SchoolRoundedIcon
                  sx={{ color: "primary.main", fontSize: 30 }}
                />
              </Box>
              <Typography variant="h6">Ngữ pháp</Typography>
            </Box>

            <Typography color="text.secondary">
              Tổng hợp các chủ điểm ngữ pháp quan trọng kèm ví dụ và mẹo ghi
              nhớ.
            </Typography>
            <Button
              LinkComponent={Link}
              href="/grammar"
              variant="contained"
              sx={{ mt: 2.5, textTransform: "uppercase" }}
            >
              HỌC NGAY
            </Button>
          </CardContent>
        </Card>

        <Card
          sx={{
            flex: 1,
            height: "100%",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            transition: "transform .2s ease, box-shadow .2s ease",
            ":hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "12px",
                  bgcolor: "rgba(0,137,123,0.10)",
                  display: "grid",
                  placeItems: "center",
                  mr: 1.5,
                }}
              >
                <EditRoundedIcon sx={{ color: "primary.main", fontSize: 30 }} />
              </Box>
              <Typography variant="h6">Bài tập</Typography>
            </Box>

            <Typography color="text.secondary">
              Luyện tập đa dạng: trắc nghiệm từ vựng, ngữ pháp, điền từ, viết
              câu.
            </Typography>
            <Button
              LinkComponent={Link}
              href="/quizzes"
              variant="contained"
              sx={{ mt: 2.5, textTransform: "uppercase" }}
            >
              LÀM BÀI
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
