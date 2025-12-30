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

async function runUpdatedAtMigration() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 读取更新时间字段迁移文件
    const sqlPath = path.join(__dirname, '../supabase/migrations/20251228_add_updated_at_to_routes.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('🚀 开始执行更新时间字段迁移...')
    await client.query(sql)
    
    console.log('✅ 更新时间字段迁移成功！')
    
    // 验证字段是否添加成功
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'routes' 
      AND column_name = 'updated_at'
    `)
    
    if (result.rows.length > 0) {
      console.log(`✅ 确认: updated_at 字段已成功添加`)
      console.log(`   - 类型: ${result.rows[0].data_type}`)
      console.log(`   - 默认值: ${result.rows[0].column_default}`)
    } else {
      console.log('⚠️  警告: 未找到 updated_at 字段')
    }

    // 检查触发器是否创建成功
    const triggerResult = await client.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND event_object_table = 'routes'
      AND trigger_name = 'update_routes_updated_at'
    `)

    if (triggerResult.rows.length > 0) {
      console.log('✅ 确认: 自动更新触发器已创建')
      console.log(`   - 触发器: ${triggerResult.rows[0].trigger_name}`)
      console.log(`   - 时机: ${triggerResult.rows[0].action_timing} ${triggerResult.rows[0].event_manipulation}`)
    } else {
      console.log('⚠️  警告: 未找到自动更新触发器')
    }
    
  } catch (err) {
    console.error('❌ 更新时间字段迁移失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

runUpdatedAtMigration()