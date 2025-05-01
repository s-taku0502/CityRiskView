// ダッシュボード用レイアウト（サイドバー付きとか）

// app/(app)/dashboard/layout.js

import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: 'CityRiskView',
};

export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
