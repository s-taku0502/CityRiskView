// サイドバー

"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="h-screen w-64 bg-gray-800 text-white flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-8">CityRiskView</h1>
      <nav className="flex flex-col gap-4">
        <Link href="/dashboard">ダッシュボード</Link>
        <Link href="/dashboard/map">地図</Link>
        <Link href="/dashboard/stock">備蓄情報</Link>
        <Link href="/dashboard/alert">アラート情報</Link>
        <Link href="/dashboard/evacuation">避難情報</Link>
        <Link href="/dashboard/update">更新情報</Link>
        {/* <Link href="/dashboard/settings">設定</Link> */}
      </nav>
    </div>
  );
}
