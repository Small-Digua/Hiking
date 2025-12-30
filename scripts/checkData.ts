import pg from 'pg'
import dotenv from 'dotenv'

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

async function checkData() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 检查各表的数据量
    const tables = ['profiles', 'cities', 'routes', 'itineraries', 'hiking_records', 'media']
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM public.${table}`)
      console.log(`📊 ${table}: ${result.rows[0].count} 条记录`)
    }

    // 检查具体的徒步记录
    console.log('\n🔍 检查徒步记录详情:')
    const recordsResult = await client.query(`
      SELECT hr.id, hr.user_id, hr.completed_at, hr.feelings, 
             i.route_id, r.name as route_name
      FROM public.hiking_records hr
      LEFT JOIN public.itineraries i ON hr.itinerary_id = i.id
      LEFT JOIN public.routes r ON i.route_id = r.id
      ORDER BY hr.completed_at DESC
      LIMIT 10
    `)
    
    if (recordsResult.rows.length > 0) {
      recordsResult.rows.forEach(row => {
        console.log(`- ID: ${row.id}, 路线: ${row.route_name || '未知'}, 完成时间: ${row.completed_at}`)
      })
    } else {
      console.log('❌ 没有找到徒步记录')
    }

    // 检查媒体记录
    console.log('\n🖼️ 检查媒体记录:')
    const mediaResult = await client.query(`
      SELECT m.id, m.record_id, m.type, m.url
      FROM public.media m
      LIMIT 5
    `)
    
    if (mediaResult.rows.length > 0) {
      mediaResult.rows.forEach(row => {
        console.log(`- 媒体ID: ${row.id}, 类型: ${row.type}, 记录ID: ${row.record_id}`)
      })
    } else {
      console.log('❌ 没有找到媒体记录')
    }
    
  } catch (err) {
    console.error('❌ 查询失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

checkData()