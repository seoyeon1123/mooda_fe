import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .env.local 우선 로드 후 기본 .env 로드
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// 타입 정의
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          kakao_id: string;
          created_at: string;
          user_name: string;
          image: string | null;
          refresh_token: string | null;
          selected_personality_id: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          kakao_id: string;
          created_at?: string;
          user_name: string;
          image?: string | null;
          refresh_token?: string | null;
          selected_personality_id?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          kakao_id?: string;
          created_at?: string;
          user_name?: string;
          image?: string | null;
          refresh_token?: string | null;
          selected_personality_id?: string | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          created_at: string;
          role: string;
          personality_id: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          content: string;
          created_at?: string;
          role: string;
          personality_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          role?: string;
          personality_id?: string | null;
        };
      };
      custom_ai_personalities: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          mbti_types: string;
          system_prompt: string;
          description: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          name: string;
          mbti_types: string;
          system_prompt: string;
          description: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          mbti_types?: string;
          system_prompt?: string;
          description?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      emotion_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          summary: string;
          emotion: string;
          created_at: string;
          character_name: string | null;
          short_summary: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          date: string;
          summary: string;
          emotion: string;
          created_at?: string;
          character_name?: string | null;
          short_summary?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          summary?: string;
          emotion?: string;
          created_at?: string;
          character_name?: string | null;
          short_summary?: string | null;
        };
      };
    };
  };
}
