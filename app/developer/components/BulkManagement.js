"use client";

import React, { useState } from "react";

// dbColumnsの内容を反映（必須・推奨・補助すべて）
const DB_COLUMNS = [
    // 必須
    { key: 'type', label: '避難所種別', type: 'text', required: true },
    { key: 'name', label: '避難所名', type: 'text', required: true },
    { key: 'address', label: '住所', type: 'text', required: true },
    { key: 'latitude', label: '緯度', type: 'number', required: true },
    { key: 'longitude', label: '経度', type: 'number', required: true },
    { key: 'capacity', label: '収容人数', type: 'number', required: true },
    { key: 'current_people', label: '現在の避難者数', type: 'number', required: false, default: 0 },
    // 推奨
    { key: 'disaster_flood', label: '洪水対応', type: 'checkbox', required: false },
    { key: 'disaster_earthquake', label: '地震対応', type: 'checkbox', required: false },
    { key: 'disaster_tsunami', label: '津波対応', type: 'checkbox', required: false },
    { key: 'disaster_landslide', label: '土砂災害対応', type: 'checkbox', required: false },
    { key: 'disaster_storm_surge', label: '高潮対応', type: 'checkbox', required: false },
    { key: 'disaster_fire', label: '大規模火災対応', type: 'checkbox', required: false },
    { key: 'disaster_inland_flood', label: '内水氾濫対応', type: 'checkbox', required: false },
    { key: 'disaster_volcano', label: '火山現象対応', type: 'checkbox', required: false },
    { key: 'phone', label: '電話番号', type: 'tel', required: false },
    // 補助
    { key: 'wheelchair_accessible', label: '車椅子対応トイレ', type: 'checkbox', required: false },
    { key: 'elevator_available', label: 'エレベーター有', type: 'checkbox', required: false },
    { key: 'slope_available', label: 'スロープ等', type: 'checkbox', required: false },
    { key: 'braille_block', label: '点字ブロック', type: 'checkbox', required: false },
    { key: 'first_floor_access', label: '避難スペースが1階', type: 'checkbox', required: false },
    { key: 'area', label: '施設面積（㎡）', type: 'number', required: false },
    { key: 'email', label: 'メールアドレス', type: 'email', required: false },
    { key: 'url', label: 'WebサイトURL', type: 'url', required: false },
    { key: 'stock', label: '備蓄情報', type: 'textarea', required: false },
    { key: 'notes', label: '備考・その他', type: 'textarea', required: false }
];

export default function BulkManagement() {
    const [csvFile, setCsvFile] = useState(null);
    const [csvPreview, setCsvPreview] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [columnMap, setColumnMap] = useState({});
    const [message, setMessage] = useState("");
    const [showMapping, setShowMapping] = useState(false);

    // ファイル選択時
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setCsvFile(file);
        setMessage("");
        setShowMapping(false);
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const rows = text
                    .split(/\r?\n/)
                    .filter((row) => row.trim() !== "")
                    .map((row) => row.split(","));
                if (rows.length < 2) {
                    setMessage("CSVファイルにデータがありません。");
                    setCsvPreview([]);
                    setCsvHeaders([]);
                    setColumnMap({});
                    return;
                }
                setCsvPreview(rows.slice(0, 6)); // ヘッダー+5行プレビュー
                setCsvHeaders(rows[0]);
                // 初期マッピング: ヘッダー名が一致する場合は自動で割り当て
                const initialMap = {};
                DB_COLUMNS.forEach((col) => {
                    const found = rows[0].find((header) =>
                        header.replace(/\s/g, "") === col.label.replace(/\s/g, "")
                    );
                    initialMap[col.key] = found || "";
                });
                setColumnMap(initialMap);
                setShowMapping(true);
            };
            reader.readAsText(file);
        } else {
            setCsvPreview([]);
            setCsvHeaders([]);
            setColumnMap({});
            setShowMapping(false);
        }
    };

    // マッピング変更
    const handleMapChange = (systemKey, csvHeader) => {
        setColumnMap((prev) => ({
            ...prev,
            [systemKey]: csvHeader,
        }));
    };

    // バリデーション
    const getUnmappedRequired = () => {
        return DB_COLUMNS.filter(
            (col) => col.required && (!columnMap[col.key] || columnMap[col.key] === "")
        );
    };

    // アップロード処理（ここでcolumnMapを利用）
    const handleUpload = () => {
        if (!csvFile) {
            setMessage("CSVファイルを選択してください。");
            return;
        }
        const unmapped = getUnmappedRequired();
        if (unmapped.length > 0) {
            setMessage(
                `必須項目のマッピングが未設定です: ${unmapped
                    .map((col) => col.label)
                    .join(", ")}`
            );
            return;
        }
        // columnMapを使ってアップロード処理を実装
        setMessage("アップロード処理を実装してください。");
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">一括インポート</h3>
            <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mb-4"
            />

            {/* カラムマッピングUI */}
            {showMapping && (
                <div className="mb-6">
                    <div className="font-bold mb-2">カラムマッピング</div>
                    <table className="border mb-2">
                        <thead>
                            <tr>
                                <th className="border px-2 py-1">システムカラム</th>
                                <th className="border px-2 py-1">CSVカラム</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DB_COLUMNS.map((col) => (
                                <tr key={col.key}>
                                    <td className="border px-2 py-1">
                                        {col.label}
                                        {col.required && <span className="text-red-500 ml-1">*</span>}
                                    </td>
                                    <td className="border px-2 py-1">
                                        <select
                                            value={columnMap[col.key] || ""}
                                            onChange={(e) => handleMapChange(col.key, e.target.value)}
                                            className={`border rounded px-2 py-1 ${col.required &&
                                                (!columnMap[col.key] || columnMap[col.key] === "")
                                                ? "border-red-500 bg-red-50"
                                                : ""
                                                }`}
                                        >
                                            <option value="">選択してください</option>
                                            <option value="指定緊急避難場所" className="text-gray-500">指定緊急避難場所</option>
                                            <option value="指定避難所" className="text-gray-500">指定避難所</option>
                                            <option value="0" className="text-gray-500">0</option>
                                            <option value="__none__" className="text-gray-500">該当なし</option>
                                            {csvHeaders.map((header) => (
                                                <option key={header} value={header}>
                                                    {header}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* マッピング状況 */}
                    <div className="mb-2 text-sm">
                        <span className="text-green-700">
                            設定済み:{" "}
                            {DB_COLUMNS.filter(
                                (col) => columnMap[col.key] && columnMap[col.key] !== ""
                            ).length}
                            件
                        </span>
                        <span className="ml-4 text-red-700">
                            未設定: {getUnmappedRequired().length}件
                        </span>
                        {getUnmappedRequired().length > 0 && (
                            <span className="ml-4 text-red-500">
                                ⚠️ 必須項目のマッピングが未設定です
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* プレビュー */}
            {csvPreview.length > 0 && (
                <div className="mb-4">
                    <div className="font-bold mb-2">CSVプレビュー（先頭5行）</div>
                    <table className="border">
                        <tbody>
                            {csvPreview.map((row, i) => (
                                <tr key={i}>
                                    {row.map((cell, j) => (
                                        <td key={j} className="border px-2 py-1">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <button
                onClick={handleUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded"
            >
                アップロード
            </button>
            {message && (
                <div className="mt-4 text-red-500 whitespace-pre-line">{message}</div>
            )}
        </div>
    );
}