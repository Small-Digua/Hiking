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

async function checkItineraries() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 查询所有行程记录，包括已删除的
    console.log('\n🔍 查询所有行程记录...')
    const { rows: itineraries } = await client.query(`
      SELECT i.*, u.email 
      FROM public.itineraries i
      JOIN auth.users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
    `)
    
    if (itineraries.length === 0) {
      console.log('❌ 未找到任何行程记录。')
      return
    }
    
    console.log(`✅ 找到 ${itineraries.length} 条行程记录:`)
    console.log('ID'.padEnd(37), '用户邮箱'.padEnd(30), '路线ID'.padEnd(37), '计划日期'.padEnd(20), '状态'.padEnd(15), '创建时间'.padEnd(25), '删除时间')
    console.log('-'.repeat(200))
    
    itineraries.forEach((itinerary) => {
      console.log(
        itinerary.id.padEnd(37),
        (itinerary.email || 'NA').padEnd(30),
        itinerary.route_id.padEnd(37),
        itinerary.planned_date.padEnd(20),
        itinerary.status.padEnd(15),
        new Date(itinerary.created_at).toLocaleString().padEnd(25),
        itinerary.deleted_at ? new Date(itinerary.deleted_at).toLocaleString() : '未删除'
      )
    })
    
  } catch (err) {
    console.error('❌ 查询失败:', err)
    if (err instanceof Error) {
      console.error('错误详情:', err.message)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

checkItineraries()
