// ダッシュボード用レイアウト（サイドバー付きとか）

// app/(app)/dashboard/layout.js

import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: 'Dashboard',  // ← 適当でOK
};

export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
