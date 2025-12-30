import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const dbUrl = process.env.DATABASE_URL
const targetEmail = '764855102@qq.com'

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

async function setUserAsAdmin() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 1. 检查 profiles 表是否存在
    console.log('\n📋 检查 profiles 表是否存在...')
    const { rows: [tableCheck] } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
      ) as table_exists
    `)
    
    const tableExists = tableCheck.table_exists
    console.log(`✅ profiles 表存在: ${tableExists}`)
    
    // 2. 检查 profiles 表的列
    console.log('\n📋 检查 profiles 表的列...')
    const { rows: columns } = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'profiles' AND table_schema = 'public'
    `)
    
    const profileColumns = columns.map(col => col.column_name)
    console.log(`✅ profiles 表的列: ${profileColumns.join(', ')}`)
    
    // 3. 如果没有 role 列，添加它
    if (!profileColumns.includes('role')) {
      console.log('\n🚀 添加 role 列到 profiles 表...')
      await client.query(`
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'))
      `)
      console.log('✅ role 列添加成功！')
    }
    
    // 4. 查找目标用户的 ID
    console.log(`\n🔍 查找用户 ${targetEmail} 的 ID...`)
    const { rows: users } = await client.query(`
      SELECT id FROM public.profiles 
      WHERE email = $1
    `, [targetEmail])
    
    if (users.length === 0) {
      console.error(`❌ 用户 ${targetEmail} 不存在于 profiles 表中`)
      return
    }
    
    const userId = users[0].id
    console.log(`✅ 找到用户 ID: ${userId}`)
    
    // 5. 更新用户角色为 admin
    console.log(`\n🚀 更新用户 ${targetEmail} 的角色为 admin...`)
    const { rowCount } = await client.query(`
      UPDATE public.profiles 
      SET role = 'admin' 
      WHERE email = $1
    `, [targetEmail])
    
    console.log(`✅ 成功更新 ${rowCount} 条记录！`)
    
    // 6. 验证结果
    console.log(`\n🔍 验证结果...`)
    const { rows: updatedUser } = await client.query(`
      SELECT id, email, role 
      FROM public.profiles 
      WHERE email = $1
    `, [targetEmail])
    
    if (updatedUser.length > 0) {
      const user = updatedUser[0]
      console.log(`✅ 验证成功！`)
      console.log(`   用户 ID: ${user.id}`)
      console.log(`   邮箱: ${user.email}`)
      console.log(`   角色: ${user.role}`)
      console.log(`   状态: ${user.role === 'admin' ? '已成功设置为管理员' : '未成功设置为管理员'}`)
    } else {
      console.error(`❌ 验证失败，未找到用户记录`)
    }
    
  } catch (err) {
    console.error('❌ 设置管理员失败:', err)
    // 显示更详细的错误信息
    if (err instanceof Error) {
      console.error('错误详情:', err.message)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

setUserAsAdmin()
