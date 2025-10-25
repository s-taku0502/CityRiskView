'use client';
import { useEffect } from 'react';
import { prefectures } from '../utils/prefectures';

export default function LocationRedirectPage() {
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // 位置情報APIから都道府県を取得
        const res = await fetch(
          `https://geoapi.heartrails.com/api/json?method=searchByGeoLocation&x=${longitude}&y=${latitude}`
        );
        const data = await res.json();
        const prefectureName = data.response.location[0].prefecture;

        // 対応する都道府県コードを検索
        const matched = prefectures.find((p) => p.name === prefectureName);

        if (matched) {
          const redirectUrl = `https://cityriskview-${matched.code}.vercel.app`;
          window.location.href = redirectUrl;
        } else {
          alert(`未対応の地域です：${prefectureName}`);
        }
      },
      (err) => {
        console.error('位置情報が取得できませんでした', err);
        alert('位置情報が取得できませんでした');
      },
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <main style={{ textAlign: 'center', marginTop: '40px' }}>
      <h2>位置情報を取得しています...</h2>
      <p>しばらくお待ちください。</p>
    </main>
  );
}
