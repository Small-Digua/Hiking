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

async function simpleProfileCheck() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 1. 只检查 profiles 表的列
    console.log('\n📋 profiles 表的列:')
    const { rows: columns } = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'profiles' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    console.log(columns.map(col => col.column_name).join(', '))
    
    // 2. 检查 profiles 表的第一行数据
    console.log('\n📊 profiles 表的第一行数据:')
    const { rows: profiles } = await client.query(`
      SELECT * FROM public.profiles LIMIT 1
    `)
    
    if (profiles.length > 0) {
      console.log(profiles[0])
    } else {
      console.log('❌ 没有数据')
    }
    
    // 3. 检查 auth.users 表的结构
    console.log('\n📋 auth.users 表的相关列:')
    const { rows: authColumns } = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'auth' AND column_name IN ('id', 'email')
    `)
    
    console.log(authColumns.map(col => col.column_name).join(', '))
    
    // 4. 查找目标用户
    const targetEmail = '764855102@qq.com'
    console.log(`\n🔍 查找用户 ${targetEmail} 在 auth.users 表中:`) 
    const { rows: authUsers } = await client.query(`
      SELECT id, email FROM auth.users 
      WHERE email = $1
    `, [targetEmail])
    
    if (authUsers.length > 0) {
      console.log('✅ 找到用户:')
      console.log(authUsers[0])
    } else {
      console.log('❌ 没找到用户')
    }
    
  } catch (err) {
    console.error('❌ 检查失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

simpleProfileCheck()
