// 現在地取得のロジックフック

import { calculateDistance } from '../utils/distance';

export const useCurrentLocation = (mapRef, markerRef, setErrorMsg) => {
  const fetchLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(latitude, longitude, 34.6937, 135.5023);

        if (dist < 500000) {
          mapRef.current?.jumpTo({ center: [longitude, latitude], zoom: 13 });

          if (markerRef.current) markerRef.current.remove();

          markerRef.current = new mapboxgl.Marker({ color: 'blue' })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);

          setErrorMsg('');
        } else {
          setErrorMsg('現在地が想定外の場所です。');
        }
      },
      () => setErrorMsg('現在地の取得に失敗しました。'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return fetchLocation;
};
