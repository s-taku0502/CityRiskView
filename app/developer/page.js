"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ShelterManagement from "./components/ShelterManagement";

export default function DeveloperPage() {
  const [currentView, setCurrentView] = useState("shelters");
  const [updates, setUpdates] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkDeveloperAccess();
  }, []);

  const checkDeveloperAccess = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        return;
      }

      // 開発者権限チェック
      const developerEmails = ["sudoproject.personal@gmail.com"];
      if (!developerEmails.includes(user.email)) {
        alert("開発者権限が必要です");
        router.push("/admin");
        return;
      }

      setIsDeveloper(true);
      await fetchData();
    } catch (error) {
      console.error("Developer access check failed:", error);
      router.push("/admin");
    }
    setLoading(false);
  };

  const fetchData = async () => {
    await Promise.all([fetchUpdates(), fetchSystemLogs()]);
  };

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from("developer_updates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error("Error fetching updates:", error);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSystemLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const renderContent = () => {
    switch (currentView) {
      case "shelters":
        return <ShelterManagement />;
      case "updates":
        return <UpdateManager updates={updates} onRefresh={fetchUpdates} />;
      case "logs":
        return <SystemLogs logs={systemLogs} />;
      case "database":
        return <DatabaseMonitor />;
      case "deployment":
        return <DeploymentManager />;
      case "release":
        return <GitHubReleaseInfo />;
      default:
        return <ShelterManagement />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!isDeveloper) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">権限がありません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">開発者管理画面</h1>
            <div>
              <button
                onClick={() => router.push("/admin")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-4"
              >
                管理者画面へ
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* タブナビゲーション */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: "shelters", label: "避難所管理" },
              { key: "release", label: "リリース情報" },
              { key: "logs", label: "システムログ" },
              { key: "database", label: "データベース監視" },
              { key: "deployment", label: "デプロイメント" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${currentView === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
}

// 他のコンポーネントはここに追加または別ファイルに分離
function UpdateManager({ updates, onRefresh }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">アップデート管理</h2>
      <p className="text-gray-500">アップデート管理機能をここに実装</p>
    </div>
  );
}

function SystemLogs({ logs }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">システムログ</h2>
      <p className="text-gray-500">システムログ表示機能をここに実装</p>
    </div>
  );
}

function DatabaseMonitor() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">データベース監視</h2>
      <p className="text-gray-500">データベース監視機能をここに実装</p>
    </div>
  );
}

function DeploymentManager() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">デプロイメント管理</h2>
      <p className="text-gray-500">デプロイメント管理機能をここに実装</p>
    </div>
  );
}

function GitHubReleaseInfo() {
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