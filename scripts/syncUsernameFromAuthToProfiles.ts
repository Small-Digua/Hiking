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

async function syncUsernameFromAuthToProfiles() {
  console.log('🔄 从 Auth 同步用户名到 Profiles 表...')
  
  try {
    // 1. 获取所有认证用户
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ 获取认证用户失败:', authError)
      return
    }

    console.log(`📊 找到 ${authUsers.users.length} 个认证用户`)

    // 2. 获取所有 profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
    
    if (profileError) {
      console.error('❌ 获取用户资料失败:', profileError)
      return
    }

    console.log(`📊 找到 ${profiles?.length || 0} 个用户资料记录`)

    // 3. 遍历所有认证用户，同步用户名
    let updatedCount = 0
    let createdCount = 0
    let errorCount = 0

    for (const authUser of authUsers.users) {
      const userId = authUser.id
      const email = authUser.email
      const authUsername = authUser.user_metadata?.username || email?.split('@')[0] || '用户'
      
      // 查找对应的 profiles 记录
      const existingProfile = profiles?.find(p => p.id === userId)
      
      if (existingProfile) {
        // 更新现有记录的用户名（只更新 username 列，不涉及其他列）
        console.log(`📝 更新用户 ${email} 的用户名: ${authUsername}...`)
        
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            username: authUsername
          })
          .eq('id', userId)
        
        if (updateError) {
          console.error(`❌ 更新用户 ${email} 失败:`, updateError)
          errorCount++
        } else {
          console.log(`✅ 更新用户 ${email} 成功`)
          updatedCount++
        }
      } else {
        // 创建新记录（只包含必填列）
        console.log(`📝 为用户 ${email} 创建资料记录，用户名: ${authUsername}...`)
        
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            username: authUsername,
            role: 'user' // 只设置必填列
          })
        
        if (insertError) {
          console.error(`❌ 为用户 ${email} 创建资料失败:`, insertError)
          errorCount++
        } else {
          console.log(`✅ 为用户 ${email} 创建资料成功`)
          createdCount++
        }
      }
    }

    console.log('\n🎉 同步完成！')
    console.log(`📊 统计:`)
    console.log(`   更新记录: ${updatedCount} 条`)
    console.log(`   创建记录: ${createdCount} 条`)
    console.log(`   错误记录: ${errorCount} 条`)
    console.log(`   总计处理: ${updatedCount + createdCount + errorCount} 条`)

    // 4. 特别验证 764855102@qq.com 用户
    console.log('\n🔍 验证用户 764855102@qq.com 的同步结果...')
    
    // 首先查找该用户在 auth.users 中的 ID
    const { data: authUser } = await supabaseAdmin.auth.admin.listUsers({
      email: '764855102@qq.com'
    })
    
    if (authUser.users.length > 0) {
      const targetUserId = authUser.users[0].id
      
      // 然后在 profiles 表中查找
      const { data: targetUser } = await supabaseAdmin
        .from('profiles')
        .select('username, role, status')
        .eq('id', targetUserId)
        .single()
      
      if (targetUser) {
        console.log(`✅ 目标用户状态:`)
        console.log(`   邮箱: 764855102@qq.com`)
        console.log(`   用户名: ${targetUser.username}`)
        console.log(`   角色: ${targetUser.role}`)
        console.log(`   状态: ${targetUser.status}`)
        
        if (targetUser.username !== 'NA') {
          console.log('✅ 成功！用户名不再显示为 NA')
        } else {
          console.error('❌ 失败！用户名仍然显示为 NA')
        }
      } else {
        console.error('❌ 在 profiles 表中未找到目标用户')
      }
    } else {
      console.error('❌ 在 auth.users 中未找到目标用户')
    }

  } catch (error) {
    console.error('❌ 同步过程中发生错误:', error)
  }
}

syncUsernameFromAuthToProfiles()
