import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = 'sb_secret_wZ2MXliTwc0XARfnHQ2Xeg_8DGolHd9'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkHikingRecordData() {
  console.log('🔍 检查徒步记录数据...')
  
  try {
    // 查询所有徒步记录，包含路线信息
    const { data: records, error } = await supabaseAdmin
      .from('hiking_records')
      .select(`
        id,
        user_id,
        completed_at,
        feelings,
        distance,
        duration,
        itineraries (
          routes (
            name,
            distance_km
          )
        )
      `)
      .order('completed_at', { ascending: false })

    if (error) {
      console.error('❌ 查询徒步记录失败:', error)
      return
    }

    console.log(`📊 找到 ${records?.length || 0} 条徒步记录`)

    if (!records || records.length === 0) {
      console.log('ℹ️  暂无徒步记录数据')
      return
    }

    console.log('\n📋 徒步记录详情:')
    records.forEach((record, index) => {
      const routeName = (record.itineraries as any)?.routes?.name || '未知路线'
      const routeDistance = (record.itineraries as any)?.routes?.distance_km || 0
      const userDistance = record.distance || 0
      const duration = record.duration || '未填写'
      
      console.log(`${index + 1}. ${routeName}`)
      console.log(`   - 路线预设距离: ${routeDistance} km`)
      console.log(`   - 用户实际距离: ${userDistance} km`)
      console.log(`   - 用户填写时长: ${duration}`)
      console.log(`   - 完成时间: ${record.completed_at}`)
      console.log(`   - 心得: ${record.feelings || '未填写'}`)
      console.log('')
    })

    // 统计总距离（两种计算方式）
    const totalByRoute = records.reduce((acc, record) => {
      const routeDistance = (record.itineraries as any)?.routes?.distance_km || 0
      return acc + routeDistance
    }, 0)

    const totalByUser = records.reduce((acc, record) => {
      const userDistance = record.distance || 0
      return acc + userDistance
    }, 0)

    console.log('📈 距离统计对比:')
    console.log(`   - 按路线预设距离计算: ${Math.round(totalByRoute * 10) / 10} km`)
    console.log(`   - 按用户实际距离计算: ${Math.round(totalByUser * 10) / 10} km`)
    console.log(`   - 差异: ${Math.round((totalByUser - totalByRoute) * 10) / 10} km`)

  } catch (error) {
    console.error('❌ 检查数据过程中发生错误:', error)
  }
}

checkHikingRecordData()