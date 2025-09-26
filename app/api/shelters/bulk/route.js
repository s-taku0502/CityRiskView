import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
    console.log('=== API Route Started ===');
    
    try {
        // cookiesを取得
        const cookieStore = cookies()
        console.log('Cookies available:', cookieStore.getAll().map(c => c.name));
        
        // Supabaseクライアントを作成
        const supabase = createRouteHandlerClient({ 
            cookies: () => cookieStore 
        })
        
        // セッション情報を取得
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('Session check:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email,
            sessionError: sessionError?.message
        });
        
        if (sessionError) {
            console.error('Session error:', sessionError)
            return NextResponse.json(
                { error: 'Session error', details: sessionError.message }, 
                { status: 401 }
            )
        }

        if (!session || !session.user) {
            console.error('No session or user found')
            
            // 代替手段: ヘッダーからAuthorizationトークンを確認
            const authHeader = request.headers.get('authorization');
            console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
            
            if (authHeader) {
                const token = authHeader.replace('Bearer ', '');
                try {
                    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
                    
                    if (user && !userError) {
                        console.log('User authenticated via header:', user.email);
                        // ユーザーが認証された場合、処理を続行
                    } else {
                        console.error('Token verification failed:', userError);
                        return NextResponse.json(
                            { error: 'Invalid token' }, 
                            { status: 401 }
                        );
                    }
                } catch (tokenError) {
                    console.error('Token processing error:', tokenError);
                    return NextResponse.json(
                        { error: 'Token processing failed' }, 
                        { status: 401 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: 'Unauthorized - Please login' }, 
                    { status: 401 }
                );
            }
        }

        const user = session?.user;
        console.log('Authenticated user:', user?.email);

        // リクエストボディの解析
        let requestData;
        try {
            requestData = await request.json();
            console.log('Request data parsed successfully, keys:', Object.keys(requestData));
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return NextResponse.json(
                { error: 'Invalid JSON format', details: parseError.message }, 
                { status: 400 }
            );
        }

        const { data: sheltersData, streaming = false, debug = false } = requestData;
        
        if (!sheltersData || !Array.isArray(sheltersData)) {
            console.error('Invalid data format:', {
                hasSheltersData: !!sheltersData,
                isArray: Array.isArray(sheltersData),
                dataType: typeof sheltersData
            });
            return NextResponse.json(
                { error: 'Invalid data format - expected array' }, 
                { status: 400 }
            );
        }

        console.log(`Processing ${sheltersData.length} records for user: ${user?.email}`);
        console.log('Processing mode:', { streaming, debug });

        // ストリーミングレスポンスの場合
        if (streaming) {
            console.log('Starting streaming response...');
            const encoder = new TextEncoder();
            
            const stream = new ReadableStream({
                start(controller) {
                    processWithProgress(controller, encoder, supabase, sheltersData, request, debug)
                        .catch(error => {
                            console.error('Streaming process error:', error);
                            const errorMessage = `data: ${JSON.stringify({
                                type: 'error',
                                message: `ストリーミングエラー: ${error.message}`
                            })}\n\n`;
                            controller.enqueue(encoder.encode(errorMessage));
                            controller.close();
                        });
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Transfer-Encoding': 'chunked',
                },
            });
        }

        // 通常のレスポンス（既存のコード）
        console.log('Starting normal processing...');
        const results = await processData(supabase, sheltersData, request, debug);
        console.log('Processing completed:', results);
        return NextResponse.json(results);

    } catch (error) {
        console.error('=== CRITICAL API ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // エラーの詳細分析
        if (error.message.includes('fetch')) {
            console.error('Network/Fetch related error detected');
        } else if (error.message.includes('auth')) {
            console.error('Authentication related error detected');
        } else if (error.message.includes('database') || error.message.includes('supabase')) {
            console.error('Database related error detected');
        }
        
        return NextResponse.json(
            { 
                error: 'Internal server error', 
                details: error.message,
                type: error.constructor.name,
                timestamp: new Date().toISOString()
            }, 
            { status: 500 }
        );
    }
}

