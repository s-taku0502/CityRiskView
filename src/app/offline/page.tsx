'use client'

/**
 * /offline フォールバックページ
 * Service Worker が document リクエストに応答できない場合に表示される。
 * （next-pwa の fallbacks.document に設定）
 *
 * NOTE: App Router では layout.tsx の RootLayout 内にレンダリングされるため、
 * <html>/<head>/<body> タグは使用しない。
 */
export default function OfflinePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50 text-blue-900">
      <div className="bg-white rounded-2xl p-10 max-w-sm w-[90%] text-center shadow-lg shadow-blue-900/10">
        <div className="text-5xl mb-4">🌐</div>
        <span className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-semibold mb-6">
          CityRiskView
        </span>
        <h1 className="text-xl font-bold mb-2">オフラインです</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          インターネット接続がありません。<br />
          一度アプリを開いていた場合は、<br />
          キャッシュされた避難所データを表示できます。
        </p>
        <button
          onClick={() => { window.location.href = '/' }}
          className="bg-blue-700 hover:bg-blue-800 active:scale-95 text-white rounded-lg px-6 py-2.5 text-sm font-semibold transition-all"
        >
          マップを開く
        </button>
      </div>
    </div>
  )
}
