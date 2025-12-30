import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = 'sb_secret_wZ2MXliTwc0XARfnHQ2Xeg_8DGolHd9'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkUsers() {
  console.log('👥 检查现有用户...')
  
  try {
    // 1. 检查 auth.users 表
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ 获取认证用户失败:', authError)
      return
    }

    console.log(`📊 认证用户总数: ${authUsers.users.length}`)
    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`)
    })

    // 2. 检查 profiles 表
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
    
    if (profileError) {
      console.error('❌ 获取用户资料失败:', profileError)
      return
    }

    console.log(`\n👤 用户资料总数: ${profiles?.length || 0}`)
    profiles?.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.username || '未设置'} - ${profile.role || 'user'} (ID: ${profile.id})`)
    })

    // 3. 检查是否有管理员
    const adminProfiles = profiles?.filter(p => p.role === 'admin') || []
    console.log(`\n👑 管理员数量: ${adminProfiles.length}`)
    
    if (adminProfiles.length === 0) {
      console.log('⚠️  没有找到管理员账号')
      
      // 尝试将现有用户设置为管理员
      if (authUsers.users.length > 0) {
        const firstUser = authUsers.users[0]
        console.log(`🔧 尝试将 ${firstUser.email} 设置为管理员...`)
        
        // 先检查是否有对应的 profile
        const existingProfile = profiles?.find(p => p.id === firstUser.id)
        
        if (existingProfile) {
          // 更新现有 profile
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', firstUser.id)
          
          if (updateError) {
            console.error('❌ 更新用户角色失败:', updateError)
          } else {
            console.log('✅ 用户角色已更新为管理员')
          }
        } else {
          // 创建新的 profile
          const { error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: firstUser.id,
              username: firstUser.user_metadata?.username || firstUser.email?.split('@')[0] || '管理员',
              role: 'admin',
              status: 'active'
            })
          
          if (insertError) {
            console.error('❌ 创建用户资料失败:', insertError)
          } else {
            console.log('✅ 管理员资料已创建')
          }
        }
      }
    } else {
      console.log('✅ 找到管理员账号:')
      adminProfiles.forEach(admin => {
        const authUser = authUsers.users.find(u => u.id === admin.id)
        console.log(`   - ${authUser?.email} (${admin.username})`)
      })
    }

  } catch (error) {
    console.error('❌ 检查用户失败:', error)
  }
}

checkUsers()