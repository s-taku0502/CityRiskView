import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        
        // 認証チェック
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' }, 
                { status: 401 }
            )
        }

        const { data: sheltersData } = await request.json()
        
        if (!sheltersData || !Array.isArray(sheltersData)) {
            return NextResponse.json(
                { error: 'Invalid data format' }, 
                { status: 400 }
            )
        }

        // バッチ処理
        const results = {
            success: 0,
            failed: 0,
            errors: [],
            warnings: []
        }

        const batchSize = 50
        for (let i = 0; i < sheltersData.length; i += batchSize) {
            const batch = sheltersData.slice(i, i + batchSize)
            
            // タイムスタンプを追加
            const batchWithMeta = batch.map(item => ({
                ...item,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))

            const { data, error } = await supabase
                .from('shelters')
                .insert(batchWithMeta)
                .select('id')

            if (error) {
                if (error.code === '23505' || error.message.includes('duplicate')) {
                    // 重複エラーの場合は個別処理
                    for (const item of batchWithMeta) {
                        const { error: singleError } = await supabase
                            .from('shelters')
                            .insert(item)

                        if (singleError) {
                            if (singleError.code === '23505') {
                                results.warnings.push(`重複スキップ: ${item.name}`)
                            } else {
                                results.errors.push(`エラー: ${item.name} - ${singleError.message}`)
                                results.failed++
                            }
                        } else {
                            results.success++
                        }
                    }
                } else {
                    results.errors.push(`バッチエラー: ${error.message}`)
                    results.failed += batch.length
                }
            } else {
                results.success += data.length
            }
        }

        return NextResponse.json(results)

    } catch (error) {
        console.error('Bulk insert error:', error)
        return NextResponse.json(
            { error: 'Internal server error' }, 
            { status: 500 }
        )
    }
}