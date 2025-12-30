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

async function checkRoutesSchema() {
  const client = await pool.connect()
  try {
    console.log('🔍 检查 routes 表结构...')
    
    // 查询表结构
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'routes'
      ORDER BY ordinal_position;
    `)
    
    console.log('📋 routes 表字段:')
    result.rows.forEach((row, index) => {
      const nullable = row.is_nullable === 'YES' ? '可空' : '非空'
      const defaultValue = row.column_default ? ` (默认: ${row.column_default})` : ''
      console.log(`${index + 1}. ${row.column_name} - ${row.data_type} - ${nullable}${defaultValue}`)
    })

    // 检查是否有数据
    const countResult = await client.query('SELECT COUNT(*) FROM public.routes')
    console.log(`\n📊 routes 表记录数: ${countResult.rows[0].count}`)

    // 显示前几条记录的字段
    if (parseInt(countResult.rows[0].count) > 0) {
      const dataResult = await client.query('SELECT * FROM public.routes LIMIT 3')
      console.log('\n📝 示例记录:')
      dataResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.name} (${row.id})`)
        console.log(`   - 城市ID: ${row.city_id}`)
        console.log(`   - 难度: ${row.difficulty}`)
        console.log(`   - 距离: ${row.distance_km}km`)
        console.log(`   - 时长: ${row.duration_hours}h`)
        console.log(`   - 状态: ${row.status || '未设置'}`)
        console.log(`   - 描述: ${row.description || '无'}`)
        console.log('')
      })
    }
    
  } catch (err) {
    console.error('❌ 检查失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

checkRoutesSchema()