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
  async getRoutes(filters?: { status?: string; city_id?: string; limit?: number }) {
    let query = supabase
      .from('routes')
      .select('*, cities(name)')
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.city_id) {
      query = query.eq('city_id', filters.city_id)
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    
    const { data, error } = await query
    return { data, error }
  },

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
      .is('deleted_at', null) // Filter out soft-deleted items
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

  async deleteItinerary(id: string) {
    try {
      const { error } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('itineraries') as any)
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Failed to delete itinerary:', error);
      }
      
      return { error }
    } catch (error) {
      console.error('Unexpected error in deleteItinerary:', error);
      return { error };
    }
  },

  // Hiking Records
  async getUserHikingRecords(userId: string) {
    const { data, error } = await supabase
      .from('hiking_records')
      .select(`
        *,
        media (*),
        routes (*),
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
      // 优先使用直接关联的路线信息，如果没有则使用通过行程关联的路线信息
      routes: record.routes || record.itineraries?.routes || null
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

  async getRecords() {
    const { data, error } = await supabase
      .from('hiking_records')
      .select(`
        *,
        routes(*, cities(*)),
        itinerary:itineraries(*, route:routes(*, city:cities(*))),
        media(*)
      `)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to ensure route information is available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedData = data?.map((record: any) => ({
      ...record,
      // 优先使用直接关联的路线信息，如果没有则使用通过行程关联的路线信息
      route: record.routes || record.itinerary?.route || null
    })) || [];
    
    return transformedData;
  },

  async uploadImage(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('hiking_assets')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('hiking_assets')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  async deleteImage(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('hiking_assets')
      .remove([path]);

    if (error) throw error;
  },

  async deleteMediaByRecordId(recordId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await (supabase
        .from('media') as any)
        .delete()
        .eq('record_id', recordId);

      if (error) {
        console.error('Failed to delete media by record id:', error);
        throw new Error(`删除媒体记录失败: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error in deleteMediaByRecordId:', error);
      return { success: false, error };
    }
  },

  async deleteHikingRecord(recordId: string): Promise<{ success: boolean; error?: any }> {
    try {
      // 1. 首先获取徒步记录，以便获取关联的行程ID
      const { data: record, error: getError } = await (supabase
        .from('hiking_records') as any)
        .select('id, itinerary_id')
        .eq('id', recordId)
        .single();

      if (getError || !record) {
        console.error('Failed to get hiking record:', getError);
        throw new Error(`获取徒步记录失败: ${getError?.message || '记录不存在'}`);
      }

      // 2. 删除徒步记录
      const { error: deleteRecordError } = await (supabase
        .from('hiking_records') as any)
        .delete()
        .eq('id', recordId);

      if (deleteRecordError) {
        console.error('Failed to delete hiking record:', deleteRecordError);
        throw new Error(`删除徒步记录失败: ${deleteRecordError.message}`);
      }

      // 3. 检查该行程是否还有其他徒步记录
      const { data: otherRecords, error: checkError } = await (supabase
        .from('hiking_records') as any)
        .select('id')
        .eq('itinerary_id', record.itinerary_id)
        .limit(1);

      if (checkError) {
        console.error('Failed to check other records:', checkError);
        // 继续执行，不中断流程
      } else if (!otherRecords || otherRecords.length === 0) {
        // 4. 如果没有其他徒步记录，将行程标记为已删除
        const { error: updateItineraryError } = await (supabase
          .from('itineraries') as any)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', record.itinerary_id);

        if (updateItineraryError) {
          console.error('Failed to update itinerary deleted_at:', updateItineraryError);
          // 不抛出错误，因为主要的删除操作已经成功
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error in deleteHikingRecord:', error);
      return { success: false, error };
    }
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
  },

  // Favorites
  async checkIsLiked(userId: string, routeId: string) {
    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('favorites') as any)
      .select('id')
      .eq('user_id', userId)
      .eq('route_id', routeId)
      .maybeSingle()
    
    return { isLiked: !!data, error }
  },

  async toggleLike(userId: string, routeId: string) {
    // Check if already liked
    const { isLiked, error: checkError } = await this.checkIsLiked(userId, routeId)
    if (checkError) return { error: checkError }

    if (isLiked) {
      // Unlike (Delete)
      const { error } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('favorites') as any)
        .delete()
        .eq('user_id', userId)
        .eq('route_id', routeId)
      return { isLiked: false, error }
    } else {
      // Like (Insert)
      const { error } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('favorites') as any)
        .insert({ user_id: userId, route_id: routeId })
      return { isLiked: true, error }
    }
  },

  async getUserFavorites(userId: string) {
    try {
      // 1. 先查询用户的收藏记录
      const { data: favorites, error: favError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (favError) {
        return { data: null, error: favError }
      }

      if (!favorites || favorites.length === 0) {
        return { data: [], error: null }
      }

      // 2. 查询对应的路线信息
      const routeIds = favorites.map((f: any) => f.route_id)
      const { data: routes, error: routesError } = await supabase
        .from('routes')
        .select(`
          *,
          cities (name)
        `)
        .in('id', routeIds)

      if (routesError) {
        return { data: null, error: routesError }
      }

      // 3. 组合数据并过滤掉无效路线
      const combinedData = favorites.map((fav: any) => ({
        ...fav,
        routes: routes?.find((r: any) => r.id === fav.route_id) || null
      }))
      
      // 过滤掉没有对应路线的收藏记录
      const validFavorites = combinedData.filter(fav => fav.routes !== null)

      return { data: validFavorites, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}
