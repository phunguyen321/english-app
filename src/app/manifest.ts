import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "English Learner",
    short_name: "English",
    description: "Học tiếng Anh với Từ vựng, Ngữ pháp, Bài tập",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/english-learn.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      { src: "/english-learn.png", sizes: "192x192", type: "image/png" },
      { src: "/english-learn.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
