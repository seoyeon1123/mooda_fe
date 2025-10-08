import { supabase } from './supabase';
import { Database } from './supabase';

type User = Database['public']['Tables']['users']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'];
type CustomAIPersonality =
  Database['public']['Tables']['custom_ai_personalities']['Row'];
type EmotionLog = Database['public']['Tables']['emotion_logs']['Row'];

export class SupabaseService {
  // User 관련 메서드
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  async getUserByKakaoId(kakaoId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('kakao_id', kakaoId)
      .single();

    if (error) {
      console.error('Error fetching user by kakao ID:', error);
      return null;
    }

    return data;
  }

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  }

  async createUser(userData: {
    id: string;
    kakaoId: string;
    userName: string;
    image?: string;
    email?: string;
  }): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userData.id,
        kakao_id: userData.kakaoId,
        user_name: userData.userName,
        image: userData.image,
        email: userData.email,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }

    return data;
  }

  // Conversation 관련 메서드
  async getConversationsByUserIdAndDate(
    userId: string,
    date: string
  ): Promise<Conversation[]> {
    const startDate = new Date(date + 'T00:00:00.000Z');
    const endDate = new Date(date + 'T23:59:59.999Z');

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return data || [];
  }

  async getConversationsByDate(
    userId: string,
    personalityId: string | null,
    date: Date
  ): Promise<Conversation[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (personalityId) {
      query = query.eq('personality_id', personalityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conversations by date:', error);
      return [];
    }

    return data || [];
  }

  async getConversationDates(
    userId: string,
    personalityId: string
  ): Promise<{ created_at: string }[]> {
    let query = supabase
      .from('conversations')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (personalityId) {
      query = query.eq('personality_id', personalityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conversation dates:', error);
      return [];
    }

    return data || [];
  }

  async createConversation(conversationData: {
    id: string;
    userId: string;
    content: string;
    role: string;
    personalityId?: string;
  }): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        id: conversationData.id,
        user_id: conversationData.userId,
        content: conversationData.content,
        role: conversationData.role,
        personality_id: conversationData.personalityId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data;
  }

  // Custom AI Personality 관련 메서드
  async getCustomAIPersonalitiesByUserId(
    userId: string
  ): Promise<CustomAIPersonality[]> {
    const { data, error } = await supabase
      .from('custom_ai_personalities')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching custom AI personalities:', error);
      return [];
    }

    return data || [];
  }

  async getCustomAIPersonalityById(
    id: string,
    userId: string
  ): Promise<CustomAIPersonality | null> {
    const { data, error } = await supabase
      .from('custom_ai_personalities')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching custom AI personality:', error);
      return null;
    }

    return data;
  }

  async createCustomAIPersonality(personalityData: {
    id: string;
    userId: string;
    name: string;
    mbtiTypes: string;
    systemPrompt: string;
    description: string;
  }): Promise<CustomAIPersonality | null> {
    const { data, error } = await supabase
      .from('custom_ai_personalities')
      .insert({
        id: personalityData.id,
        user_id: personalityData.userId,
        name: personalityData.name,
        mbti_types: personalityData.mbtiTypes,
        system_prompt: personalityData.systemPrompt,
        description: personalityData.description,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating custom AI personality:', error);
      return null;
    }

    return data;
  }

  // Emotion Log 관련 메서드
  async getEmotionLogByUserIdAndDate(
    userId: string,
    date: string
  ): Promise<EmotionLog | null> {
    const { data, error } = await supabase
      .from('emotion_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error) {
      console.error('Error fetching emotion log:', error);
      return null;
    }

    return data;
  }

  async getEmotionLogByDate(
    userId: string,
    date: Date
  ): Promise<EmotionLog | null> {
    const dateString = date.toISOString().split('T')[0];
    return this.getEmotionLogByUserIdAndDate(userId, dateString);
  }

  async getEmotionLogs(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EmotionLog[]> {
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('emotion_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateString)
      .lte('date', endDateString)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching emotion logs:', error);
      return [];
    }

    return data || [];
  }

  async createEmotionLog(emotionLogData: {
    id: string;
    userId: string;
    date: Date | string; // Date 또는 string 타입 허용
    summary: string;
    emotion: string;
    characterName?: string;
    shortSummary?: string;
  }): Promise<EmotionLog | null> {
    const dateString =
      typeof emotionLogData.date === 'string'
        ? emotionLogData.date
        : emotionLogData.date.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('emotion_logs')
      .insert({
        id: emotionLogData.id,
        user_id: emotionLogData.userId,
        date: dateString,
        summary: emotionLogData.summary,
        emotion: emotionLogData.emotion,
        character_name: emotionLogData.characterName,
        short_summary: emotionLogData.shortSummary,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating emotion log:', error);
      return null;
    }

    return data;
  }

  async updateEmotionLog(
    id: string,
    updates: Partial<EmotionLog>
  ): Promise<EmotionLog | null> {
    const { data, error } = await supabase
      .from('emotion_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating emotion log:', error);
      return null;
    }

    return data;
  }
}
