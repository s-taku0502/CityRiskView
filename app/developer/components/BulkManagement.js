"use client";

import React, { useState, useEffect, useRef } from "react";
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

    // 中断機能用のref
    const abortControllerRef = useRef(null);
    const [isAborting, setIsAborting] = useState(false);

    // プログレスバー用のstate追加
    const [progressInfo, setProgressInfo] = useState({
        current: 0,
        total: 0,
        percentage: 0,
        message: ''
    });

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
            setMessage("データベースに直接アップロード中...");
            
            // 認証チェック
            if (!user) {
                throw new Error("ログインが必要です。");
            }

            // 現在のセッションを確認
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log('Current session check:', {
                hasSession: !!session,
                hasUser: !!session?.user,
                // userEmail: session?.user?.email,
                sessionError: sessionError?.message
            });
            
            if (sessionError) {
                console.error('Session error:', sessionError);
                throw new Error("セッションエラーが発生しました。再ログインしてください。");
            }
            
            if (!session) {
                throw new Error("セッションが無効です。再ログインしてください。");
            }

            // AbortControllerを作成
            abortControllerRef.current = new AbortController();
            
            console.log('Starting direct Supabase upload:', { 
                recordCount: data.length, 
                // user: user.email
            });

            // プログレス初期化
            setProgressInfo({
                current: 0,
                total: data.length,
                percentage: 0,
                message: '処理開始...'
            });

            const results = {
                success: 0,
                failed: 0,
                errors: [],
                warnings: []
            };

            const batchSize = 25;
            const totalBatches = Math.ceil(data.length / batchSize);
            
            for (let i = 0; i < data.length; i += batchSize) {
                const currentBatch = Math.floor(i / batchSize) + 1;
                
                // 中断チェック
                if (abortControllerRef.current.signal.aborted) {
                    setMessage("アップロードが中断されました。");
                    results.errors.push('処理が中断されました');
                    break;
                }

                const batch = data.slice(i, i + batchSize);
                
                // 進捗更新
                setProgressInfo({
                    current: i,
                    total: data.length,
                    percentage: Math.round((i / data.length) * 100),
                    message: `バッチ ${currentBatch}/${totalBatches} を処理中...`
                });
                setMessage(`進捗: ${Math.round((i / data.length) * 100)}% - バッチ ${currentBatch}/${totalBatches} を処理中...`);
                
                // タイムスタンプを追加
                const batchWithMeta = batch.map(item => ({
                    ...item,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                try {
                    // 直接Supabaseにinsert
                    const { data: insertedData, error } = await supabase
                        .from('shelters')
                        .insert(batchWithMeta)
                        .select('id');

                    if (error) {                        
                        if (error.code === '23505' || error.message.includes('duplicate')) {
                            // 重複エラーの場合は個別処理                            
                            for (const [itemIndex, item] of batchWithMeta.entries()) {
                                // 中断チェック
                                if (abortControllerRef.current.signal.aborted) {
                                    results.errors.push('処理が中断されました');
                                    break;
                                }

                                try {
                                    const { data: singleData, error: singleError } = await supabase
                                        .from('shelters')
                                        .insert(item)
                                        .select('id');

                                    if (singleError) {
                                        if (singleError.code === '23505') {
                                            results.warnings.push(`重複スキップ: ${item.name || `行${i + itemIndex + 1}`}`);
                                        } else {
                                            results.errors.push(`エラー: ${item.name || `行${i + itemIndex + 1}`} - ${singleError.message}`);
                                            results.failed++;
                                        }
                                    } else {
                                        results.success++;
                                    }
                                } catch (itemError) {
                                    results.errors.push(`個別処理エラー: ${item.name || `行${i + itemIndex + 1}`} - ${itemError.message}`);
                                    results.failed++;
                                }
                                
                                // 個別処理の進捗更新
                                const itemProgress = i + itemIndex + 1;
                                if (itemProgress % 5 === 0) { // 5件ごとに更新
                                    setProgressInfo({
                                        current: itemProgress,
                                        total: data.length,
                                        percentage: Math.round((itemProgress / data.length) * 100),
                                        message: `個別処理中... (${results.success}件成功, ${results.warnings.length}件重複スキップ)`
                                    });
                                }
                                
                                // 個別処理間の短い待機
                                await new Promise(resolve => setTimeout(resolve, 10));
                            }
                        } else {
                            results.errors.push(`バッチ${currentBatch}エラー: ${error.message}`);
                            results.failed += batch.length;
                        }
                    } else {
                        results.success += insertedData.length;
                    }
                } catch (batchError) {
                    console.error(`Batch ${currentBatch} processing error:`, batchError);
                    results.errors.push(`バッチ${currentBatch}処理エラー: ${batchError.message}`);
                    results.failed += batch.length;
                }

                // バッチ間の待機（負荷軽減）
                if (i < data.length - batchSize) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // 完了
            setProgressInfo({
                current: results.success + results.failed,
                total: results.success + results.failed + results.warnings.length,
                percentage: 100,
                message: 'アップロード完了'
            });
            
            setMessage(`処理完了: ${results.success}件成功, ${results.failed}件失敗, ${results.warnings.length}件重複スキップ`);

            return {
                success: results.success,
                failed: results.failed,
                errors: results.errors,
                warnings: results.warnings,
                message: `処理完了: ${results.success}件成功, ${results.failed}件失敗`
            };

        } catch (error) {
            if (error.name === 'AbortError' || error.message.includes('中断')) {
                setMessage("アップロードが中断されました。");
                setProgressInfo({
                    current: 0,
                    total: 0,
                    percentage: 0,
                    message: '中断されました'
                });
                return {
                    success: 0,
                    failed: 0,
                    errors: ['アップロードが中断されました'],
                    warnings: [],
                    message: 'アップロードが中断されました'
                };
            }
            console.error('Upload error:', error);
            throw new Error(`アップロードエラー: ${error.message}`);
        } finally {
            abortControllerRef.current = null;
        }
    };

    // アップロード中断処理
    const handleAbort = () => {
        if (abortControllerRef.current && isUploading) {
            setIsAborting(true);
            setMessage("アップロードを中断しています...");
            
            // APIリクエストを中断
            abortControllerRef.current.abort();
            
            // 少し待ってから状態をリセット
            setTimeout(() => {
                setIsUploading(false);
                setIsAborting(false);
                setMessage("アップロードが中断されました。");
            }, 1000);
        }
    };

    // handleUpload関数を中断対応版に修正
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
        setIsAborting(false);
        setMessage("");
        setUploadResults(null);
        abortControllerRef.current = null;

        try {
            // CSVデータを解析
            setMessage("CSVデータを解析中...");
            const parseResult = await parseCSVData();
            
            // 中断チェック
            if (isAborting) {
                setMessage("処理が中断されました。");
                return;
            }
            
            if (parseResult.errors.length > 0) {
                setMessage(
                    `データ解析完了:\n` +
                    `総行数: ${parseResult.totalRows}行\n` +
                    `有効: ${parseResult.validRows}行\n` +
                    `スキップ: ${parseResult.skippedRows}行\n` +
                    `エラー: ${parseResult.errors.length}件\n\n` +
                    `有効なデータをサーバーにアップロード中...`
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
            
            // 中断チェック
            if (isAborting) {
                setMessage("処理が中断されました。");
                return;
            }
            
            setMessage(`${parseResult.validRows}件の有効なデータをサーバーにアップロード中...`);
            
            // APIエンドポイント経由でアップロード
            const result = await uploadData(parseResult.data);
            
            // 中断された場合の処理
            if (result.message === 'アップロードが中断されました') {
                setUploadResults(result);
                return;
            }
            
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
            if (error.message.includes('中断')) {
                setMessage("アップロードが中断されました。");
            } else {
                console.error('Upload error:', error);
                setMessage(`エラー: ${error.message}`);
            }
        } finally {
            setIsUploading(false);
            setIsAborting(false);
            abortControllerRef.current = null;
        }
    };

    // コンポーネントがアンマウントされる時の cleanup
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

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
                name: `テスト避難所_${Date.now()}`, // 重複を避けるためタイムスタンプを追加
                address: "テスト住所123",
                latitude: 35.6762,
                longitude: 139.6503,
                capacity: 100,
                current_people: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // 直接Supabaseに挿入
            const { data, error } = await supabase
                .from('shelters')
                .insert(testData)
                .select('*');
            
            if (error) {
                console.error('Test insert error:', error);
                setMessage(`テスト挿入エラー: ${error.message}`);
            } else {
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

    // デバッグ用の関数を追加
    const checkDatabaseStatus = async () => {
        try {
            setMessage("データベースの現在の状況を確認中...");
            
            // 現在のレコード数を確認
            const { data: countData, error: countError } = await supabase
                .from('shelters')
                .select('id', { count: 'exact', head: true });
            
            if (countError) {
                console.error('Count error:', countError);
                setMessage(`カウントエラー: ${countError.message}`);
                return;
            }
            
            // 最新のレコードを5件取得
            const { data: latestData, error: latestError } = await supabase
                .from('shelters')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (latestError) {
                console.error('Latest data error:', latestError);
                setMessage(`データ取得エラー: ${latestError.message}`);
                return;
            }
            
            const totalCount = countData?.length || 0;
            console.log('Database status:', {
                totalCount,
                latestRecords: latestData
            });
            
            setMessage(
                `データベース状況:\n` +
                `総レコード数: ${totalCount}件\n` +
                `最新レコード: ${latestData?.length || 0}件取得\n` +
                `最新作成日時: ${latestData?.[0]?.created_at || 'なし'}`
            );
            
        } catch (error) {
            console.error('Database status check failed:', error);
            setMessage(`データベース状況確認失敗: ${error.message}`);
        }
    };

    // さらにサンプルデータを手動で作成してテストする関数
    const testManualInsert = async () => {
        if (!user) {
            setMessage("ログインが必要です。");
            return;
        }

        try {
            setMessage("手動テストデータでアップロード中...");
            
            // 確実に動作するテストデータを作成
            const manualTestData = [
                {
                    type: "指定避難所",
                    name: `テスト避難所_${Date.now()}`,
                    address: "東京都港区赤坂1-1-1",
                    latitude: 35.6762,
                    longitude: 139.6503,
                    capacity: 100,
                    current_people: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
                        
            // 直接Supabaseに挿入
            const { data, error } = await supabase
                .from('shelters')
                .insert(manualTestData)
                .select('id');
            
            if (error) {
                console.error('Manual test error:', error);
                setMessage(
                    `手動テスト完了（エラーあり）:\n` +
                    `成功: 0件\n` +
                    `失敗: 1件\n` +
                    `エラー詳細: ${error.message}`
                );
            } else {
                console.log('Manual test success:', data);
                setMessage(
                    `手動テスト完了:\n` +
                    `成功: ${data.length}件\n` +
                    `失敗: 0件`
                );
                
                // テストデータを削除
                if (data[0]?.id) {
                    await supabase
                        .from('shelters')
                        .delete()
                        .eq('id', data[0].id);
                    setMessage(
                        `手動テスト完了（テストデータは削除済み）:\n` +
                        `成功: ${data.length}件\n` +
                        `失敗: 0件`
                    );
                }
            }
            
            // 結果後にDBの状況を確認
            setTimeout(checkDatabaseStatus, 1000);
            
        } catch (error) {
            console.error('Manual test error:', error);
            setMessage(`手動テストエラー: ${error.message}`);
        }
    };

    if (isLoading) {
        return <div>読み込み中...</div>;
    }

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">一括インポート</h3>
            
            {/* デバッグ用ツール（更新版） */}
            {user && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-sm text-blue-800 mb-2">開発者ツール:</div>
                    <div className="grid grid-cols-3 gap-2">
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
                            テスト挿入（直接）
                        </button>
                        <button
                            onClick={checkDatabaseStatus}
                            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                            DB状況確認
                        </button>
                        <button
                            onClick={testManualInsert}
                            disabled={isUploading}
                            className={`px-3 py-1 text-sm rounded ${
                                isUploading
                                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                                    : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                        >
                            手動テスト（直接）
                        </button>
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                        ※ RLSポリシー追加により、認証されたユーザーは直接データベースに書き込み可能<br/>
                        ※ APIエンドポイントは不要になりました
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
            
            {/* ファイル選択とヘルプテキスト（改良版 - 枠と影付き） */}
            <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm hover:shadow-md">
                    <div className="text-center">
                        {/* アイコンとタイトル */}
                        <div className="mb-4">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">CSVファイルを選択</h4>
                        </div>
                        
                        {/* ファイル選択ボタン */}
                        <div className="mb-4">
                            <label className={`cursor-pointer inline-flex items-center px-6 py-3 border-2 border-transparent text-base font-medium rounded-md text-white transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                                !user 
                                    ? "bg-gray-400 cursor-not-allowed shadow-none transform-none" 
                                    : isUploading 
                                    ? "bg-gray-400 cursor-not-allowed shadow-none transform-none"
                                    : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            }`}>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                </svg>
                                {csvFile ? "ファイルを変更" : "CSVファイルを選択"}
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                    disabled={isUploading || !user}
                                />
                            </label>
                        </div>
                        
                        {/* 選択されたファイル情報 */}
                        {csvFile && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
                                <div className="flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <span className="text-blue-700 font-medium">{csvFile.name}</span>
                                    <span className="text-blue-500 ml-2">({(csvFile.size / 1024).toFixed(1)} KB)</span>
                                </div>
                            </div>
                        )}
                        
                        {/* ヘルプテキスト */}
                        <div className="text-sm text-gray-600 space-y-2">
                            {!user ? (
                                <div className="text-red-600 font-medium">
                                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.148 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                    </svg>
                                    ログインが必要です
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center">
                                        <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        <span>CSV形式のファイルのみ対応</span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span>エラー行は自動でスキップされます</span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                        </svg>
                                        <span>自動マッピング機能でカラムを推測</span>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {/* ファイル形式の例 */}
                        {!csvFile && (
                            <div className="mt-4 p-3 bg-gray-100 rounded-md shadow-inner">
                                <div className="text-xs text-gray-600 text-left">
                                    <div className="font-medium mb-1">期待されるCSV形式例:</div>
                                    <div className="font-mono bg-white p-2 rounded border text-xs overflow-x-auto shadow-sm">
                                        施設名,住所,緯度,経度,収容人数<br/>
                                        〇〇小学校,東京都...,35.1234,139.5678,500<br/>
                                        △△公民館,神奈川県...,35.4321,139.8765,200
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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
                                                    <span className="text-green-600">自動</span>
                                                ) : (
                                                    <span className="text-blue-600">手動</span>
                                                )
                                            ) : col.required ? (
                                                <span className="text-red-600">必須</span>
                                            ) : (
                                                <span className="text-gray-500">未設定</span>
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
                                必須項目のマッピングが未設定です
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

            {/* アップロードボタンと中断ボタン */}
            <div className="flex space-x-3 mb-4">
                <button
                    onClick={handleUpload}
                    disabled={isUploading || !csvFile || getUnmappedRequired().length > 0 || !user}
                    className={`px-4 py-2 rounded ${
                        isUploading || !csvFile || getUnmappedRequired().length > 0 || !user
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                    {isUploading ? "データベースにアップロード中..." : !user ? "ログインが必要" : "アップロード（直接）"}
                </button>

                {/* 中断ボタン */}
                {isUploading && (
                    <button
                        onClick={handleAbort}
                        disabled={isAborting}
                        className={`px-4 py-2 rounded ${
                            isAborting
                                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                                : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                    >
                        {isAborting ? "中断中..." : "インポート中断"}
                    </button>
                )}
            </div>

            {/* プログレスバー（改良版） */}
            {isUploading && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-blue-800">
                            アップロード実行中...
                        </span>
                        <span className="text-sm text-blue-600">
                            {isAborting ? "中断処理中" : `${progressInfo.percentage}%`}
                        </span>
                    </div>
                    
                    {/* プログレスバー */}
                    <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
                        <div 
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progressInfo.percentage}%` }}
                        ></div>
                    </div>
                    
                    {/* 詳細情報 */}
                    <div className="flex justify-between text-xs text-blue-600">
                        <span>{progressInfo.message}</span>
                        <span>
                            {progressInfo.current} / {progressInfo.total} 件
                        </span>
                    </div>
                    
                    {/* 処理時間の推定 */}
                    {progressInfo.percentage > 0 && (
                        <div className="text-xs text-blue-500 mt-1">
                            ※ 大量データの場合、処理に時間がかかることがあります
                        </div>
                    )}
                </div>
            )}

            {message && (
                <div className={`mt-4 whitespace-pre-line ${
                    message.includes("エラー") || message.includes("中断") ? "text-red-500" : 
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