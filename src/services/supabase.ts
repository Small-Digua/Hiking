import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.warn('Missing or invalid Supabase environment variables. Using mock URL for preview.')
}

// 使用有效格式的 URL 以通过客户端验证，即使它无法连接
const validUrl = (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL') ? supabaseUrl : 'https://placeholder-project.supabase.co'
const validKey = (supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') ? supabaseAnonKey : 'placeholder-key'

export const supabase = createClient<Database>(
  validUrl,
  validKey
)
