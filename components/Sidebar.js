// サイドバー

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import eventData from "../data/event_date.json";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const defined_smartphone_width = 768;

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < defined_smartphone_width);
    };

    const setupMenuItems = () => {
      const currentDate = new Date();
      const recruitmentStart = new Date(`${eventData.recruitmentStartDate}T00:00:00+09:00`);
      const eventEndDate = new Date(`${eventData.eventDate}T00:00:00+09:00`);
      eventEndDate.setDate(eventEndDate.getDate() + 1);

      let MenuItems = [];

      // 募集開始日からイベント日の間かチェック（イベント翌日0時まで表示）
      if (currentDate >= recruitmentStart && currentDate < eventEndDate) {
        MenuItems = [
          { href: "/evacuation", text: "避難情報" },
          { href: "/stock", text: "備蓄情報" },
          { href: "/alert", text: "アラート情報" },
          { href: "/update", text: "更新情報" },
          { href: "/only_events", text: "システムに関するアンケート", small: true },
        ];
      } else {
        MenuItems = [
          { href: "/evacuation", text: "避難情報" },
          { href: "/stock", text: "備蓄情報" },
          { href: "/alert", text: "アラート情報" },
          { href: "/update", text: "更新情報" },
        ];
      }

      setMenuItems(MenuItems);
    };

    checkIsMobile();
    setupMenuItems();

    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  if (isMobile) {
    return (
      <>
        <button
          onClick={toggleMenu}
          className="fixed top-4 right-4 z-50 p-2 bg-gray-800 text-white rounded-md"
          aria-label="メニューを開く"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className={`fixed inset-0 bg-gray-800 text-white transform ${isOpen ? "translate-x-0" : "translate-x-full"
          } transition-transform duration-300 ease-in-out z-40`}>
          <div className="flex flex-col p-4 mt-16">
            <nav className="flex flex-col gap-4">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`py-2 ${item.small ? "text-sm" : "text-xl"}`}
                >
                  {item.text}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="h-screen w-64 bg-gray-800 text-white flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-8">CityRiskView</h1>
      <nav className="flex flex-col gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={item.small ? "text-sm" : "text-xl"}
          >
            {item.text}
          </Link>
        ))}
      </nav>
    </div>
  );
}
