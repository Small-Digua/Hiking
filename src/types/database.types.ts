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
          status: string | null
          start_point: string | null
          end_point: string | null
          waypoints: string | null
          tags: string[] | null
          description: string | null
          images: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          city_id: string
          name: string
          difficulty: number
          duration_hours: number
          distance_km: number
          cover_image_url?: string | null
          status?: string | null
          start_point?: string | null
          end_point?: string | null
          waypoints?: string | null
          tags?: string[] | null
          description?: string | null
          images?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          city_id?: string
          name?: string
          difficulty?: number
          duration_hours?: number
          distance_km?: number
          cover_image_url?: string | null
          status?: string | null
          start_point?: string | null
          end_point?: string | null
          waypoints?: string | null
          tags?: string[] | null
          description?: string | null
          images?: string[] | null
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      route_tags: {
        Row: {
          id: string
          route_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          route_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          route_id?: string
          tag_id?: string
          created_at?: string
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
          deleted_at?: string | null
        }
        Insert: {
          id?: string
          user_id: string
          route_id: string
          planned_date: string
          status?: 'Pending' | 'Completed'
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          route_id?: string
          planned_date?: string
          status?: 'Pending' | 'Completed'
          created_at?: string
          deleted_at?: string | null
        }
      }
      hiking_records: {
        Row: {
          id: string
          itinerary_id: string | null
          user_id: string
          route_id: string | null
          completed_at: string
          feelings: string | null
          distance: number | null
          duration: string | null
          created_at: string
        }
        Insert: {
          id?: string
          itinerary_id?: string | null
          user_id: string
          route_id?: string | null
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
          route_id?: string | null
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
      favorites: {
        Row: {
          id: string
          user_id: string
          route_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          route_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          route_id?: string
          created_at?: string
        }
      }
    }
  }
}
