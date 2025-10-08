import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import RootLayoutClient from "./RootLayoutClient";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "English Learner",
  description: "Học tiếng Anh với Từ vựng, Ngữ pháp, Bài tập",
  icons: [
    { rel: "icon", url: "/english-learn.svg" },
    { rel: "icon", url: "/english-learn.png", sizes: "192x192" },
    { rel: "icon", url: "/english-learn.png", sizes: "512x512" },
    // Use existing PNG for Apple touch icon
    { rel: "apple-touch-icon", url: "/english-learn.png" },
  ],
  themeColor: "#ffffff",
  // iOS PWA meta
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "English Learner",
  },
  // Avoid iOS auto-detect phone numbers
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${geistMono.variable}`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
