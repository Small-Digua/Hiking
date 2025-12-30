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

async function addRoleColumn() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 添加 role 列到 profiles 表
    console.log('\n🚀 正在添加 role 列到 profiles 表...')
    await client.query(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'))
    `)
    
    console.log('✅ role 列添加成功！')
    
    // 更新现有用户为 admin (如果需要)
    console.log('\n👑 更新现有用户为管理员...')
    const { rowCount } = await client.query(`
      UPDATE public.profiles 
      SET role = 'admin' 
      WHERE email IS NOT NULL
    `)
    
    console.log(`✅ 成功更新 ${rowCount} 个用户为管理员角色`) 
    
  } catch (err) {
    console.error('❌ 迁移失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

addRoleColumn()
