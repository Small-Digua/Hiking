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

async function setAdminSimple() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 1. 添加 role 列到 profiles 表（使用 IF NOT EXISTS 避免错误）
    console.log('\n🚀 添加 role 列到 profiles 表...')
    await client.query(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
    `)
    console.log('✅ role 列添加成功！')
    
    // 2. 查找目标用户
    console.log(`\n🔍 查找用户 ${targetEmail}...`)
    const { rows: userRows } = await client.query(`
      SELECT id FROM auth.users 
      WHERE email = $1
    `, [targetEmail])
    
    if (userRows.length === 0) {
      console.error(`❌ 用户 ${targetEmail} 不存在！`)
      return
    }
    
    const userId = userRows[0].id
    console.log(`✅ 找到用户，ID: ${userId}`)
    
    // 3. 检查用户是否在 profiles 表中
    const { rows: profileRows } = await client.query(`
      SELECT id FROM public.profiles 
      WHERE id = $1
    `, [userId])
    
    if (profileRows.length === 0) {
      // 如果不在，创建记录
      console.log('\n🚀 在 profiles 表中创建用户记录...')
      await client.query(`
        INSERT INTO public.profiles (id, role) 
        VALUES ($1, 'admin')
      `, [userId])
      console.log('✅ 用户记录创建成功，角色设置为 admin！')
    } else {
      // 如果在，更新角色
      console.log('\n🚀 更新用户角色为 admin...')
      await client.query(`
        UPDATE public.profiles 
        SET role = 'admin' 
        WHERE id = $1
      `, [userId])
      console.log('✅ 用户角色更新为 admin 成功！')
    }
    
    console.log(`\n🎉 成功将用户 ${targetEmail} 设置为管理员！`)
    
  } catch (err) {
    console.error('❌ 操作失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

setAdminSimple()
