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

async function checkAllRoutes() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 查询所有路线记录
    console.log('\n🔍 查询所有路线记录...')
    const { rows: routes } = await client.query(`
      SELECT id, name, city_id, created_at 
      FROM public.routes 
      ORDER BY created_at DESC
    `)
    
    if (routes.length === 0) {
      console.log('❌ 未找到任何路线记录。')
      return
    }
    
    console.log(`✅ 找到 ${routes.length} 条路线记录:`)
    console.log('ID'.padEnd(37), '名称'.padEnd(30), '城市ID'.padEnd(37), '创建时间')
    console.log('-'.repeat(140))
    
    routes.forEach((route) => {
      console.log(
        route.id.padEnd(37),
        route.name.padEnd(30),
        route.city_id.padEnd(37),
        new Date(route.created_at).toLocaleString()
      )
    })
    
    // 查询所有城市记录，帮助识别深圳的城市ID
    console.log('\n\n🌆 查询所有城市记录...')
    const { rows: cities } = await client.query(`
      SELECT * FROM public.cities 
      ORDER BY name
    `)
    
    console.log(`✅ 找到 ${cities.length} 条城市记录:`)
    cities.forEach((city) => {
      console.log(`${city.name} (ID: ${city.id}) - ${city.district || '无区域'}`)
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

checkAllRoutes()
