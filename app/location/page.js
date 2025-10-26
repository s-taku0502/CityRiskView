'use client';
import { useEffect } from 'react';
import { separatedPrefectures } from '../utils/prefectures';

export default function LocationRedirectPage() {
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        const res = await fetch(
          `https://geoapi.heartrails.com/api/json?method=searchByGeoLocation&x=${longitude}&y=${latitude}`
        );
        const data = await res.json();
        const prefectureName = data.response.location[0].prefecture;

        const matched = separatedPrefectures.find((p) => p.name === prefectureName);
        if (matched) {
          const redirectUrl = `https://cityriskview-${matched.prefName}.vercel.app`;
          window.location.href = redirectUrl;
        } else {
          alert(`未対応の地域です：${prefectureName}`);
          window.location.href = '/unsupported';
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
