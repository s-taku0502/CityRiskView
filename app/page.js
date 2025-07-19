'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            CityRiskView
          </h1>
          <p className="text-lg text-gray-600">
            都市リスク管理システム
          </p>
        </div>

        <div className="space-y-4">
          <Link 
            href="/admin"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors"
          >
            管理者ログイン
          </Link>
          
          <Link 
            href="/map"
            className="block w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors"
          >
            一般向けマップ
          </Link>
        </div>

        <div className="text-sm text-gray-500">
          <p>管理者: 備蓄管理・QRスキャン機能</p>
          <p>一般: マップ表示・避難所情報</p>
        </div>
      </div>
    </div>
  )
}