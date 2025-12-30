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

async function setupProfilesTable() {
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
    
    if (!tableExists) {
      // 2. 如果表不存在，创建表并添加 role 列
      console.log('\n🚀 创建 profiles 表...')
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT UNIQUE,
          username TEXT,
          avatar_url TEXT,
          role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log('✅ profiles 表创建成功！')
    } else {
      // 3. 如果表存在，检查是否有 role 列
      console.log('\n🔍 检查 role 列是否存在...')
      const { rows: [columnCheck] } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
        ) as column_exists
      `)
      
      const columnExists = columnCheck.column_exists
      console.log(`✅ role 列存在: ${columnExists}`)
      
      if (!columnExists) {
        // 4. 如果没有 role 列，添加它
        console.log('\n🚀 添加 role 列到 profiles 表...')
        await client.query(`
          ALTER TABLE public.profiles 
          ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'))
        `)
        console.log('✅ role 列添加成功！')
      }
    }
    
    // 5. 更新所有现有用户为 user 角色（默认值）
    console.log('\n📋 更新现有用户角色...')
    await client.query(`
      UPDATE public.profiles 
      SET role = COALESCE(role, 'user') 
      WHERE role IS NULL
    `)
    console.log('✅ 用户角色更新成功！')
    
    // 6. 显示最终结果
    console.log('\n📊 最终表结构:')
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    console.log('列名 | 数据类型 | 默认值')
    console.log('--- | --- | ---')
    columns.forEach(col => {
      console.log(`${col.column_name} | ${col.data_type} | ${col.column_default || ''}`)
    })
    
    // 7. 显示现有用户数据
    console.log('\n👤 现有用户数据:')
    const { rows: users } = await client.query(`
      SELECT id, email, role 
      FROM public.profiles 
      LIMIT 10
    `)
    
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`\n用户 ID: ${user.id}`)
        console.log(`邮箱: ${user.email}`)
        console.log(`角色: ${user.role}`)
      })
    } else {
      console.log('❌ 没有找到用户数据')
      
      // 8. 如果没有用户数据，同步 auth.users 到 profiles
      console.log('\n🔄 同步 auth.users 到 profiles 表...')
      await client.query(`
        INSERT INTO public.profiles (id, email, username, created_at, updated_at)
        SELECT u.id, u.email, u.email::text || '_user' as username, u.created_at, u.created_at
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE p.id IS NULL
        ON CONFLICT (id) DO NOTHING
      `)
      console.log('✅ 用户数据同步成功！')
      
      // 9. 再次查询用户数据
      const { rows: newUsers } = await client.query(`
        SELECT id, email, role 
        FROM public.profiles 
        LIMIT 10
      `)
      
      if (newUsers.length > 0) {
        console.log('\n👤 同步后的用户数据:')
        newUsers.forEach(user => {
          console.log(`\n用户 ID: ${user.id}`)
          console.log(`邮箱: ${user.email}`)
          console.log(`角色: ${user.role}`)
        })
      }
    }
    
    console.log('\n🎉 profiles 表设置完成！')
    
  } catch (err) {
    console.error('❌ 设置失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

setupProfilesTable()
