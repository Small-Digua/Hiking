import dotenv from 'dotenv'
dotenv.config()

import { dataService } from '../src/services/dataService'

async function testFixedFavorites() {
  console.log('🧪 测试修复后的收藏功能...')
  
  try {
    const testUserId = '674c3623-6fca-4b7d-a96c-05e000b1c7ac'
    console.log(`👤 测试用户ID: ${testUserId}`)

    // 测试 getUserFavorites 方法
    console.log('\n📋 调用 dataService.getUserFavorites...')
    const { data: favorites, error } = await dataService.getUserFavorites(testUserId)

    if (error) {
      console.error('❌ 获取收藏失败:', error)
      return
    }

    console.log(`✅ 获取收藏成功，找到 ${favorites?.length || 0} 条记录`)

    if (favorites && favorites.length > 0) {
      console.log('\n💖 收藏详情:')
      favorites.forEach((fav: any, index: number) => {
        const route = fav.routes
        const city = route?.cities
        console.log(`${index + 1}. ${route?.name || '未知路线'}`)
        console.log(`   - 城市: ${city?.name || '未知城市'}`)
        console.log(`   - 距离: ${route?.distance_km || 0}km`)
        console.log(`   - 时长: ${route?.duration_hours || 0}h`)
        console.log(`   - 收藏时间: ${fav.created_at}`)
        console.log('')
      })
    } else {
      console.log('ℹ️  用户没有收藏记录')
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

testFixedFavorites()