// ストリーミング処理関数（エラーハンドリング強化）
async function processWithProgress(controller, encoder, supabase, sheltersData, request, debug = false) {
    console.log('=== processWithProgress started ===');
    
    const results = {
        success: 0,
        failed: 0,
        errors: [],
        warnings: []
    };

    const batchSize = debug ? 1 : 25;
    const totalBatches = Math.ceil(sheltersData.length / batchSize);
    
    // 進捗情報を送信する関数
    const sendProgress = (progress) => {
        try {
            const message = `data: ${JSON.stringify(progress)}\n\n`;
            controller.enqueue(encoder.encode(message));
        } catch (sendError) {
            console.error('Progress send error:', sendError);
        }
    };

    // 初期進捗
    sendProgress({
        type: 'progress',
        current: 0,
        total: sheltersData.length,
        percentage: 0,
        message: '処理開始...'
    });

    try {
        for (let i = 0; i < sheltersData.length; i += batchSize) {
            const currentBatch = Math.floor(i / batchSize) + 1;
            console.log(`Processing batch ${currentBatch}/${totalBatches}`);
            
            try {
                // 中断チェック
                if (request.signal?.aborted) {
                    sendProgress({
                        type: 'error',
                        message: '処理が中断されました'
                    });
                    results.errors.push('処理が中断されました');
                    break;
                }

                const batch = sheltersData.slice(i, i + batchSize);
                
                // 進捗更新
                sendProgress({
                    type: 'progress',
                    current: i,
                    total: sheltersData.length,
                    percentage: Math.round((i / sheltersData.length) * 100),
                    message: `バッチ ${currentBatch}/${totalBatches} を処理中...`
                });
                
                // バッチ処理
                const batchResult = await processBatch(supabase, batch, i, currentBatch, debug);
                
                results.success += batchResult.success;
                results.failed += batchResult.failed;
                results.errors.push(...batchResult.errors);
                results.warnings.push(...batchResult.warnings);

                // バッチ間の待機
                if (i < sheltersData.length - batchSize) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
            } catch (batchError) {
                console.error(`Batch ${currentBatch} processing error:`, batchError);
                results.errors.push(`バッチ${currentBatch}処理エラー: ${batchError.message}`);
                results.failed += batchSize;
            }
        }

        // 完了通知
        sendProgress({
            type: 'complete',
            results: results,
            message: `処理完了: ${results.success}件成功, ${results.failed}件失敗, ${results.warnings.length}件重複スキップ`
        });

    } catch (error) {
        console.error('processWithProgress error:', error);
        sendProgress({
            type: 'error',
            message: `処理エラー: ${error.message}`
        });
    } finally {
        console.log('=== processWithProgress completed ===');
        controller.close();
    }
}

// バッチ処理関数を分離
async function processBatch(supabase, batch, startIndex, batchNumber, debug = false) {
    const batchResult = {
        success: 0,
        failed: 0,
        errors: [],
        warnings: []
    };

    try {
        // タイムスタンプを追加
        const batchWithMeta = batch.map(item => ({
            ...item,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));

        console.log(`Batch ${batchNumber} sample data:`, batchWithMeta[0]);

        // まず通常のinsertを試行
        const { data, error } = await supabase
            .from('shelters')
            .insert(batchWithMeta)
            .select('id');

        if (error) {
            console.error(`Batch ${batchNumber} error:`, error);
            
            if (error.code === '23505' || error.message.includes('duplicate')) {
                // 重複エラーの場合は個別処理
                console.log(`Handling duplicates in batch ${batchNumber} individually...`);
                
                for (const [itemIndex, item] of batchWithMeta.entries()) {
                    try {
                        const { error: singleError } = await supabase
                            .from('shelters')
                            .insert(item)
                            .select('id');

                        if (singleError) {
                            if (singleError.code === '23505') {
                                batchResult.warnings.push(`重複スキップ: ${item.name || `行${startIndex + itemIndex + 1}`}`);
                            } else {
                                batchResult.errors.push(`エラー: ${item.name || `行${startIndex + itemIndex + 1}`} - ${singleError.message}`);
                                batchResult.failed++;
                            }
                        } else {
                            batchResult.success++;
                        }
                    } catch (itemError) {
                        batchResult.errors.push(`個別処理エラー: ${item.name || `行${startIndex + itemIndex + 1}`} - ${itemError.message}`);
                        batchResult.failed++;
                    }
                    
                    // 個別処理間の短い待機
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            } else {
                batchResult.errors.push(`バッチ${batchNumber}エラー: ${error.message}`);
                batchResult.failed += batch.length;
            }
        } else {
            batchResult.success += data.length;
            console.log(`Batch ${batchNumber} completed: ${data.length} records inserted`);
        }
    } catch (batchError) {
        console.error(`Batch ${batchNumber} processing error:`, batchError);
        batchResult.errors.push(`バッチ${batchNumber}処理エラー: ${batchError.message}`);
        batchResult.failed += batch.length;
    }

    return batchResult;
}

// 通常の処理関数（エラーハンドリング強化）
async function processData(supabase, sheltersData, request, debug = false) {
    console.log('=== processData started ===');
    console.log('Input data count:', sheltersData.length);
    console.log('Debug mode:', debug);
    console.log('Sample input data:', sheltersData[0]);
    
    const results = {
        success: 0,
        failed: 0,
        errors: [],
        warnings: []
    };

    try {
        const batchSize = debug ? 1 : 25;
        const totalBatches = Math.ceil(sheltersData.length / batchSize);
        
        for (let i = 0; i < sheltersData.length; i += batchSize) {
            const currentBatch = Math.floor(i / batchSize) + 1;
            console.log(`Processing batch ${currentBatch}/${totalBatches}`);
            
            try {
                // リクエストが中断されているかチェック
                if (request.signal?.aborted) {
                    results.errors.push('処理が中断されました');
                    break;
                }

                const batch = sheltersData.slice(i, i + batchSize);
                const batchResult = await processBatch(supabase, batch, i, currentBatch, debug);
                
                results.success += batchResult.success;
                results.failed += batchResult.failed;
                results.errors.push(...batchResult.errors);
                results.warnings.push(...batchResult.warnings);

                // バッチ間の待機（負荷軽減）
                if (i < sheltersData.length - batchSize) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
            } catch (batchError) {
                console.error(`Batch ${currentBatch} processing error:`, batchError);
                results.errors.push(`バッチ${currentBatch}処理エラー: ${batchError.message}`);
                results.failed += batchSize;
            }
        }
    } catch (error) {
        console.error('processData error:', error);
        results.errors.push(`処理エラー: ${error.message}`);
    }

    console.log('=== processData completed ===');
    console.log('Final results:', results);
    return results;
}