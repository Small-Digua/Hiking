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

async function runRoutesImagesMigration() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 读取路线图片字段迁移文件
    const sqlPath = path.join(__dirname, '../supabase/migrations/20251228_add_routes_images.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('🚀 开始执行路线图片字段迁移...')
    await client.query(sql)
    
    console.log('✅ 路线图片字段迁移成功！')
    
    // 验证字段是否添加成功
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'routes' 
      AND column_name = 'images'
    `)
    
    if (result.rows.length > 0) {
      console.log(`✅ 确认: images 字段已成功添加 (类型: ${result.rows[0].data_type})`)
    } else {
      console.log('⚠️  警告: 未找到 images 字段')
    }
    
  } catch (err) {
    console.error('❌ 路线图片字段迁移失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

runRoutesImagesMigration()