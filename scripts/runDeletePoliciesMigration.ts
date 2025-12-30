import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.error('❌ 错误: 未找到 DATABASE_URL 环境变量。')
  console.error('请在 .env 文件中配置 DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres')
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
    
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, '../supabase/migrations/20251228_add_delete_policies.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('🚀 开始执行删除策略迁移脚本...')
    await client.query(sql)
    
    console.log('✅ 删除策略迁移成功！')
  } catch (err) {
    console.error('❌ 迁移失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()
