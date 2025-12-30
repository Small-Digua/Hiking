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

async function addMissingColumnsToProfiles() {
  const client = await pool.connect()
  try {
    console.log('🔌 正在连接数据库...')
    
    // 1. 检查 profiles 表的当前结构
    console.log('\n📋 检查 profiles 表的当前结构...')
    const { rows: currentColumns } = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    console.log('当前列:')
    currentColumns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, 默认: ${col.column_default}, 允许为空: ${col.is_nullable})`)
    })
    
    // 2. 定义需要添加的列
    const columnsToAdd = [
      { name: 'email', type: 'TEXT', is_nullable: 'YES', default_value: null, comment: '用户邮箱' },
      { name: 'status', type: 'TEXT', is_nullable: 'NO', default_value: `'active'`, comment: '用户状态 (active/disabled)' },
      { name: 'phone', type: 'TEXT', is_nullable: 'YES', default_value: null, comment: '用户电话' },
      { name: 'avatar_url', type: 'TEXT', is_nullable: 'YES', default_value: null, comment: '用户头像URL' },
      { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', is_nullable: 'NO', default_value: 'NOW()', comment: '创建时间' },
      { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', is_nullable: 'NO', default_value: 'NOW()', comment: '更新时间' }
    ]
    
    // 3. 检查哪些列需要添加
    const existingColumnNames = currentColumns.map(col => col.column_name)
    const columnsToAddFiltered = columnsToAdd.filter(col => !existingColumnNames.includes(col.name))
    
    if (columnsToAddFiltered.length === 0) {
      console.log('\n✅ 所有列都已存在，无需添加！')
      return
    }
    
    console.log(`\n🚀 准备添加 ${columnsToAddFiltered.length} 个缺失的列:`)
    columnsToAddFiltered.forEach(col => {
      console.log(`- ${col.name}: ${col.type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} DEFAULT ${col.default_value}`)
    })
    
    // 4. 开始添加列
    let addedCount = 0
    
    for (const column of columnsToAddFiltered) {
      console.log(`\n📝 添加列 ${column.name}...`)
      
      let sql = `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`
      
      // 添加 NOT NULL 约束
      if (column.is_nullable === 'NO') {
        sql += ' NOT NULL'
      }
      
      // 添加默认值
      if (column.default_value) {
        sql += ` DEFAULT ${column.default_value}`
      }
      
      try {
        await client.query(sql)
        console.log(`✅ 列 ${column.name} 添加成功！`)
        addedCount++
      } catch (err) {
        console.error(`❌ 列 ${column.name} 添加失败:`, err)
      }
    }
    
    // 5. 添加约束（如果需要）
    console.log('\n🔧 添加约束...')
    
    // 添加 CHECK 约束到 status 列，限制只能是 'active' 或 'disabled'
    try {
      await client.query(`
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_status_check 
        CHECK (status IN ('active', 'disabled'))
      `)
      console.log('✅ status 列的 CHECK 约束添加成功！')
    } catch (err) {
      console.log('ℹ️ status 列的 CHECK 约束可能已存在，跳过添加。')
    }
    
    // 6. 添加触发器，自动更新 updated_at 字段
    console.log('\n🔧 添加更新触发器...')
    
    // 检查触发器是否已存在
    const { rowCount: triggerExists } = await client.query(`
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'profiles_updated_at' AND tgrelid = 'public.profiles'::regclass
    `)
    
    if (triggerExists === 0) {
      // 创建触发器函数
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `)
      
      // 创建触发器
      await client.query(`
        CREATE TRIGGER profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `)
      
      console.log('✅ 更新触发器添加成功！')
    } else {
      console.log('ℹ️ 更新触发器已存在，跳过添加。')
    }
    
    // 7. 验证结果
    console.log('\n🎉 迁移完成！')
    console.log(`📊 统计: 添加了 ${addedCount} 个列`)
    
    // 显示更新后的表结构
    console.log('\n📋 更新后的 profiles 表结构:')
    const { rows: updatedColumns } = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    updatedColumns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, 默认: ${col.column_default}, 允许为空: ${col.is_nullable})`)
    })
    
    // 8. 同步现有用户的 email 到 profiles 表
    console.log('\n🔄 同步现有用户的 email 到 profiles 表...')
    
    // 获取所有 auth.users 记录
    const { rows: authUsers } = await client.query(`
      SELECT id, email FROM auth.users
    `)
    
    console.log(`找到 ${authUsers.length} 个 auth 用户，准备同步 email...`)
    
    let syncCount = 0
    for (const user of authUsers) {
      try {
        await client.query(`
          UPDATE public.profiles 
          SET email = $1 
          WHERE id = $2
        `, [user.email, user.id])
        syncCount++
      } catch (err) {
        console.error(`❌ 同步用户 ${user.email} 失败:`, err)
      }
    }
    
    console.log(`✅ 成功同步 ${syncCount} 个用户的 email！`)
    
  } catch (err) {
    console.error('❌ 迁移失败:', err)
    if (err instanceof Error) {
      console.error('错误详情:', err.message)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

addMissingColumnsToProfiles()
