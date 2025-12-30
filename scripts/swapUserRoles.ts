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

async function swapUserRoles() {
  console.log('🔄 交换用户角色...')
  
  try {
    // 1. 将 764855102@qq.com 设置为管理员
    console.log('👑 将 764855102@qq.com 设置为管理员...')
    const { error: error1 } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', '764855102@qq.com')
    
    if (error1) {
      console.error('❌ 更新 764855102@qq.com 角色失败:', error1)
      return
    }
    console.log('✅ 764855102@qq.com 已设置为管理员')

    // 2. 将 764855101@qq.com 设置为普通用户
    console.log('👤 将 764855101@qq.com 设置为普通用户...')
    const { error: error2 } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'user' })
      .eq('email', '764855101@qq.com')
    
    if (error2) {
      console.error('❌ 更新 764855101@qq.com 角色失败:', error2)
      return
    }
    console.log('✅ 764855101@qq.com 已设置为普通用户')

    console.log('🎉 角色交换完成！')
    console.log('📧 新的管理员: 764855102@qq.com')
    console.log('👤 新的普通用户: 764855101@qq.com')

    // 3. 验证更新结果
    console.log('\n🔍 验证更新结果:')
    const { data: profiles, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('email, username, role')
      .in('email', ['764855101@qq.com', '764855102@qq.com'])
    
    if (checkError) {
      console.error('❌ 验证失败:', checkError)
      return
    }

    profiles?.forEach(profile => {
      const roleText = profile.role === 'admin' ? '👑 管理员' : '👤 普通用户'
      console.log(`   - ${profile.email} (${profile.username}): ${roleText}`)
    })

  } catch (error) {
    console.error('❌ 交换角色过程中发生错误:', error)
  }
}

swapUserRoles()