"use client";
import Link from "next/link";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";

export default function NavBar() {
  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
    >
      <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          English Learner
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button LinkComponent={Link} href="/" color="primary">
            Trang chủ
          </Button>
          <Button LinkComponent={Link} href="/vocabulary" color="primary">
            Từ vựng
          </Button>
          <Button LinkComponent={Link} href="/grammar" color="primary">
            Ngữ pháp
          </Button>
          <Button LinkComponent={Link} href="/quizzes" color="primary">
            Bài tập
          </Button>
          <Button LinkComponent={Link} href="/generate-quizzes" color="primary">
            Tạo bài tập AI
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
