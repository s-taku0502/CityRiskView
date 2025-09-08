"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const REDIRECT_PATH = "/evacuation";
  const REDIRECT_DELAY_MS = 1200;

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(REDIRECT_PATH);
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-xl font-semibold mb-6 text-gray-800">
        避難情報の画面へ遷移します
      </div>
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
    </div>
  );
}

// 'use client'

// import Link from 'next/link'

// export default function HomePage() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
//       <div className="max-w-md w-full space-y-8 text-center">
//         <div>
//           <h1 className="text-4xl font-bold text-gray-900 mb-2">
//             CityRiskView
//           </h1>
//           <p className="text-lg text-gray-600">
//             避難所情報管理システム
//           </p>
//         </div>

//         <div className="space-y-4">
//           <Link 
//             href="/admin"
//             className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors"
//           >
//             管理者ログイン
//           </Link>
          
//           <Link 
//             href="/map"
//             className="block w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors"
//           >
//             一般向けマップ
//           </Link>
//         </div>

//         <div className="text-sm text-gray-500 space-y-2">
//           <p className="font-medium">機能概要:</p>
//           <p>管理者: 備蓄管理・QRスキャン・統計分析</p>
//           <p>一般: マップ表示・避難所情報・避難ルート</p>
//           <div className="mt-4 p-3 bg-blue-50 rounded-lg">
//             <p className="text-blue-700 text-xs font-medium">
//               Google Analytics統合により、サイトの利用状況を分析しています
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }