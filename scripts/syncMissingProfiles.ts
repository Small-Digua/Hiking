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

async function syncMissingProfiles() {
  console.log('🔄 同步缺失的用户资料...')
  
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
      .select('id')
    
    if (profileError) {
      console.error('❌ 获取用户资料失败:', profileError)
      return
    }

    const existingProfileIds = new Set(profiles?.map(p => p.id) || [])
    console.log(`📊 找到 ${profiles?.length || 0} 个用户资料`)

    // 3. 找出缺失的 profiles
    const missingUsers = authUsers.users.filter(user => !existingProfileIds.has(user.id))
    
    if (missingUsers.length === 0) {
      console.log('✅ 所有用户都有对应的资料记录')
      return
    }

    console.log(`🔧 发现 ${missingUsers.length} 个用户缺少资料记录:`)
    missingUsers.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`)
    })

    // 4. 为缺失的用户创建 profiles
    for (const user of missingUsers) {
      console.log(`📝 为 ${user.email} 创建资料记录...`)
      
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || '用户',
          avatar_url: user.user_metadata?.avatar_url || null,
          role: 'user',
          status: 'active'
        })
      
      if (insertError) {
        console.error(`❌ 为 ${user.email} 创建资料失败:`, insertError)
      } else {
        console.log(`✅ 为 ${user.email} 创建资料成功`)
      }
    }

    console.log('🎉 同步完成！')

  } catch (error) {
    console.error('❌ 同步过程中发生错误:', error)
  }
}

syncMissingProfiles()