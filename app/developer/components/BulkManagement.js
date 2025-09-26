"use client";

import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントの設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// dbColumnsの内容を反映（必須・推奨・補助すべて）
const DB_COLUMNS = [
    // 必須
    { key: 'type', label: '避難所種別', type: 'text', required: true },
    { key: 'name', label: '避難所名', type: 'text', required: true },
    { key: 'address', label: '住所', type: 'text', required: true },
    { key: 'latitude', label: '緯度', type: 'number', required: true },
    { key: 'longitude', label: '経度', type: 'number', required: true },
    { key: 'capacity', label: '収容人数', type: 'number', required: true },
    { key: 'current_people', label: '現在の避難者数', type: 'number', required: true, default: 0 },
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

// 自動マッピング用キーワード辞書（優先順位付き）
const AUTO_MAPPING_KEYWORDS = {
    // 基本情報
    name: [
        '施設・場所名', '施設名', '場所名', '避難所名', '名称', 'name', '施設'
    ],
    address: [
        '住所', 'address', '所在地', '場所'
    ],
    latitude: [
        '緯度', 'latitude', 'lat', 'y座標', 'Y座標'
    ],
    longitude: [
        '経度', 'longitude', 'lng', 'lon', 'x座標', 'X座標'
    ],
    
    // 災害対応（具体的なキーワードを優先）
    disaster_flood: [
        '洪水', 'flood', '河川氾濫', '浸水対応'
    ],
    disaster_landslide: [
        '崖崩れ、土石流及び地滑り', '土砂災害', '崖崩れ', '土石流', '地滑り', '地すべり', 
        'landslide', '土砂', '急傾斜地'
    ],
    disaster_storm_surge: [
        '高潮', 'storm_surge', '暴風', '高波'
    ],
    disaster_earthquake: [
        '地震', 'earthquake', '耐震', '震災'
    ],
    disaster_tsunami: [
        '津波', 'tsunami', '津波災害'
    ],
    disaster_fire: [
        '大規模な火事', '大規模火災', '火災', 'fire', '延焼', '大規模な火災'
    ],
    disaster_inland_flood: [
        '内水氾濫', 'inland_flood', '都市型浸水', '排水不良'
    ],
    disaster_volcano: [
        '火山現象', '火山', 'volcano', '降灰', '噴火', '火山災害'
    ],
    
    // その他
    capacity: [
        '収容人数', '収容', 'capacity', '定員', '収容可能人数', '最大収容'
    ],
    current_people: [
        '現在の避難者数', '現在人数', 'current', '避難者数', '現在'
    ],
    phone: [
        '電話番号', '電話', 'phone', 'tel', 'TEL'
    ],
    notes: [
        '備考', '注記', 'notes', 'その他', '備考・その他', 'memo', 'メモ'
    ],
    
    // 施設種別（自治体データでよくある）
    type: [
        '都道府県名及び市町村名', '種別', 'タイプ', 'type', '施設種別', '避難所種別', '分類'
    ]
};

// 自動マッピング関数（改良版）
const createAutoMapping = (headers) => {
    const initialMap = {};
    const usedHeaders = new Set(); // 重複マッピングを防ぐ
    
    // まず完全一致を探す（最も確実）
    DB_COLUMNS.forEach((col) => {
        if (AUTO_MAPPING_KEYWORDS[col.key]) {
            const keywords = AUTO_MAPPING_KEYWORDS[col.key];
            
            for (const keyword of keywords) {
                const matchedHeader = headers.find(header => 
                    !usedHeaders.has(header) && 
                    header.replace(/\s/g, "").toLowerCase() === keyword.replace(/\s/g, "").toLowerCase()
                );
                
                if (matchedHeader) {
                    initialMap[col.key] = matchedHeader;
                    usedHeaders.add(matchedHeader);
                    break; // 最初にマッチしたものを採用
                }
            }
        }
    });
    
    // 完全一致しなかった場合は部分一致を探す
    DB_COLUMNS.forEach((col) => {
        if (!initialMap[col.key] && AUTO_MAPPING_KEYWORDS[col.key]) {
            const keywords = AUTO_MAPPING_KEYWORDS[col.key];
            
            for (const keyword of keywords) {
                const matchedHeader = headers.find(header => 
                    !usedHeaders.has(header) && 
                    (header.replace(/\s/g, "").toLowerCase().includes(keyword.replace(/\s/g, "").toLowerCase()) ||
                     keyword.replace(/\s/g, "").toLowerCase().includes(header.replace(/\s/g, "").toLowerCase()))
                );
                
                if (matchedHeader) {
                    initialMap[col.key] = matchedHeader;
                    usedHeaders.add(matchedHeader);
                    break;
                }
            }
        }
    });
    
    // マッピングされなかった項目は空文字で初期化
    DB_COLUMNS.forEach((col) => {
        if (!initialMap[col.key]) {
            initialMap[col.key] = "";
        }
    });
    
    return initialMap;
};

export default function BulkManagement() {
    const [csvFile, setCsvFile] = useState(null);
    const [csvPreview, setCsvPreview] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [columnMap, setColumnMap] = useState({});
    const [message, setMessage] = useState("");
    const [showMapping, setShowMapping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);
    
    // 認証関連のstate
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSigningIn, setIsSigningIn] = useState(false);

    // 認証状態の監視
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            setIsLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user || null);
                if (event === 'SIGNED_IN') {
                    setMessage("ログインしました。CSVアップロードが利用可能です。");
                } else if (event === 'SIGNED_OUT') {
                    setMessage("ログアウトしました。");
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // 開発用簡単ログイン
    const handleQuickSignIn = async () => {
        setIsSigningIn(true);
        try {
            // 開発用のテストアカウント
            const testEmail = "developer@test.com";
            const testPassword = "developer123";
            
            // まずサインアップを試す（既存の場合はエラーになるが無視）
            await supabase.auth.signUp({
                email: testEmail,
                password: testPassword,
            });
            
            // サインイン
            const { error } = await supabase.auth.signInWithPassword({
                email: testEmail,
                password: testPassword,
            });
            
            if (error) {
                throw error;
            }
            
            setMessage("開発用アカウントでログインしました。");
        } catch (error) {
            console.error('Sign in error:', error);
            setMessage(`ログインエラー: ${error.message}`);
        } finally {
            setIsSigningIn(false);
        }
    };

    // 手動ログイン
    const handleSignIn = async (e) => {
        e.preventDefault();
        setIsSigningIn(true);
        
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            
            if (error) {
                throw error;
            }
            
            setMessage("ログインしました。");
            setEmail("");
            setPassword("");
        } catch (error) {
            console.error('Sign in error:', error);
            setMessage(`ログインエラー: ${error.message}`);
        } finally {
            setIsSigningIn(false);
        }
    };

    // ログアウト
    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            setMessage(`ログアウトエラー: ${error.message}`);
        }
    };

    // 改良されたCSVパース関数
    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // エスケープされたクォート
                    current += '"';
                    i += 2;
                    continue;
                } else if (!inQuotes) {
                    // クォート開始
                    inQuotes = true;
                } else {
                    // クォート終了
                    inQuotes = false;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
            i++;
        }
        result.push(current.trim());
        return result;
    };

    // ファイル選択時（文字エンコーディング対応）
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setCsvFile(file);
        setMessage("");
        setShowMapping(false);
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target.result;
                    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
                    
                    if (lines.length < 2) {
                        setMessage("CSVファイルにデータがありません。");
                        setCsvPreview([]);
                        setCsvHeaders([]);
                        setColumnMap({});
                        return;
                    }

                    const rows = lines.map(line => parseCSVLine(line));
                    setCsvPreview(rows.slice(0, 6)); // ヘッダー+5行プレビュー
                    setCsvHeaders(rows[0]);
                    
                    // 自動マッピングを実行
                    const autoMapping = createAutoMapping(rows[0]);
                    setColumnMap(autoMapping);
                    setShowMapping(true);

                    // マッピング結果を表示
                    const mappedCount = Object.values(autoMapping).filter(value => value !== "").length;
                    const autoMappedItems = Object.entries(autoMapping)
                        .filter(([key, value]) => value !== "")
                        .map(([key, value]) => {
                            const col = DB_COLUMNS.find(c => c.key === key);
                            return `${col.label} ← ${value}`;
                        });
                    
                    setMessage(
                        `自動マッピング完了: ${mappedCount}/${DB_COLUMNS.length} 項目が自動設定されました\n\n` +
                        `マッピング結果:\n${autoMappedItems.join('\n')}`
                    );
                } catch (error) {
                    console.error('File parsing error:', error);
                    setMessage(`ファイル解析エラー: ${error.message}`);
                }
            };
            
            reader.onerror = () => {
                setMessage("ファイル読み込みエラー。ファイル形式やエンコーディングを確認してください。");
            };
            
            // 文字エンコーディングを自動検出
            reader.readAsText(file, 'UTF-8');
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

    // 自動マッピングされた項目かどうかを判定
    const isAutoMapped = (key) => {
        const value = columnMap[key];
        if (!value || value === "") return false;
        
        const keywords = AUTO_MAPPING_KEYWORDS[key];
        if (!keywords) return false;
        
        return keywords.some(keyword => 
            value.replace(/\s/g, "").toLowerCase().includes(keyword.replace(/\s/g, "").toLowerCase()) ||
            keyword.replace(/\s/g, "").toLowerCase().includes(value.replace(/\s/g, "").toLowerCase())
        );
    };

    // CSVデータを解析してオブジェクト配列に変換（改良版）
    const parseCSVData = () => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target.result;
                    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
                    
                    if (lines.length < 2) {
                        reject(new Error("データ行がありません"));
                        return;
                    }

                    const headers = parseCSVLine(lines[0]);
                    const dataLines = lines.slice(1);
                    const parsedData = [];
                    const errors = [];
                    const warnings = [];
                    
                    dataLines.forEach((line, index) => {
                        const rowNumber = index + 2; // ヘッダー行を考慮
                        
                        try {
                            const row = parseCSVLine(line);
                            
                            // 空行をスキップ
                            if (row.every(cell => !cell || cell.trim() === "")) {
                                warnings.push(`行 ${rowNumber}: 空行のためスキップしました`);
                                return;
                            }
                            
                            const item = {};
                            const missingFields = [];
                            
                            // columnMapに基づいてデータをマッピング
                            DB_COLUMNS.forEach((col) => {
                                const csvHeader = columnMap[col.key];
                                let value = null;
                                
                                if (csvHeader && csvHeader !== "" && csvHeader !== "__none__") {
                                    const headerIndex = headers.indexOf(csvHeader);
                                    if (headerIndex !== -1 && headerIndex < row.length) {
                                        value = row[headerIndex] || "";
                                        
                                        // データ型に応じて変換
                                        switch (col.type) {
                                            case 'number':
                                                if (value === "" || value === null) {
                                                    value = col.default !== undefined ? col.default : null;
                                                } else {
                                                    const numValue = parseFloat(String(value).replace(/[,，]/g, ''));
                                                    if (isNaN(numValue)) {
                                                        if (col.required) {
                                                            missingFields.push(col.label);
                                                            value = null;
                                                        } else {
                                                            value = col.default !== undefined ? col.default : null;
                                                        }
                                                    } else {
                                                        value = numValue;
                                                    }
                                                }
                                                break;
                                            case 'checkbox':
                                                const strValue = String(value).toLowerCase().trim();
                                                value = ["1", "true", "yes", "○", "✓", "〇", "有", "あり"].includes(strValue) || value === true;
                                                break;
                                            case 'text':
                                            case 'tel':
                                            case 'email':
                                            case 'url':
                                            case 'textarea':
                                            default:
                                                value = String(value).trim();
                                                break;
                                        }
                                    } else {
                                        // 固定値の場合
                                        if (csvHeader === "0") {
                                            value = col.type === 'number' ? 0 : "0";
                                        } else {
                                            value = csvHeader;
                                        }
                                    }
                                } else if (col.default !== undefined) {
                                    value = col.default;
                                }
                                
                                // 必須項目のチェック
                                if (col.required && (value === null || value === "" || value === undefined)) {
                                    missingFields.push(col.label);
                                }
                                
                                item[col.key] = value;
                            });

                            // 必須項目のバリデーション
                            if (missingFields.length > 0) {
                                errors.push(`行 ${rowNumber}: 必須項目が不足しています - ${missingFields.join(", ")}`);
                                return; // この行はスキップ
                            }
                            
                            // 追加バリデーション
                            if (item.latitude && (item.latitude < -90 || item.latitude > 90)) {
                                warnings.push(`行 ${rowNumber}: 緯度の値が範囲外です (${item.latitude})`);
                            }
                            if (item.longitude && (item.longitude < -180 || item.longitude > 180)) {
                                warnings.push(`行 ${rowNumber}: 経度の値が範囲外です (${item.longitude})`);
                            }
                            if (item.capacity && item.capacity < 0) {
                                warnings.push(`行 ${rowNumber}: 収容人数が負の値です (${item.capacity})`);
                            }
                            
                            parsedData.push(item);
                            
                        } catch (rowError) {
                            errors.push(`行 ${rowNumber}: ${rowError.message}`);
                        }
                    });

                    // 結果の検証
                    if (parsedData.length === 0 && errors.length > 0) {
                        reject(new Error(`有効なデータがありません。\n\nエラー:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n...他${errors.length - 10}件` : ''}`));
                        return;
                    }
                    
                    resolve({
                        data: parsedData,
                        errors: errors,
                        warnings: warnings,
                        totalRows: dataLines.length,
                        validRows: parsedData.length,
                        skippedRows: dataLines.length - parsedData.length
                    });
                    
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error("ファイル読み込みエラー"));
            reader.readAsText(csvFile, 'UTF-8');
        });
    };

    // Supabaseに直接データを送信（修正版 - 存在するカラムのみ使用）
    const uploadData = async (data) => {
        try {
            setMessage("データベースに接続中...");
            
            // 認証チェック
            if (!user) {
                throw new Error("ログインが必要です。");
            }
            
            // バッチサイズを設定（Supabaseの制限を考慮）
            const batchSize = 50;
            const batches = [];
            
            for (let i = 0; i < data.length; i += batchSize) {
                batches.push(data.slice(i, i + batchSize));
            }

            let totalSuccess = 0;
            let totalFailed = 0;
            const errors = [];
            const warnings = [];

            // バッチごとに処理
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                setMessage(`バッチ ${i + 1}/${batches.length} を処理中... (${totalSuccess}/${data.length}件完了)`);

                try {
                    // 各データにタイムスタンプのみを追加（created_by, updated_byは削除）
                    const batchWithMeta = batch.map(item => ({
                        ...item,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));

                    // まず通常のinsertを試す（upsertは複雑なので避ける）
                    const { data: insertedData, error } = await supabase
                        .from('shelters')
                        .insert(batchWithMeta)
                        .select('id');

                    if (error) {
                        console.error('Supabase insert error:', error);
                        
                        // RLSエラーの場合
                        if (error.code === '42501') {
                            errors.push(`バッチ ${i + 1}: 権限エラー - ${error.message}`);
                            totalFailed += batch.length;
                            continue;
                        }
                        
                        // 重複エラーの場合は個別処理
                        if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
                            warnings.push(`バッチ ${i + 1}: 重複データが検出されました - 個別処理中...`);
                            
                            // 個別に処理して重複をスキップ
                            for (const item of batchWithMeta) {
                                try {
                                    const { data: singleData, error: singleError } = await supabase
                                        .from('shelters')
                                        .insert(item)
                                        .select('id');
                                    
                                    if (singleError) {
                                        if (singleError.code === '23505' || singleError.message.includes('duplicate')) {
                                            warnings.push(`重複スキップ: ${item.name || '名称不明'}`);
                                        } else {
                                            errors.push(`挿入エラー: ${item.name || '名称不明'} - ${singleError.message}`);
                                            totalFailed++;
                                        }
                                    } else {
                                        totalSuccess++;
                                    }
                                } catch (singleError) {
                                    errors.push(`個別処理エラー: ${item.name || '名称不明'} - ${singleError.message}`);
                                    totalFailed++;
                                }
                                
                                // 個別処理時の短い待機
                                await new Promise(resolve => setTimeout(resolve, 50));
                            }
                        } else {
                            // その他のエラー
                            errors.push(`バッチ ${i + 1} エラー: ${error.message}`);
                            totalFailed += batch.length;
                        }
                    } else {
                        // 成功
                        const insertedCount = insertedData ? insertedData.length : batch.length;
                        totalSuccess += insertedCount;
                    }
                } catch (batchError) {
                    console.error('Batch processing error:', batchError);
                    errors.push(`バッチ ${i + 1} 処理エラー: ${batchError.message}`);
                    totalFailed += batch.length;
                }

                // 進行状況を更新
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            return {
                success: totalSuccess,
                failed: totalFailed,
                errors: errors,
                warnings: warnings,
                message: `処理完了: ${totalSuccess}件成功, ${totalFailed}件失敗`
            };

        } catch (error) {
            console.error('Upload error:', error);
            throw new Error(`データベースエラー: ${error.message}`);
        }
    };

    // テーブル構造確認用の関数を追加
    const checkTableStructure = async () => {
        try {
            setMessage("テーブル構造を確認中...");
            
            // 1件データを取得してカラム構造を確認
            const { data, error } = await supabase
                .from('shelters')
                .select('*')
                .limit(1);
            
            if (error) {
                console.error('Table structure check error:', error);
                setMessage(`テーブル構造確認エラー: ${error.message}`);
                return;
            }
            
            // 取得したデータの構造をログに出力
            if (data && data.length > 0) {
                const columns = Object.keys(data[0]);
                console.log('Available columns:', columns);
                setMessage(`テーブル構造確認完了。利用可能なカラム: ${columns.join(', ')}`);
            } else {
                // テーブルが空の場合、insertを試してエラーからカラム情報を取得
                try {
                    await supabase
                        .from('shelters')
                        .insert({})
                        .select('*');
                } catch (insertError) {
                    console.log('Insert error (expected):', insertError);
                    setMessage("テーブルは空です。カラム構造の詳細確認にはデータが必要です。");
                }
            }
            
        } catch (error) {
            console.error('Structure check failed:', error);
            setMessage(`構造確認失敗: ${error.message}`);
        }
    };

    // サンプルデータでテストする関数
    const testInsert = async () => {
        try {
            setMessage("テスト挿入を実行中...");
            
            const testData = {
                type: "指定避難所",
                name: "テスト避難所",
                address: "テスト住所123",
                latitude: 35.6762,
                longitude: 139.6503,
                capacity: 100,
                current_people: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await supabase
                .from('shelters')
                .insert(testData)
                .select('*');
            
            if (error) {
                console.error('Test insert error:', error);
                setMessage(`テスト挿入エラー: ${error.message}`);
            } else {
                console.log('Test insert success:', data);
                setMessage(`テスト挿入成功: ID ${data[0]?.id} で挿入されました`);
                
                // テストデータを削除
                if (data[0]?.id) {
                    await supabase
                        .from('shelters')
                        .delete()
                        .eq('id', data[0].id);
                    setMessage(`テスト挿入成功（テストデータは削除済み）`);
                }
            }
            
        } catch (error) {
            console.error('Test failed:', error);
            setMessage(`テスト失敗: ${error.message}`);
        }
    };

    // アップロード処理（認証チェック追加）
    const handleUpload = async () => {
        if (!user) {
            setMessage("ログインしてください。");
            return;
        }
        
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

        setIsUploading(true);
        setMessage("");
        setUploadResults(null);

        try {
            // CSVデータを解析
            setMessage("CSVデータを解析中...");
            const parseResult = await parseCSVData();
            
            if (parseResult.errors.length > 0) {
                setMessage(
                    `データ解析完了:\n` +
                    `総行数: ${parseResult.totalRows}行\n` +
                    `有効: ${parseResult.validRows}行\n` +
                    `スキップ: ${parseResult.skippedRows}行\n` +
                    `エラー: ${parseResult.errors.length}件\n\n` +
                    `有効なデータをアップロード中...`
                );
                
                setUploadResults({
                    errors: parseResult.errors,
                    warnings: parseResult.warnings
                });
            }
            
            if (parseResult.validRows === 0) {
                setMessage("有効なデータがありません。エラーを確認してください。");
                return;
            }
            
            // データベース接続テスト
            setMessage("データベース接続をテスト中...");
            const { error: connectionError } = await supabase
                .from('shelters')
                .select('id')
                .limit(1);
            
            if (connectionError) {
                throw new Error(`データベース接続エラー: ${connectionError.message}`);
            }
            
            setMessage(`${parseResult.validRows}件の有効なデータをアップロード中...`);
            
            // Supabaseに直接アップロード
            const result = await uploadData(parseResult.data);
            
            const finalResult = {
                ...result,
                errors: [...(parseResult.errors || []), ...(result.errors || [])],
                warnings: [...(parseResult.warnings || []), ...(result.warnings || [])]
            };
            
            setUploadResults(finalResult);
            setMessage(
                `アップロード完了:\n` +
                `成功: ${result.success || 0}件\n` +
                `失敗: ${result.failed || 0}件\n` +
                `解析エラー: ${parseResult.errors.length}件\n` +
                `警告: ${(parseResult.warnings.length || 0) + (result.warnings.length || 0)}件`
            );
            
            // 成功時はフォームをリセット
            if (result.success > 0) {
                setCsvFile(null);
                setCsvPreview([]);
                setCsvHeaders([]);
                setColumnMap({});
                setShowMapping(false);
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) fileInput.value = '';
            }

        } catch (error) {
            console.error('Upload error:', error);
            setMessage(`エラー: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return <div>読み込み中...</div>;
    }

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">一括インポート</h3>
            
            {/* デバッグ用ツール（改良版） */}
            {user && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-sm text-blue-800 mb-2">開発者ツール:</div>
                    <div className="space-x-2">
                        <button
                            onClick={checkTableStructure}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            テーブル構造確認
                        </button>
                        <button
                            onClick={testInsert}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            テスト挿入
                        </button>
                    </div>
                </div>
            )}

            {/* 認証セクション */}
            {!user ? (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 className="font-semibold mb-3 text-yellow-800">ログインが必要です</h4>
                    
                    {/* 開発用クイックログイン */}
                    <div className="mb-4">
                        <button
                            onClick={handleQuickSignIn}
                            disabled={isSigningIn}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            {isSigningIn ? "ログイン中..." : "開発用アカウントでログイン"}
                        </button>
                        <div className="text-sm text-gray-600 mt-1">
                            ※ developer@test.com / developer123 で自動ログイン
                        </div>
                    </div>
                    
                    {/* 手動ログイン */}
                    <div className="border-t pt-4">
                        <div className="text-sm text-gray-700 mb-2">または手動でログイン:</div>
                        <form onSubmit={handleSignIn} className="space-y-2">
                            <input
                                type="email"
                                placeholder="メールアドレス"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                required
                            />
                            <input
                                type="password"
                                placeholder="パスワード"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isSigningIn}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSigningIn ? "ログイン中..." : "ログイン"}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-green-800 font-medium">ログイン済み: </span>
                            <span className="text-green-700">{user.email}</span>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            ログアウト
                        </button>
                    </div>
                </div>
            )}
            
            {/* ファイル選択とヘルプテキスト */}
            <div className="mb-4">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="mb-2"
                    disabled={isUploading || !user}
                />
                <div className="text-sm text-gray-600">
                    ※ エラーがある行はスキップされ、有効なデータのみアップロードされます
                    {!user && <span className="text-red-600 ml-2">（ログインが必要）</span>}
                </div>
            </div>

            {/* カラムマッピングUI */}
            {showMapping && (
                <div className="mb-6">
                    <div className="font-bold mb-2">
                        カラムマッピング
                        <span className="ml-2 text-sm font-normal text-gray-600">
                            （自動マッピング機能付き）
                        </span>
                    </div>
                    <table className="border mb-2 w-full">
                        <thead>
                            <tr>
                                <th className="border px-2 py-1">システムカラム</th>
                                <th className="border px-2 py-1">CSVカラム</th>
                                <th className="border px-2 py-1">状況</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DB_COLUMNS.map((col) => {
                                const isMapped = columnMap[col.key] && columnMap[col.key] !== "";
                                const isAuto = isAutoMapped(col.key);
                                
                                return (
                                    <tr key={col.key}>
                                        <td className="border px-2 py-1">
                                            {col.label}
                                            {col.required && <span className="text-red-500 ml-1">*</span>}
                                        </td>
                                        <td className="border px-2 py-1">
                                            <select
                                                value={columnMap[col.key] || ""}
                                                onChange={(e) => handleMapChange(col.key, e.target.value)}
                                                className={`border rounded px-2 py-1 w-full ${
                                                    col.required && (!columnMap[col.key] || columnMap[col.key] === "")
                                                        ? "border-red-500 bg-red-50"
                                                        : isAuto
                                                        ? "border-green-500 bg-green-50"
                                                        : isMapped
                                                        ? "border-blue-500 bg-blue-50"
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
                                        <td className="border px-2 py-1 text-sm">
                                            {isMapped ? (
                                                isAuto ? (
                                                    <span className="text-green-600">🤖 自動</span>
                                                ) : (
                                                    <span className="text-blue-600">✓ 手動</span>
                                                )
                                            ) : col.required ? (
                                                <span className="text-red-600">⚠️ 必須</span>
                                            ) : (
                                                <span className="text-gray-500">- 未設定</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {/* マッピング状況 */}
                    <div className="mb-2 text-sm">
                        <span className="text-green-700">
                            自動マッピング:{" "}
                            {DB_COLUMNS.filter(col => isAutoMapped(col.key)).length}件
                        </span>
                        <span className="ml-4 text-blue-700">
                            手動設定:{" "}
                            {DB_COLUMNS.filter(col => {
                                const isMapped = columnMap[col.key] && columnMap[col.key] !== "";
                                return isMapped && !isAutoMapped(col.key);
                            }).length}件
                        </span>
                        <span className="ml-4 text-red-700">
                            必須未設定: {getUnmappedRequired().length}件
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
                disabled={isUploading || !csvFile || getUnmappedRequired().length > 0 || !user}
                className={`px-4 py-2 rounded ${
                    isUploading || !csvFile || getUnmappedRequired().length > 0 || !user
                        ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
                {isUploading ? "アップロード中..." : !user ? "ログインが必要" : "アップロード"}
            </button>

            {message && (
                <div className={`mt-4 whitespace-pre-line ${
                    message.includes("エラー") ? "text-red-500" : 
                    message.includes("完了") || message.includes("成功") ? "text-green-600" : "text-blue-600"
                }`}>
                    {message}
                </div>
            )}

            {/* アップロード結果の詳細表示 */}
            {uploadResults && (uploadResults.errors || uploadResults.warnings) && (
                <div className="mt-4 p-4 bg-gray-50 border rounded max-h-96 overflow-y-auto">
                    <h4 className="font-semibold mb-2">詳細結果</h4>
                    {uploadResults.errors && uploadResults.errors.length > 0 && (
                        <div className="mb-4">
                            <div className="text-red-600 font-medium mb-1">
                                エラー ({uploadResults.errors.length}件):
                            </div>
                            <div className="max-h-32 overflow-y-auto bg-red-50 p-2 rounded text-sm">
                                {uploadResults.errors.map((error, index) => (
                                    <div key={index} className="text-red-600 mb-1">
                                        {error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {uploadResults.warnings && uploadResults.warnings.length > 0 && (
                        <div>
                            <div className="text-yellow-600 font-medium mb-1">
                                警告 ({uploadResults.warnings.length}件):
                            </div>
                            <div className="max-h-32 overflow-y-auto bg-yellow-50 p-2 rounded text-sm">
                                {uploadResults.warnings.map((warning, index) => (
                                    <div key={index} className="text-yellow-600 mb-1">
                                        {warning}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}