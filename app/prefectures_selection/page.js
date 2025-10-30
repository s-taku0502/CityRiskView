'use client';

import { separatedPrefectures } from '../../app/utils/prefectures';

export default function PrefecturesSelectionPage() {
  const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'cityriskview.vercel.app';

  const goToPrefecture = (pref) => {
    window.location.href = `https://cityriskview-${pref.prefName}.vercel.app`;
  };

  const goToNation = () => {
    window.location.href = `https://${MAIN_DOMAIN}`;
  };

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">都道府県を選択</h1>

        <div className="mb-4">
          <p className="text-gray-700">
            各都道府県の避難情報や災害情報を確認するには、以下から選択してください。
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={goToNation}
            className="w-full md:w-1/3 bg-indigo-600 text-white py-2 px-4 rounded-md shadow hover:bg-indigo-700 transition"
          >
            全国（サイトトップへ）
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {separatedPrefectures.map((p) => (
            <button
              key={p.code}
              onClick={() => goToPrefecture(p)}
              className="text-left bg-white rounded-md p-3 shadow hover:shadow-md transition"
            >
              <div className="text-sm text-gray-500">[{p.code}]</div>
              <div className="text-lg font-medium">{p.name}</div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}