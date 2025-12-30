import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔌 测试 Supabase 连接...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseKey.substring(0, 20) + '...')
  
  try {
    // 测试简单查询
    const { data, error } = await supabase
      .from('cities')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ 查询失败:', error)
    } else {
      console.log('✅ 连接成功！查询结果:', data)
    }

    // 测试认证状态
    const { data: { session } } = await supabase.auth.getSession()
    console.log('🔐 当前会话:', session ? '已登录' : '未登录')

  } catch (err) {
    console.error('❌ 连接测试失败:', err)
  }
}

testConnection()