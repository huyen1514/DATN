import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/geist-latin-wght-normal.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin-wght-normal.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

const notoSerif = localFont({
  src: "./fonts/noto-serif-vietnamese-wght-normal.woff2",
  variable: "--font-noto-serif-jp",
  weight: "100 900",
  display: "swap",
});

const notoSerifJP = localFont({
  src: "./fonts/noto-serif-jp-japanese-wght-normal.woff2",
  variable: "--font-noto-serif-japanese",
  weight: "200 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "J-Learning | Khám phá Tiếng Nhật",
  description: "Trang web học tiếng Nhật với triết lý Kaizen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} ${notoSerifJP.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
