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

async function runMigrations() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 读取所有迁移文件，按文件名排序
    const migrationsPath = path.join(__dirname, '../supabase/migrations')
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort()
    
    console.log(`📋 找到 ${migrationFiles.length} 个迁移文件:`)
    migrationFiles.forEach(file => console.log(`   - ${file}`))
    
    // 跳过初始化脚本，只执行后续的迁移脚本
    // 初始化脚本会删除所有数据，所以我们从添加字段的迁移开始
    const migrationsToRun = migrationFiles.filter(file => !file.includes('init_schema'))
    
    console.log(`\n🚀 开始执行 ${migrationsToRun.length} 个迁移脚本...`)
    
    for (const file of migrationsToRun) {
      const sqlPath = path.join(migrationsPath, file)
      const sql = fs.readFileSync(sqlPath, 'utf8')
      
      console.log(`\n📄 执行迁移: ${file}`)
      try {
        await client.query(sql)
        console.log(`✅ ${file} 执行成功！`)
      } catch (err) {
        console.error(`❌ ${file} 执行失败:`, err)
      }
    }
    
    console.log('\n🎉 所有迁移脚本执行完成！')
  } catch (err) {
    console.error('❌ 迁移过程中发生错误:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigrations()
