"use client";

import { useState, useEffect } from "react";

export default function ReleaseTab() {
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRelease = async () => {
      try {
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

  if (loading) return <div>リリース情報取得中...</div>;
  if (error) return <div className="text-red-600">エラー: {error}</div>;
  if (!release) return <div>リリース情報なし</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">最新リリース情報</h2>
      <p><strong>バージョン:</strong> {release.tag_name}</p>
      <p><strong>公開日:</strong> {new Date(release.published_at).toLocaleString()}</p>
      <div className="mt-2 whitespace-pre-line text-gray-700">{release.body}</div>
      <a
        href={release.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        詳細を見る
      </a>
    </div>
  );
}
