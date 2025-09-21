"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

// 各タブ import
import SheltersTab from "./tabs/SheltersTab";
import UpdateManagerTab from "./tabs/UpdateManagerTab";
import LogsTab from "./tabs/LogsTab";
import DatabaseTab from "./tabs/DatabaseTab";
import DeploymentTab from "./tabs/DeploymentTab";
import ReleaseTab from "./tabs/ReleaseTab";

const tabs = [
  { key: "shelters", label: "避難所管理", component: SheltersTab },
  { key: "updates", label: "アップデート管理", component: UpdateManagerTab },
  { key: "logs", label: "システムログ", component: LogsTab },
  { key: "database", label: "データベース監視", component: DatabaseTab },
  { key: "deployment", label: "デプロイメント", component: DeploymentTab },
  { key: "release", label: "リリース情報", component: ReleaseTab },
];

export default function DeveloperPage() {
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") || "shelters";

  useEffect(() => {
    checkDeveloperAccess();
  }, []);

  const checkDeveloperAccess = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      router.push("/login");
      return;
    }
    if (!["sudoproject.personal@gmail.com"].includes(user.email)) {
      alert("開発者権限が必要です");
      router.push("/admin");
      return;
    }
    setIsDeveloper(true);
    setLoading(false);
  };

  if (loading) return <div>読み込み中...</div>;
  if (!isDeveloper) return <div>権限がありません</div>;

  const ActiveTabComponent = tabs.find(t => t.key === currentTab)?.component || SheltersTab;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="flex justify-between items-center py-6 px-4">
          <h1 className="text-3xl font-bold">開発者管理画面</h1>
        </div>
      </header>

      {/* タブナビゲーション */}
      <nav className="bg-white border-b">
        <div className="flex space-x-8 px-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => router.push(`?tab=${tab.key}`)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentTab === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* メイン */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        <ActiveTabComponent updates={updates} logs={systemLogs} />
      </main>
    </div>
  );
}
