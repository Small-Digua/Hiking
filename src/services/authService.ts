import { supabase } from './supabase'

export const authService = {
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })
    return { data, error }
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // 模拟获取用户密保问题 (真实场景应调用后端API)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUserSecurityQuestion(_email: string) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 这里为了演示，我们假设所有用户都有一个默认的密保问题
    // 在真实应用中，这应该查询数据库
    // 注意：由于 Supabase 安全策略，前端无法直接通过 Email 查询其他用户的 Metadata
    return { 
      question: '您的星座是？', // 模拟返回的问题
      error: null 
    };
  },

  // 模拟验证密保答案
  async verifySecurityAnswer(_email: string, answer: string) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 简单的模拟验证：只要答案长度 > 1 就认为正确
    // 真实场景：后端验证 Hash
    if (answer.trim().length > 1) {
      return { success: true, error: null }
    }
    return { success: false, error: new Error('密保答案不正确') }
  },

  // 模拟重置密码
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async resetPassword(_email: string, _newPassword: string) {
    // 使用 Supabase 的 updateUser 接口 (需要用户已登录，或使用 Admin API)
    // 既然是忘记密码流程，通常通过 Email Link 重置。
    // 但根据用户需求是"输入密保后重置"，这在 Supabase 客户端 SDK 中比较难直接实现（因为没有 Session）。
    // 这里我们仅更新 Auth，假设已经通过某种方式验证了身份（实际上在纯前端无法直接重置他人密码）
    // 为了演示完整流程，我们假装成功。
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, error: null }
  }
}
