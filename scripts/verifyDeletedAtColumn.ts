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

async function verifyDeletedAtColumn() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 检查 itineraries 表的结构
    console.log('\n📋 检查 itineraries 表结构:')
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'itineraries' AND table_schema = 'public'
    `)
    
    console.log('列名 | 数据类型')
    console.log('--- | ---')
    columns.forEach(col => {
      console.log(`${col.column_name} | ${col.data_type}`)
    })
    
    // 检查 deleted_at 列是否存在
    const hasDeletedAt = columns.some(col => col.column_name === 'deleted_at')
    console.log(`\n✅ deleted_at 列存在: ${hasDeletedAt}`)
    
    // 测试查询是否能正常执行
    console.log('\n🔍 测试查询 itineraries 表:')
    const { rows: itineraries } = await client.query(`
      SELECT * FROM public.itineraries 
      WHERE deleted_at IS NULL 
      LIMIT 5
    `)
    console.log(`📊 查询成功，返回 ${itineraries.length} 条记录`)
    
  } catch (err) {
    console.error('❌ 验证失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

verifyDeletedAtColumn()
