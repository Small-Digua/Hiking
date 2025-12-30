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

async function checkFavoritesSimple() {
  console.log('🔍 检查收藏功能...')
  
  try {
    // 1. 直接尝试查询 favorites 表
    console.log('📋 尝试查询 favorites 表...')
    const { data: favorites, error: favoritesError } = await supabaseAdmin
      .from('favorites')
      .select('*')
      .limit(5)

    if (favoritesError) {
      console.error('❌ favorites 表查询失败:', favoritesError)
      console.log('💡 这可能意味着 favorites 表不存在')
      return
    }

    console.log(`✅ favorites 表存在，找到 ${favorites?.length || 0} 条记录`)

    if (favorites && favorites.length > 0) {
      console.log('\n📝 收藏记录示例:')
      favorites.forEach((fav, index) => {
        console.log(`${index + 1}. ID: ${fav.id}`)
        console.log(`   - 用户ID: ${fav.user_id}`)
        console.log(`   - 路线ID: ${fav.route_id}`)
        console.log(`   - 创建时间: ${fav.created_at}`)
        console.log('')
      })
    }

    // 2. 测试关联查询
    console.log('🔗 测试关联查询...')
    const { data: favoritesWithRoutes, error: joinError } = await supabaseAdmin
      .from('favorites')
      .select(`
        *,
        routes (
          id,
          name,
          distance_km,
          duration_hours,
          cities (name)
        )
      `)
      .limit(3)

    if (joinError) {
      console.error('❌ 关联查询失败:', joinError)
    } else {
      console.log(`✅ 关联查询成功，找到 ${favoritesWithRoutes?.length || 0} 条记录`)
      
      if (favoritesWithRoutes && favoritesWithRoutes.length > 0) {
        console.log('\n🔗 关联查询结果示例:')
        favoritesWithRoutes.forEach((fav, index) => {
          const route = fav.routes as any
          const city = route?.cities as any
          console.log(`${index + 1}. 路线: ${route?.name || '未知'}`)
          console.log(`   - 城市: ${city?.name || '未知'}`)
          console.log(`   - 用户: ${fav.user_id}`)
          console.log('')
        })
      }
    }

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error)
  }
}

checkFavoritesSimple()