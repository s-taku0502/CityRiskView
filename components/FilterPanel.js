export default function FilterPanel({
  keyword,
  setKeyword,
  prefecture,
  setPrefecture,
  city,
  setCity,
  prefectureOptions,
  cityOptions,
}) {
  return (
    <div className="space-y-2 mb-4">
      <select
        value={prefecture}
        onChange={(e) => {
          setPrefecture(e.target.value);
          setCity('');
        }}
        className="border px-2 py-1 rounded w-full"
      >
        <option value="">都道府県で絞り込み</option>
        {prefectureOptions.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="border px-2 py-1 rounded w-full"
        disabled={!prefecture}
      >
        <option value="">市区町村で絞り込み</option>
        {cityOptions.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="キーワード（よみがな）"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="border px-2 py-1 rounded w-full"
      />
    </div>
  );
}
