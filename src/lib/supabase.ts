import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          role: 'client' | 'vendor' | 'admin'
          business_name: string | null
          category: string | null
          city: string | null
          latitude: number | null
          longitude: number | null
          created_at: string
        }
      }
      requests: {
        Row: {
          id: string
          client_id: string
          category: string
          part_name: string
          description: string
          image_url: string | null
          preferred_company: string | null
          area_radius: number | null
          area_city: string | null
          latitude: number | null
          longitude: number | null
          status: 'open' | 'closed'
          created_at: string
        }
      }
      request_responses: {
        Row: {
          id: string
          request_id: string
          vendor_id: string
          status: 'accepted' | 'rejected'
          created_at: string
        }
      }
    }
  }
}
