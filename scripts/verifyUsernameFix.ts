import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_wZ2MXliTwc0XARfnHQ2Xeg_8DGolHd9'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifyUsernameFix() {
  console.log('🔍 验证用户名修复...')
  
  try {
    // 1. 首先获取所有 auth 用户
    console.log('\n📊 获取所有认证用户...')
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    
    console.log(`找到 ${authUsers.users.length} 个认证用户:`)
    authUsers.users.forEach(user => {
      console.log(`- ${user.email}: ${user.user_metadata?.username || '无用户名'}`)
    })
    
    // 2. 然后获取所有 profiles 记录
    console.log('\n📊 获取所有 profiles 记录...')
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role')
    
    console.log(`找到 ${profiles?.length || 0} 个 profiles 记录:`)
    profiles?.forEach(profile => {
      console.log(`- ${profile.id}: ${profile.username || 'NA'} (角色: ${profile.role})`)
    })
    
    // 3. 特别检查 764855102@qq.com 用户
    console.log('\n🔍 特别检查 764855102@qq.com 用户...')
    
    // 查找 auth 中的用户
    const { data: targetAuthUser } = await supabaseAdmin.auth.admin.listUsers({
      email: '764855102@qq.com'
    })
    
    if (targetAuthUser.users.length > 0) {
      const targetUser = targetAuthUser.users[0]
      console.log(`✅ Auth 用户信息:`)
      console.log(`   邮箱: ${targetUser.email}`)
      console.log(`   用户名 (metadata): ${targetUser.user_metadata?.username}`)
      console.log(`   ID: ${targetUser.id}`)
      
      // 查找 profiles 中的记录
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('username, role')
        .eq('id', targetUser.id)
        .single()
      
      if (profileData) {
        console.log(`✅ Profiles 记录:`)
        console.log(`   用户名: ${profileData.username}`)
        console.log(`   角色: ${profileData.role}`)
        
        if (profileData.username !== 'NA' && profileData.username === targetUser.user_metadata?.username) {
          console.log('🎉 成功！用户名已正确同步！')
        } else {
          console.error('❌ 失败！用户名未正确同步！')
        }
      } else {
        console.error('❌ Profiles 表中没有该用户的记录！')
      }
    } else {
      console.error('❌ 未找到该邮箱的用户！')
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error)
  }
}

verifyUsernameFix()
