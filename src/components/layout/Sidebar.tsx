'use client'

/**
 * Sidebar.tsx
 * CRV の components/Sidebar.js を TypeScript に変換し、n-crv スキーマに対応。
 *
 * 変更点:
 * - JS → TS 変換
 * - event_date.json のハードコードを廃止
 *   → Supabase の event_codes テーブルから有効なイベントを動的に取得
 * - イベント期間中のみ表示するメニュー項目を動的制御
 * - /prefectures_selection → /map に変更（n-crv のルーティングに合わせる）
 * - 外部リンク（entry.crvmap.app）はそのまま維持
 */

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface MenuItem {
  href: string
  text: string | string[]
  small?: boolean
  external?: boolean
}

interface ActiveEvent {
  code: string
  name: string
  start_date: string | null
  end_date: string | null
}

const BASE_MENU_ITEMS: MenuItem[] = [
  { href: '/', text: 'ハザードマップ' },
  { href: '/offline', text: 'オフライン情報', small: true },
  {
    href: 'https://crv-volunteer.vercel.app',
    text: 'ボランティア向け情報',
    small: true,
    external: true,
  },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(BASE_MENU_ITEMS)
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null)

  useEffect(() => {
    const fetchActiveEvent = async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('event_codes')
        .select('code, name, start_date, end_date')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .limit(1)
        .maybeSingle()

      if (data) {
        setActiveEvent(data as ActiveEvent)
        // イベント期間中のみ表示するメニュー項目を先頭に追加
        setMenuItems([
          {
            href: '/only_events',
            text: 'システムに関するアンケート',
            small: true,
          },
          ...BASE_MENU_ITEMS,
        ])
      }
    }
    fetchActiveEvent()
  }, [])

  const toggleMenu = () => setIsOpen((prev) => !prev)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 p-2 bg-blue-700 text-white rounded-md
                   hover:bg-blue-800 transition-colors shadow-md"
        aria-label="メニューを開く"
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* スライドアウトメニュー */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white
                    transform transition-transform duration-300 ease-out z-40 overflow-y-auto
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col p-5">
          {/* ロゴ */}
          <div className="mt-4 mb-6">
            <h1 className="text-xl font-bold text-white">CityRiskView</h1>
            <p className="text-xs text-gray-400 mt-0.5">n-crv</p>
          </div>

          {/* イベント中バッジ */}
          {activeEvent && (
            <div className="mb-4 px-3 py-2 bg-blue-800 rounded-lg border border-blue-600">
              <p className="text-xs text-blue-300 font-medium">イベント開催中</p>
              <p className="text-sm text-white font-semibold mt-0.5">{activeEvent.name}</p>
            </div>
          )}

          {/* ナビゲーション */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item, index) => {
              const textContent = Array.isArray(item.text) ? (
                <span>
                  <span className="block">{item.text[0]}</span>
                  <span className="block text-xs text-gray-400">{item.text[1]}</span>
                </span>
              ) : (
                item.text
              )

              const className = `px-3 py-2.5 rounded-lg hover:bg-gray-700 transition-colors
                ${item.small ? 'text-sm text-gray-300' : 'text-base text-white font-medium'}`

              if (item.external) {
                return (
                  <a
                    key={index}
                    href={item.href}
                    onClick={closeMenu}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {textContent}
                  </a>
                )
              }
              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={closeMenu}
                  className={className}
                >
                  {textContent}
                </Link>
              )
            })}
          </nav>

          {/* フッター */}
          <div className="mt-auto pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500 px-3 py-2">
              CityRiskView © 2025 s-lifecore
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
