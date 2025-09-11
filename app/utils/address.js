import { prefectures } from './prefectures';

export function extractPrefectureAndCity(address) {
  let prefecture = "";
  let city = "";

  for (const pref of prefectures) {
    if (address.startsWith(pref)) {
      prefecture = pref;
      city = address.substring(pref.length);
      break;
    }
  }
  return { prefecture, city };
}