// 一般利用者用のトップ（地図・分析とか）
// import { redirect } from 'next/navigation';

// export default function Page() {
//   redirect('/dashboard');
// }

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ダッシュボード</h2>
      <p>ここにリアルタイムのリスクスコアやサマリーを表示します。</p>
    </div>
  );
}
