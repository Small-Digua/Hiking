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

async function simpleRoleCheck() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 检查 profiles 表是否存在
    console.log('\n📋 检查 profiles 表是否存在:')
    const { rowCount: tableExists } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
      )
    `)
    
    console.log(`✅ profiles 表存在: ${tableExists > 0}`)
    
    if (tableExists > 0) {
      // 检查 profiles 表的列
      console.log('\n📋 profiles 表的所有列:')
      const { rows: columns } = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'profiles' AND table_schema = 'public'
        ORDER BY ordinal_position
      `)
      
      console.log('列名列表:')
      columns.forEach(col => console.log(`- ${col.column_name}`))
      
      // 检查是否有 role 列
      const hasRoleColumn = columns.some(col => col.column_name === 'role')
      console.log(`\n✅ role 列存在: ${hasRoleColumn}`)
      
      if (hasRoleColumn) {
        // 如果有 role 列，检查默认值和约束
        console.log('\n🔍 检查 role 列的定义:')
        const { rows: constraints } = await client.query(`
          SELECT column_default, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'profiles' AND table_schema = 'public' AND column_name = 'role'
        `)
        
        if (constraints.length > 0) {
          const constraint = constraints[0]
          console.log(`默认值: ${constraint.column_default}`)
          console.log(`是否允许为空: ${constraint.is_nullable}`)
        }
        
        // 检查现有用户的角色
        console.log('\n👤 检查现有用户的角色:')
        const { rows: users } = await client.query(`
          SELECT id, email, role 
          FROM public.profiles 
          LIMIT 5
        `)
        
        if (users.length > 0) {
          users.forEach(user => {
            console.log(`\n用户: ${user.email}`)
            console.log(`角色: ${user.role}`)
          })
        } else {
          console.log('❌ 没有找到用户数据')
        }
      }
    }
    
  } catch (err) {
    console.error('❌ 检查失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

simpleRoleCheck()
