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

async function checkHikingRecordsTable() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 查询 hiking_records 表的结构
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'hiking_records'
      ORDER BY ordinal_position
    `)
    
    console.log('📋 hiking_records 表结构:')
    console.table(result.rows)
    
    // 检查是否包含 distance 和 duration 字段
    const hasDistance = result.rows.some(row => row.column_name === 'distance')
    const hasDuration = result.rows.some(row => row.column_name === 'duration')
    
    console.log('\n🔍 检查结果:')
    console.log(`   - distance 列: ${hasDistance ? '✅ 存在' : '❌ 缺失'}`)
    console.log(`   - duration 列: ${hasDuration ? '✅ 存在' : '❌ 缺失'}`)
    
    if (hasDistance && hasDuration) {
      console.log('\n🎉 成功！hiking_records 表包含了所有必要的字段。')
    } else {
      console.log('\n⚠️  警告：hiking_records 表缺少必要的字段。')
    }
  } catch (err) {
    console.error('❌ 查询过程中发生错误:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

checkHikingRecordsTable()
