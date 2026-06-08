import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CityRiskView",
  description: "避難施設の混雑状況をリアルタイムで可視化するダッシュボード",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CityRiskView",
  },
  keywords: ["避難施設", "避難場所", "避難所", "混雑状況", "リアルタイム", "ダッシュボード", "災害対策", "避難情報", "公共施設", "DMD", "地図", "可視化", "サステナビリティ", "都市リスク", "防災", "災害リスク", "避難計画", "災害対応", "災害管理", "災害情報", "災害教育", "災害訓練", "災害コミュニケーション", "DMD", "CRV", "CityRiskView", "crvmap", "避難所混雑", "避難所情報"],
  authors: [{ name: "Sudo Takumi", url: "https://s-taku0502.vercel.app" }],
  openGraph: {
    title: "CityRiskView",
    description: "避難施設の混雑状況をリアルタイムで可視化するダッシュボード",
    url: "https://crvmap.app",
    siteName: "CityRiskView",
    images: [
      {
        url: "https://crvmap.app/ogp.png",
        width: 1200,
        height: 630,
        alt: "CityRiskView - 避難施設の混雑状況をリアルタイムで可視化するダッシュボード",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
