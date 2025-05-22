// components/FilterPanel.js
export default function FilterPanel({
                                      keyword, setKeyword,
                                      prefecture,
                                      setPrefecture,
                                      city,
                                      setCity,
                                      prefectureOptions,
                                      cityOptions,
                                    }) {
  return (
    <div className="space-y-2 mb-4">
      <input
        type="text"
        placeholder="キーワード（よみがな）"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="border px-2 py-1 rounded w-full"
      />
      <select
        value={prefecture}
        onChange={(e) => setPrefecture(e.target.value)}
        className="border px-2 py-1 rounded w-full"
      >
        <option value="">都道府県で絞り込み</option>
        {prefectureOptions.map((pref) => (
          <option key={pref} value={pref}>{pref}</option>
        ))}
      </select>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="border px-2 py-1 rounded w-full"
      >
        <option value="">市町村で絞り込み</option>
        {cityOptions.map((city) => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>
    </div>
  );
}
