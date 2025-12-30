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

async function checkProfilesColumns() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 检查 profiles 表的结构
    console.log('\n📋 profiles 表结构:')
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    console.log('列名 | 数据类型 | 默认值 | 是否允许为空')
    console.log('--- | --- | --- | ---')
    columns.forEach(col => {
      console.log(`${col.column_name} | ${col.data_type} | ${col.column_default || ''} | ${col.is_nullable}`)
    })
    
    // 检查 profiles 表中的数据
    console.log('\n👤 profiles 表中的数据:')
    const { rows: profiles } = await client.query(`
      SELECT * FROM public.profiles LIMIT 10
    `)
    
    if (profiles.length > 0) {
      console.log(`找到 ${profiles.length} 条记录:`)
      profiles.forEach((profile, index) => {
        console.log(`\n记录 ${index + 1}:`)
        Object.entries(profile).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`)
        })
      })
    } else {
      console.log('❌ 没有找到 profiles 表中的数据')
    }
    
    // 检查 auth.users 表中的数据
    console.log('\n🔑 auth.users 表中的数据:')
    const { rows: authUsers } = await client.query(`
      SELECT id, email, created_at FROM auth.users LIMIT 10
    `)
    
    if (authUsers.length > 0) {
      console.log(`找到 ${authUsers.length} 条记录:`)
      authUsers.forEach((user, index) => {
        console.log(`\n记录 ${index + 1}:`)
        Object.entries(user).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`)
        })
      })
    } else {
      console.log('❌ 没有找到 auth.users 表中的数据')
    }
    
  } catch (err) {
    console.error('❌ 检查失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

checkProfilesColumns()
