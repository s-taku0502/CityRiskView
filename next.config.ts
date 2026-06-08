import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // 開発環境では SW を無効化
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Next.js 16 は Turbopack がデフォルトだが、serwist は Webpack 設定を注入する。
  // 空の turbopack 設定を渡すことで "webpack config but no turbopack config" エラーを回避する。
  turbopack: {},
};

export default withSerwist(nextConfig);
