'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SmartphoneTopPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: '避難所マップ', path: '/map'},
    { name: 'アラート', path: '/alert'},
    { name: '備蓄品管理', path: '/stock'},
    { name: '避難情報', path: '/evacuation'},
    { name: 'ダッシュボード', path: '/dashboard'},
    { name: '設定', path: '/settings'},
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">CityRiskView</h1>
        <p className="text-sm text-gray-600">災害情報・避難支援アプリ</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <span className="text-3xl mb-2">{item.icon}</span>
            <span className="text-gray-700 font-medium">{item.name}</span>
          </button>
        ))}
      </div>

      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>緊急時は直ちに避難してください</p>
        <p className="mt-1">最寄りの避難所をご確認ください</p>
      </footer>
    </div>
  );
}