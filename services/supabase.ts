import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzU3NDcsImV4cCI6MjA3OTkxMTc0N30.Pzk2Zrp08-f93VoApIj6QjWx_9nEQSkZFRU_t1UX_ow';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Export config for use in raw fetch flows
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable SDK-managed session persistence to avoid storage hang
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storage: undefined,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'yolmov-web'
    }
  }
});

// Helper types for database
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Database type definitions (will be generated after schema creation)
export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          phone: string;
          email: string | null;
          avatar_url: string | null;
          city: string | null;
          district: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      // Diğer tablolar schema oluşturulduktan sonra eklenecek
    };
    Enums: {
      request_status: 'open' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
      offer_status: 'sent' | 'accepted' | 'rejected' | 'withdrawn';
      admin_role: 'super_admin' | 'support' | 'finance' | 'operations';
    };
  };
}
