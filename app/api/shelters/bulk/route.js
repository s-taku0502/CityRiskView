import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        console.log('=== API Route Started ===');
        
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
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return NextResponse.json(
                { error: 'Invalid JSON format' }, 
                { status: 400 }
            );
        }

        const { data: sheltersData } = requestData;
        
        if (!sheltersData || !Array.isArray(sheltersData)) {
            return NextResponse.json(
                { error: 'Invalid data format - expected array' }, 
                { status: 400 }
            );
        }

        console.log(`Processing ${sheltersData.length} records for user: ${user?.email}`);

        // バッチ処理
        const results = {
            success: 0,
            failed: 0,
            errors: [],
            warnings: []
        };

        const batchSize = 25; // バッチサイズを小さくして安定性を向上
        const totalBatches = Math.ceil(sheltersData.length / batchSize);
        
        for (let i = 0; i < sheltersData.length; i += batchSize) {
            const currentBatch = Math.floor(i / batchSize) + 1;
            console.log(`Processing batch ${currentBatch}/${totalBatches}`);
            
            // リクエストが中断されているかチェック
            if (request.signal?.aborted) {
                results.errors.push('処理が中断されました');
                break;
            }

            const batch = sheltersData.slice(i, i + batchSize);
            
            // タイムスタンプを追加
            const batchWithMeta = batch.map(item => ({
                ...item,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            try {
                // まず通常のinsertを試行
                const { data, error } = await supabase
                    .from('shelters')
                    .insert(batchWithMeta)
                    .select('id');

                if (error) {
                    console.error(`Batch ${currentBatch} error:`, error);
                    
                    if (error.code === '23505' || error.message.includes('duplicate')) {
                        // 重複エラーの場合は個別処理
                        console.log(`Handling duplicates in batch ${currentBatch} individually...`);
                        
                        for (const [itemIndex, item] of batchWithMeta.entries()) {
                            // 中断チェック
                            if (request.signal?.aborted) {
                                results.errors.push('処理が中断されました');
                                return NextResponse.json(results);
                            }

                            try {
                                const { error: singleError } = await supabase
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
                            
                            // 個別処理間の短い待機
                            await new Promise(resolve => setTimeout(resolve, 10));
                        }
                    } else {
                        results.errors.push(`バッチ${currentBatch}エラー: ${error.message}`);
                        results.failed += batch.length;
                    }
                } else {
                    results.success += data.length;
                    console.log(`Batch ${currentBatch} completed: ${data.length} records inserted`);
                }
            } catch (batchError) {
                console.error(`Batch ${currentBatch} processing error:`, batchError);
                results.errors.push(`バッチ${currentBatch}処理エラー: ${batchError.message}`);
                results.failed += batch.length;
            }

            // バッチ間の待機（負荷軽減）
            if (i < sheltersData.length - batchSize) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log('Processing completed:', results);
        return NextResponse.json(results);

    } catch (error) {
        console.error('Bulk insert error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message }, 
            { status: 500 }
        );
    }
}