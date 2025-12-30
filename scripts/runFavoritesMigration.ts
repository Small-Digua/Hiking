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

async function runFavoritesMigration() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 读取收藏表迁移文件
    const sqlPath = path.join(__dirname, '../supabase/migrations/20251228_create_favorites_table.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('🚀 开始执行收藏表迁移...')
    await client.query(sql)
    
    console.log('✅ 收藏表迁移成功！')
    
    // 验证表结构
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'favorites'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 favorites 表结构:')
    result.rows.forEach((row, index) => {
      const nullable = row.is_nullable === 'YES' ? '可空' : '非空'
      console.log(`${index + 1}. ${row.column_name} - ${row.data_type} - ${nullable}`)
    })

    // 检查外键约束
    const fkResult = await client.query(`
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'favorites'
    `)

    console.log('\n🔗 外键约束:')
    fkResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`)
    })
    
  } catch (err) {
    console.error('❌ 收藏表迁移失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

runFavoritesMigration()