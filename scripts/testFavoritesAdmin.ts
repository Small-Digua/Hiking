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

async function testFavoritesAdmin() {
  console.log('🔧 使用管理员权限测试收藏功能...')
  
  try {
    // 1. 查询所有收藏记录（绕过RLS）
    console.log('📋 查询所有收藏记录...')
    const { data: allFavorites, error: allError } = await supabaseAdmin
      .from('favorites')
      .select('*')

    if (allError) {
      console.error('❌ 查询所有收藏失败:', allError)
      return
    }

    console.log(`✅ 找到 ${allFavorites?.length || 0} 条收藏记录`)
    allFavorites?.forEach((fav, index) => {
      console.log(`${index + 1}. 用户: ${fav.user_id}, 路线: ${fav.route_id}`)
    })

    if (!allFavorites || allFavorites.length === 0) {
      console.log('ℹ️  数据库中没有任何收藏记录')
      
      // 创建一个测试收藏记录
      console.log('\n🧪 创建测试收藏记录...')
      const testUserId = '674c3623-6fca-4b7d-a96c-05e000b1c7ac'
      const testRouteId = 'df5226a1-d997-48a3-9a1b-22f3c8b741e1'
      
      const { data: newFav, error: insertError } = await supabaseAdmin
        .from('favorites')
        .insert({
          user_id: testUserId,
          route_id: testRouteId
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ 创建测试收藏失败:', insertError)
      } else {
        console.log('✅ 测试收藏创建成功:', newFav)
      }
      
      return
    }

    // 2. 测试手动关联查询
    console.log('\n🔗 测试手动关联查询...')
    for (const fav of allFavorites) {
      console.log(`\n👤 用户 ${fav.user_id} 的收藏:`)
      
      // 查询路线信息
      const { data: route, error: routeError } = await supabaseAdmin
        .from('routes')
        .select(`
          *,
          cities (name)
        `)
        .eq('id', fav.route_id)
        .single()

      if (routeError) {
        console.error(`❌ 查询路线 ${fav.route_id} 失败:`, routeError)
      } else {
        const city = route.cities as any
        console.log(`   - 路线: ${route.name}`)
        console.log(`   - 城市: ${city?.name || '未知'}`)
        console.log(`   - 距离: ${route.distance_km}km`)
        console.log(`   - 收藏时间: ${fav.created_at}`)
      }
    }

    // 3. 测试 dataService 的方法
    console.log('\n🧪 测试 dataService.getUserFavorites...')
    const testUserId = allFavorites[0].user_id
    
    // 模拟用户认证状态
    const { createClient } = await import('@supabase/supabase-js')
    const userSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY!)
    
    // 这里我们无法真正模拟用户登录，但可以直接测试查询
    const { data: userFavs, error: userError } = await supabaseAdmin
      .from('favorites')
      .select(`
        *,
        routes!inner (
          *,
          cities (name)
        )
      `)
      .eq('user_id', testUserId)

    if (userError) {
      console.error('❌ 用户收藏查询失败:', userError)
    } else {
      console.log(`✅ 用户收藏查询成功，找到 ${userFavs?.length || 0} 条记录`)
      userFavs?.forEach((fav, index) => {
        const route = fav.routes as any
        const city = route?.cities as any
        console.log(`${index + 1}. ${route?.name} (${city?.name})`)
      })
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

testFavoritesAdmin()