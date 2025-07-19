const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function initEventCodes() {
  const defaultCodes = process.env.DEFAULT_EVENT_CODES?.split(',') || ['EVENT2025', 'DEMO2025']
  
  for (const code of defaultCodes) {
    const { error } = await supabase
      .from('event_codes')
      .upsert({
        code: code.trim(),
        name: `${code.trim()} イベント`,
        description: '自動生成されたイベントコード',
        is_active: true
      }, { onConflict: 'code' })
    
    if (error) {
      console.error(`Error creating event code ${code}:`, error)
    } else {
      console.log(`Event code ${code} created/updated successfully`)
    }
  }
}

initEventCodes()