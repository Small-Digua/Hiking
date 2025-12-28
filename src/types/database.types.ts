export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      cities: {
        Row: {
          id: string
          name: string
          district: string | null
          description: string | null
          image_url: string | null
        }
        Insert: {
          id?: string
          name: string
          district?: string | null
          description?: string | null
          image_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          district?: string | null
          description?: string | null
          image_url?: string | null
        }
      }
      routes: {
        Row: {
          id: string
          city_id: string
          name: string
          difficulty: number // 1-5
          duration_hours: number
          distance_km: number
          cover_image_url: string | null
        }
        Insert: {
          id?: string
          city_id: string
          name: string
          difficulty: number
          duration_hours: number
          distance_km: number
          cover_image_url?: string | null
        }
        Update: {
          id?: string
          city_id?: string
          name?: string
          difficulty?: number
          duration_hours?: number
          distance_km?: number
          cover_image_url?: string | null
        }
      }
      route_sections: {
        Row: {
          id: string
          route_id: string
          sort_order: number
          content: string
          image_url: string | null
        }
        Insert: {
          id?: string
          route_id: string
          sort_order: number
          content: string
          image_url?: string | null
        }
        Update: {
          id?: string
          route_id?: string
          sort_order?: number
          content?: string
          image_url?: string | null
        }
      }
      itineraries: {
        Row: {
          id: string
          user_id: string
          route_id: string
          planned_date: string
          status: 'Pending' | 'Completed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          route_id: string
          planned_date: string
          status?: 'Pending' | 'Completed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          route_id?: string
          planned_date?: string
          status?: 'Pending' | 'Completed'
          created_at?: string
        }
      }
      hiking_records: {
        Row: {
          id: string
          itinerary_id: string
          user_id: string
          completed_at: string
          feelings: string | null
          distance: number | null
          duration: string | null
          created_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          user_id: string
          completed_at?: string
          feelings?: string | null
          distance?: number | null
          duration?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          user_id?: string
          completed_at?: string
          feelings?: string | null
          distance?: number | null
          duration?: string | null
          created_at?: string
        }
      }
      media: {
        Row: {
          id: string
          record_id: string
          user_id: string
          type: 'Image' | 'Video'
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          record_id: string
          user_id: string
          type: 'Image' | 'Video'
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          record_id?: string
          user_id?: string
          type?: 'Image' | 'Video'
          url?: string
          created_at?: string
        }
      }
    }
  }
}
