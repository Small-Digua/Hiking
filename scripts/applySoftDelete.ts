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

async function runMigration() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 1. 添加 deleted_at 字段
    console.log('🚀 正在添加 deleted_at 字段...')
    await client.query(`
      ALTER TABLE public.itineraries 
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
    `)
    
    console.log('✅ 数据库结构更新成功！')
  } catch (err) {
    console.error('❌ 迁移失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()
