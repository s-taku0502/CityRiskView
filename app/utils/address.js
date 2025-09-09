export function extractPrefectureAndCity(address) {
  const prefectures = [
    "東京都", "神奈川県", "千葉県", "埼玉県", "茨城県", "栃木県", "群馬県",
    // 必要に応じて追加
  ];
  let prefecture = "";
  let city = "";

  for (const pref of prefectures) {
    if (address.startsWith(pref)) {
      prefecture = pref;
      address = address.replace(pref, "");
      break;
    }
  }
  if (!prefecture) prefecture = "東京都";
  const cityMatch = address.match(/^(.*?[市区町村])/);
  if (cityMatch) {
    city = cityMatch[1];
  }
  return { prefecture, city };
}