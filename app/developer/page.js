"use client";

import { useEffect, useState, useRef, Suspense } from "react";
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

function DeveloperPageInner() {
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") || "shelters";

  // --- UI調整中管理用 ---
  const [adjustingScreens, setAdjustingScreens] = useState({
    evacuation: false,
    stock: false,
    alert: false,
  });
  const [selectedScreen, setSelectedScreen] = useState("evacuation");
  // --- ここまで ---

  useEffect(() => {
    checkDeveloperAccess();
    fetchAdjustingScreens();
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

  const fetchAdjustingScreens = async () => {
    const { data, error } = await supabase
      .from('ui_adjusting')
      .select('screen, is_adjusting');
    if (!error && data) {
      const newState = { evacuation: false, stock: false, alert: false };
      data.forEach(row => {
        if (row.screen in newState) newState[row.screen] = row.is_adjusting;
      });
      setAdjustingScreens(newState);
    }
  };

  // --- UI調整中切り替え関数 ---
  const handleAdjustStart = async () => {
    await supabase
      .from('ui_adjusting')
      .update({ is_adjusting: true })
      .eq('screen', selectedScreen);
    fetchAdjustingScreens(); // 状態を再取得
  };
  const handleAdjustEnd = async () => {
    await supabase
      .from('ui_adjusting')
      .update({ is_adjusting: false })
      .eq('screen', selectedScreen);
    fetchAdjustingScreens(); // 状態を再取得
  };
  // --- ここまで ---

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

      {/* --- UI調整中管理UI --- */}
      <section className="bg-yellow-50 border border-yellow-300 rounded p-4 m-4">
        <div className="flex items-center space-x-4">
          <span>調整対象画面:</span>
          <select
            value={selectedScreen}
            onChange={e => setSelectedScreen(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="evacuation">/evacuation</option>
            <option value="stock">/stock</option>
            <option value="alert">/alert</option>
          </select>
          <button
            onClick={handleAdjustStart}
            className="bg-orange-500 text-white px-3 py-1 rounded"
          >
            調整中
          </button>
          <button
            onClick={handleAdjustEnd}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            調整終了
          </button>
          <span>
            現在: {adjustingScreens[selectedScreen] ? "調整中" : "通常"}
          </span>
        </div>
      </section>
      {/* --- ここまで --- */}

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

// エクスポート部分を以下のように修正
export default function DeveloperPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <DeveloperPageInner />
    </Suspense>
  );
}
