import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFavoritesQuery() {
  console.log('🧪 测试收藏查询...')
  
  try {
    // 使用当前用户ID测试
    const testUserId = '674c3623-6fca-4b7d-a96c-05e000b1c7ac' // 从之前的输出中获取

    console.log(`👤 测试用户ID: ${testUserId}`)

    // 1. 先查询用户的收藏记录
    console.log('\n📋 查询用户收藏记录...')
    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', testUserId)

    if (favError) {
      console.error('❌ 查询收藏失败:', favError)
      return
    }

    console.log(`✅ 找到 ${favorites?.length || 0} 条收藏记录`)
    favorites?.forEach((fav, index) => {
      console.log(`${index + 1}. 路线ID: ${fav.route_id}, 收藏时间: ${fav.created_at}`)
    })

    if (!favorites || favorites.length === 0) {
      console.log('ℹ️  用户没有收藏记录')
      return
    }

    // 2. 手动查询路线信息
    console.log('\n🔍 手动查询路线信息...')
    const routeIds = favorites.map(f => f.route_id)
    
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select(`
        *,
        cities (name)
      `)
      .in('id', routeIds)

    if (routesError) {
      console.error('❌ 查询路线失败:', routesError)
      return
    }

    console.log(`✅ 找到 ${routes?.length || 0} 条路线信息`)

    // 3. 组合数据
    const combinedData = favorites.map(fav => {
      const route = routes?.find(r => r.id === fav.route_id)
      return {
        ...fav,
        routes: route
      }
    })

    console.log('\n💖 组合后的收藏数据:')
    combinedData.forEach((item, index) => {
      const route = item.routes as any
      const city = route?.cities as any
      console.log(`${index + 1}. ${route?.name || '未知路线'}`)
      console.log(`   - 城市: ${city?.name || '未知城市'}`)
      console.log(`   - 距离: ${route?.distance_km || 0}km`)
      console.log(`   - 时长: ${route?.duration_hours || 0}h`)
      console.log(`   - 收藏时间: ${item.created_at}`)
      console.log('')
    })

    // 4. 测试直接关联查询（可能会失败）
    console.log('🔗 测试直接关联查询...')
    const { data: directQuery, error: directError } = await supabase
      .from('favorites')
      .select(`
        *,
        routes (
          *,
          cities (name)
        )
      `)
      .eq('user_id', testUserId)

    if (directError) {
      console.error('❌ 直接关联查询失败:', directError)
      console.log('💡 这确认了外键关系的问题')
    } else {
      console.log('✅ 直接关联查询成功！')
      console.log(`找到 ${directQuery?.length || 0} 条记录`)
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

testFavoritesQuery()