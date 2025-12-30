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

async function checkProfilesTable() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 检查 profiles 表的结构
    console.log('\n📋 检查 profiles 表结构:')
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND table_schema = 'public'
    `)
    
    console.log('列名 | 数据类型')
    console.log('--- | ---')
    columns.forEach(col => {
      console.log(`${col.column_name} | ${col.data_type}`)
    })
    
    // 检查是否有 role 列
    const hasRoleColumn = columns.some(col => col.column_name === 'role')
    console.log(`\n✅ role 列存在: ${hasRoleColumn}`)
    
    // 检查现有用户数据 (不包含 role 列，避免错误)
    console.log('\n👤 现有用户数据:')
    const { rows: users } = await client.query(`
      SELECT id, email, created_at 
      FROM public.profiles 
      LIMIT 10
    `)
    
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`\n用户 ID: ${user.id}`)
        console.log(`邮箱: ${user.email}`)
        console.log(`创建时间: ${user.created_at}`)
      })
    } else {
      console.log('❌ 没有找到用户数据')
    }
    
    // 检查 auth.users 表中的用户数据
    console.log('\n🔑 Auth.users 表数据:')
    const { rows: authUsers } = await client.query(`
      SELECT id, email, created_at, last_sign_in_at 
      FROM auth.users 
      LIMIT 10
    `)
    
    if (authUsers.length > 0) {
      console.log(`找到 ${authUsers.length} 个用户`)
      authUsers.forEach(user => {
        console.log(`\n用户 ID: ${user.id}`)
        console.log(`邮箱: ${user.email}`)
        console.log(`创建时间: ${user.created_at}`)
        console.log(`最后登录: ${user.last_sign_in_at}`)
      })
    } else {
      console.log('❌ 没有找到 auth 用户数据')
    }
    
  } catch (err) {
    console.error('❌ 检查失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

checkProfilesTable()
