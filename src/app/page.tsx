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

export default function Home() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        English Learner
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Ứng dụng học tiếng Anh: Từ vựng, Ngữ pháp và Bài tập tương tác.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6">Từ vựng</Typography>
            <Typography color="text.secondary">
              Học 3000+ từ vựng theo chủ đề và cấp độ, hỗ trợ flashcard.
            </Typography>
            <Button
              LinkComponent={Link}
              href="/vocabulary"
              variant="contained"
              sx={{ mt: 2 }}
            >
              Bắt đầu
            </Button>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6">Ngữ pháp</Typography>
            <Typography color="text.secondary">
              Tổng hợp các thì và điểm ngữ pháp quan trọng kèm ví dụ.
            </Typography>
            <Button
              LinkComponent={Link}
              href="/grammar"
              variant="contained"
              sx={{ mt: 2 }}
            >
              Xem ngay
            </Button>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6">Bài tập</Typography>
            <Typography color="text.secondary">
              Luyện tập đa dạng: trắc nghiệm từ vựng, ngữ pháp, xếp câu.
            </Typography>
            <Button
              LinkComponent={Link}
              href="/quizzes"
              variant="contained"
              sx={{ mt: 2 }}
            >
              Làm bài
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
