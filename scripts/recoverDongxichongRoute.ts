import * as pg from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.error('❌ 错误: 未找到 DATABASE_URL 环境变量。')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
})

async function recoverDongxichongRoute() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 1. 查询深圳东西冲的路线记录
    console.log('\n🔍 查询深圳东西冲的路线记录...')
    const { rows: routes } = await client.query(`
      SELECT * FROM public.routes 
      WHERE name ILIKE '%东西冲%' OR name ILIKE '%Dongxichong%' 
      ORDER BY created_at DESC
    `)
    
    if (routes.length === 0) {
      console.log('❌ 未找到深圳东西冲的路线记录。')
      return
    }
    
    console.log(`✅ 找到 ${routes.length} 条路线记录:`)
    routes.forEach((route, index) => {
      console.log(`   ${index + 1}. ${route.name} (ID: ${route.id}, 删除时间: ${route.deleted_at || '未删除'})`)
    })
    
    // 2. 恢复路线记录
    console.log('\n🔄 恢复路线记录...')
    for (const route of routes) {
      if (route.deleted_at) {
        await client.query(`
          UPDATE public.routes 
          SET deleted_at = NULL 
          WHERE id = $1
        `, [route.id])
        console.log(`✅ 已恢复路线: ${route.name}`)
      }
    }
    
    // 3. 查询并恢复相关的行程记录
    const routeIds = routes.map(route => route.id)
    if (routeIds.length > 0) {
      console.log('\n🔍 查询相关的行程记录...')
      const { rows: itineraries } = await client.query(`
        SELECT i.*, r.name as route_name 
        FROM public.itineraries i
        JOIN public.routes r ON i.route_id = r.id
        WHERE i.route_id = ANY($1)
        ORDER BY i.created_at DESC
      `, [routeIds])
      
      if (itineraries.length > 0) {
        console.log(`✅ 找到 ${itineraries.length} 条行程记录:`)
        itineraries.forEach((itinerary, index) => {
          console.log(`   ${index + 1}. ${itinerary.route_name} - ${itinerary.planned_date} (ID: ${itinerary.id}, 删除时间: ${itinerary.deleted_at || '未删除'})`)
        })
        
        console.log('\n🔄 恢复行程记录...')
        for (const itinerary of itineraries) {
          if (itinerary.deleted_at) {
            await client.query(`
              UPDATE public.itineraries 
              SET deleted_at = NULL 
              WHERE id = $1
            `, [itinerary.id])
            console.log(`✅ 已恢复行程: ${itinerary.route_name} - ${itinerary.planned_date}`)
          }
        }
      } else {
        console.log('ℹ️  未找到相关的行程记录。')
      }
      
      // 4. 查询并恢复相关的徒步记录
      console.log('\n🔍 查询相关的徒步记录...')
      const { rows: hikingRecords } = await client.query(`
        SELECT hr.*, r.name as route_name 
        FROM public.hiking_records hr
        JOIN public.routes r ON hr.route_id = r.id
        WHERE hr.route_id = ANY($1)
        ORDER BY hr.created_at DESC
      `, [routeIds])
      
      if (hikingRecords.length > 0) {
        console.log(`✅ 找到 ${hikingRecords.length} 条徒步记录:`)
        hikingRecords.forEach((record, index) => {
          console.log(`   ${index + 1}. ${record.route_name} - ${record.completed_at} (ID: ${record.id})`)
        })
        
        // 徒步记录没有deleted_at字段，不需要恢复
      } else {
        console.log('ℹ️  未找到相关的徒步记录。')
      }
    }
    
    console.log('\n🎉 恢复完成！')
    
  } catch (err) {
    console.error('❌ 恢复失败:', err)
    if (err instanceof Error) {
      console.error('错误详情:', err.message)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

recoverDongxichongRoute()
