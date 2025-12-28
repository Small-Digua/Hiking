import { supabase } from './supabase'
import type { Database } from '../types/database.types'

type City = Database['public']['Tables']['cities']['Row']
type Route = Database['public']['Tables']['routes']['Row']
type Itinerary = Database['public']['Tables']['itineraries']['Row']

export { type City, type Route, type Itinerary }

export const dataService = {
  // Cities
  async getCities() {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data, error } as { data: City[] | null; error: any }
  },

  async getCityById(id: string) {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', id)
      .single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data, error } as { data: City | null; error: any }
  },

  // Routes
  async getAllRoutes(limit = 10) {
    const { data, error } = await supabase
      .from('routes')
      .select('*, cities(name)') // 关联查询城市名
      .limit(limit)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data, error } as { data: (Route & { cities: { name: string } | null })[] | null; error: any }
  },

  async getRoutesByCity(cityId: string) {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('city_id', cityId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data, error } as { data: Route[] | null; error: any }
  },

  async getRouteById(id: string) {
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        route_sections (*)
      `)
      .eq('id', id)
      .single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data, error } as { data: (Route & { route_sections: Database['public']['Tables']['route_sections']['Row'][] }) | null; error: any }
  },

  // Itineraries
  async getUserItineraries(userId: string) {
    const { data, error } = await supabase
      .from('itineraries')
      .select(`
        *,
        routes (*)
      `)
      .eq('user_id', userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data, error } as { data: (Itinerary & { routes: Route | null })[] | null; error: any }
  },

  async createItinerary(itinerary: Database['public']['Tables']['itineraries']['Insert']) {
    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('itineraries') as any)
      .insert(itinerary)
      .select()
      .single()
    return { data, error } as { data: Itinerary | null; error: any } // eslint-disable-line @typescript-eslint/no-explicit-any
  },

  async updateItineraryStatus(id: string, status: 'Pending' | 'Completed') {
    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('itineraries') as any)
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    return { data, error } as { data: Itinerary | null; error: any } // eslint-disable-line @typescript-eslint/no-explicit-any
  },

  // Hiking Records
  async getUserHikingRecords(userId: string) {
    const { data, error } = await supabase
      .from('hiking_records')
      .select(`
        *,
        media (*),
        itineraries (
          routes (*)
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })

    if (error) return { data: null, error }

    // Transform data structure to match frontend expectations (flatten routes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedData = data.map((record: any) => ({
      ...record,
      routes: record.itineraries?.routes || null
    }))

    return { data: transformedData, error: null }
  },

  async createHikingRecord(record: Database['public']['Tables']['hiking_records']['Insert']) {
    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('hiking_records') as any)
      .insert(record)
      .select()
      .single()
    return { data, error }
  },

  async createMedia(media: Database['public']['Tables']['media']['Insert']) {
    const { data, error } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('media') as any)
        .insert(media)
    return { data, error }
  },

  // User Stats
  async getUserStats(userId: string) {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .rpc('get_user_stats', { user_uuid: userId } as any)
    return { data, error }
  },

  // User Settings
  async updateUserProfile(userId: string, updates: { username?: string; avatar_url?: string }) {
    // 创建一个超时 Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时，请检查网络连接')), 10000)
    })

    try {
      // 使用 Promise.race 实现超时控制
      const result = await Promise.race([
        (async () => {
          // 1. 优先更新 Auth Metadata (这是前端展示的主要来源)
          const { data: authData, error: authError } = await supabase.auth.updateUser({
            data: {
              ...(updates.username && { username: updates.username }),
              ...(updates.avatar_url && { avatar_url: updates.avatar_url })
            }
          })

          if (authError) {
            throw authError
          }

          // 2. 尝试更新 profiles 表 (如果存在)，但不阻塞流程
          // 注意：如果 profiles 表没有对应的 RLS 策略或记录不存在，这里可能会报错，
          // 但只要 Auth Metadata 更新成功，用户体验上就是成功的。
          const { data: profileData, error: profileError } = await (supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from('profiles') as any)
            .update(updates)
            .eq('id', userId)
            .select()
            .single()

          // 只要 Auth 更新成功，我们就认为操作成功，忽略 profiles 的潜在错误（或者记录日志）
          if (profileError) {
            console.warn('Failed to update profiles table, but auth metadata updated:', profileError)
          }

          return { data: authData || profileData, error: null }
        })(),
        timeoutPromise
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return result as { data: any; error: any }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Update profile failed:', error)
      return { data: null, error: error }
    }
  },

  async updateUserSecurity(securityData: { question: string; answer: string }) {
    // 存储到 Supabase Auth Metadata
    const { data, error } = await supabase.auth.updateUser({
      data: {
        security_question: securityData.question,
        security_answer: securityData.answer // 注意：实际生产中应加密
      }
    })
    return { data, error }
  }
}
