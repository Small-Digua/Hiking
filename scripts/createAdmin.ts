import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.DATABASE_URL?.includes('postgres:') 
  ? 'sb_secret_wZ2MXliTwc0XARfnHQ2Xeg_8DGolHd9' // 从server/.env获取
  : process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 环境变量')
  process.exit(1)
}

// 使用服务角色密钥创建管理员客户端
const supabaseAdmin = createClient(supabaseUrl, 'sb_secret_wZ2MXliTwc0XARfnHQ2Xeg_8DGolHd9', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  console.log('🔧 创建管理员账号...')
  
  const adminEmail = '764855102@qq.com' // 你的邮箱
  const adminPassword = 'admin123456' // 临时密码，登录后可修改
  const adminUsername = '系统管理员'

  try {
    // 1. 创建用户账号
    console.log('📝 正在创建用户账号...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // 跳过邮箱验证
      user_metadata: {
        username: adminUsername
      }
    })

    if (authError) {
      console.error('❌ 创建用户失败:', authError)
      return
    }

    console.log('✅ 用户账号创建成功:', authData.user.id)

    // 2. 创建用户资料并设置为管理员
    console.log('👑 正在设置管理员权限...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: adminUsername,
        role: 'admin',
        status: 'active'
      })

    if (profileError) {
      console.error('❌ 创建用户资料失败:', profileError)
      return
    }

    console.log('✅ 管理员账号创建完成！')
    console.log('📧 邮箱:', adminEmail)
    console.log('🔑 密码:', adminPassword)
    console.log('🚀 现在可以使用此账号登录管理后台了')

  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error)
  }
}

createAdminUser()