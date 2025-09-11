import { prefectures } from './prefectures';

export function extractPrefectureAndCity(address) {
  const foundPref = prefectures.find(pref => address.startsWith(pref));

  if (foundPref) {
    return {
      prefecture: foundPref,
      city: address.substring(foundPref.length),
    };
  }

  return { prefecture: "", city: "" };
}