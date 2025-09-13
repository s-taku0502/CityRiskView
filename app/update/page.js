"use client";

import { useEffect, useState } from "react";

// ユーティリティ関数：URLと改行を処理して整形されたJSXを返す
function renderContent(content) {
    const lines = content.split('\n');
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return lines.map((line, lineIndex) => {
        const parts = line.split(urlRegex);

        return (
            <p key={lineIndex} className="mb-1">
                {parts.map((part, i) =>
                    urlRegex.test(part) ? (
                        <a
                            key={i}
                            href={part}
                            className="text-blue-600 underline break-all"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {part}
                        </a>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </p>
        );
    });
}

export default function UpdatePage() {
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRelease = async () => {
      try {
        // GitHub APIから最新リリース情報取得
        const res = await fetch(
          "https://api.github.com/repos/s-taku0502/cityriskview/releases/latest"
        );
        if (!res.ok) throw new Error("GitHub API error");
        const data = await res.json();
        setRelease(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRelease();
  }, []);

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">更新情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">更新情報</h1>
      {error && <div className="text-red-600">エラー: {error}</div>}
      {release && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-black text-lg font-medium mb-2">
            最新バージョン: {release.tag_name}
          </h2>
          <p className="text-sm text-gray-500 mb-2">
            公開日: {new Date(release.published_at).toLocaleString()}
          </p>
          <div className="whitespace-pre-line text-gray-700 mb-4">
            {renderContent(release.body)}
          </div>
          <a
            href={release.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            詳細を見る
          </a>
        </div>
      )}
    </div>
  );
}
