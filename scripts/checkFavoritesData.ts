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

async function checkFavoritesData() {
  console.log('🔍 检查收藏数据...')
  
  try {
    // 1. 检查 favorites 表是否存在
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'favorites')

    if (tablesError) {
      console.error('❌ 查询表信息失败:', tablesError)
      return
    }

    if (!tables || tables.length === 0) {
      console.log('❌ favorites 表不存在！需要创建该表。')
      return
    }

    console.log('✅ favorites 表存在')

    // 2. 检查表结构
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'favorites')
      .order('ordinal_position')

    if (columnsError) {
      console.error('❌ 查询表结构失败:', columnsError)
      return
    }

    console.log('\n📋 favorites 表结构:')
    columns?.forEach((col, index) => {
      const nullable = col.is_nullable === 'YES' ? '可空' : '非空'
      console.log(`${index + 1}. ${col.column_name} - ${col.data_type} - ${nullable}`)
    })

    // 3. 检查收藏数据
    const { data: favorites, error: favoritesError } = await supabaseAdmin
      .from('favorites')
      .select(`
        id,
        user_id,
        route_id,
        created_at,
        routes (
          id,
          name,
          distance_km,
          duration_hours,
          cities (name)
        )
      `)
      .order('created_at', { ascending: false })

    if (favoritesError) {
      console.error('❌ 查询收藏数据失败:', favoritesError)
      return
    }

    console.log(`\n📊 收藏记录总数: ${favorites?.length || 0}`)

    if (favorites && favorites.length > 0) {
      console.log('\n💖 收藏记录详情:')
      favorites.forEach((fav, index) => {
        const route = fav.routes as any
        const city = route?.cities as any
        console.log(`${index + 1}. 用户ID: ${fav.user_id}`)
        console.log(`   - 路线: ${route?.name || '未知路线'}`)
        console.log(`   - 城市: ${city?.name || '未知城市'}`)
        console.log(`   - 距离: ${route?.distance_km || 0}km`)
        console.log(`   - 时长: ${route?.duration_hours || 0}h`)
        console.log(`   - 收藏时间: ${fav.created_at}`)
        console.log('')
      })

      // 4. 按用户分组统计
      const userStats = favorites.reduce((acc, fav) => {
        acc[fav.user_id] = (acc[fav.user_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      console.log('👥 用户收藏统计:')
      Object.entries(userStats).forEach(([userId, count]) => {
        console.log(`   - 用户 ${userId}: ${count} 个收藏`)
      })
    } else {
      console.log('ℹ️  暂无收藏记录')
    }

  } catch (error) {
    console.error('❌ 检查收藏数据过程中发生错误:', error)
  }
}

checkFavoritesData()