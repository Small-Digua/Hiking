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
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
})

async function runDeletePoliciesMigration() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 读取删除权限迁移文件
    const sqlPath = path.join(__dirname, '../supabase/migrations/20251228_add_delete_policies.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('🚀 开始执行删除权限迁移...')
    await client.query(sql)
    
    console.log('✅ 删除权限迁移成功！用户现在可以删除自己的数据。')
  } catch (err) {
    console.error('❌ 删除权限迁移失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

runDeletePoliciesMigration()