import { getSupabaseServer } from './supabase-server';

export type DiaryEntryRow = {
  id: string;
  user_id: string;
  date: string;
  emotion: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type UserRow = {
  id: string;
  email: string | null;
  kakao_id: string;
  user_name: string;
  image: string | null;
  selected_personality_id: string | null;
};

export type ConversationRow = {
  id: string;
  user_id: string;
  content: string;
  role: string;
  personality_id: string | null;
  created_at: string;
};

export type EmotionLogRow = {
  id: string;
  user_id: string;
  date: string;
  summary: string;
  emotion: string;
  character_name: string | null;
  short_summary: string | null;
};

export class ServerSupabaseService {
  private formatLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  async getUsers(): Promise<UserRow[]> {
    const { data, error } = await getSupabaseServer()
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });
    if (error || !data) return [] as UserRow[];
    return data as UserRow[];
  }
  async getUserById(id: string): Promise<UserRow | null> {
    const { data, error } = await getSupabaseServer()
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return null;
    return data as UserRow | null;
  }

  async getCustomAIPersonalitiesByUserId(userId: string): Promise<
    Array<{
      id: string;
      user_id: string;
      name: string;
      mbti_types: string;
      system_prompt: string;
      description: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>
  > {
    const { data, error } = await getSupabaseServer()
      .from('custom_ai_personalities')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as Array<{
      id: string;
      user_id: string;
      name: string;
      mbti_types: string;
      system_prompt: string;
      description: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>;
  }

  async getCustomAIPersonalityById(
    id: string,
    userId: string
  ): Promise<{
    id: string;
    user_id: string;
    name: string;
    mbti_types: string;
    system_prompt: string;
    description: string;
    is_active: boolean;
  } | null> {
    const { data, error } = await getSupabaseServer()
      .from('custom_ai_personalities')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) return null;
    return (
      (data as {
        id: string;
        user_id: string;
        name: string;
        mbti_types: string;
        system_prompt: string;
        description: string;
        is_active: boolean;
      }) || null
    );
  }

  async createCustomAIPersonality(personality: {
    id: string;
    userId: string;
    name: string;
    mbtiTypes: string;
    systemPrompt: string;
    description: string;
  }) {
    const { data, error } = await getSupabaseServer()
      .from('custom_ai_personalities')
      .insert({
        id: personality.id,
        user_id: personality.userId,
        name: personality.name,
        mbti_types: personality.mbtiTypes,
        system_prompt: personality.systemPrompt,
        description: personality.description,
        is_active: true,
      })
      .select()
      .single();
    if (error) return null;
    return data as {
      id: string;
      user_id: string;
      name: string;
      mbti_types: string;
      system_prompt: string;
      description: string;
      is_active: boolean;
      created_at?: string;
      updated_at?: string;
    };
  }

  async deleteCustomAIPersonality(id: string): Promise<boolean> {
    const { error } = await getSupabaseServer()
      .from('custom_ai_personalities')
      .update({ is_active: false })
      .eq('id', id);
    return !error;
  }
  async getUserByKakaoId(kakaoId: string): Promise<UserRow | null> {
    const { data, error } = await getSupabaseServer()
      .from('users')
      .select('*')
      .eq('kakao_id', kakaoId)
      .maybeSingle();
    if (error) return null;
    return data as UserRow | null;
  }

  async createUser(user: {
    id: string;
    kakaoId: string;
    userName: string;
    image?: string;
    email?: string;
  }): Promise<UserRow | null> {
    const { data, error } = await getSupabaseServer()
      .from('users')
      .insert({
        id: user.id,
        kakao_id: user.kakaoId,
        user_name: user.userName,
        image: user.image,
        email: user.email,
        // 최초 생성 시 기본 캐릭터: 무니(friendly)
        selected_personality_id: 'friendly',
      })
      .select()
      .single();
    if (error) return null;
    return data as UserRow;
  }

  async updateUser(
    id: string,
    updates: Partial<UserRow>
  ): Promise<UserRow | null> {
    const { data, error } = await getSupabaseServer()
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return data as UserRow;
  }

  async createConversation(conv: {
    id: string;
    userId: string;
    role: string;
    content: string;
    personalityId?: string;
  }): Promise<ConversationRow | null> {
    const { data, error } = await getSupabaseServer()
      .from('conversations')
      .insert({
        id: conv.id,
        user_id: conv.userId,
        role: conv.role,
        content: conv.content,
        personality_id: conv.personalityId ?? null,
      })
      .select()
      .single();
    if (error) return null;
    return data as ConversationRow;
  }

  async getConversationsByDate(
    userId: string,
    personalityId: string | null,
    date: Date
  ): Promise<ConversationRow[]> {
    // 날짜를 YYYY-MM-DD 형식으로 변환
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // 한국 시간(KST, UTC+9) 기준으로 하루의 시작과 끝을 UTC로 변환
    // 한국 시간 2025-10-23 00:00:00 = UTC 2025-10-22 15:00:00
    // 한국 시간 2025-10-23 23:59:59 = UTC 2025-10-23 14:59:59
    const startKST = new Date(`${dateStr}T00:00:00+09:00`);
    const endKST = new Date(`${dateStr}T23:59:59.999+09:00`);
    
    // UTC로 변환 (toISOString() 사용)
    const startUTC = startKST.toISOString();
    const endUTC = endKST.toISOString();

    console.log(`대화 조회: 날짜=${dateStr}, 시작(KST)=${dateStr} 00:00, 시작(UTC)=${startUTC}, 끝(UTC)=${endUTC}`);

    let query = getSupabaseServer()
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startUTC)
      .lte('created_at', endUTC)
      .order('created_at', { ascending: true });

    if (personalityId) query = query.eq('personality_id', personalityId);

    const { data, error } = await query;
    if (error) {
      console.error('대화 조회 오류:', error);
      return [];
    }
    console.log(`조회된 대화 개수: ${data?.length || 0}`);
    if (data && data.length > 0) {
      console.log(`첫 번째 대화 시간: ${(data[0] as ConversationRow).created_at}`);
      console.log(`마지막 대화 시간: ${(data[data.length - 1] as ConversationRow).created_at}`);
    }
    return (data as ConversationRow[]) || [];
  }

  async getConversationDates(
    userId: string,
    personalityId: string
  ): Promise<{ created_at: string }[]> {
    let query = getSupabaseServer()
      .from('conversations')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (personalityId) query = query.eq('personality_id', personalityId);
    const { data, error } = await query;
    if (error || !data) return [];
    return data as { created_at: string }[];
  }

  async getLastConversationPersonality(userId: string): Promise<string | null> {
    const { data, error } = await getSupabaseServer()
      .from('conversations')
      .select('personality_id')
      .eq('user_id', userId)
      .not('personality_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return (data[0].personality_id as string) || null;
  }

  async getEmotionLogs(
    userId: string,
    start: Date,
    end: Date
  ): Promise<EmotionLogRow[]> {
    const startS = this.formatLocalDateString(start);
    const endS = this.formatLocalDateString(end);
    const { data, error } = await getSupabaseServer()
      .from('emotion_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startS)
      .lte('date', endS)
      .order('date', { ascending: true });
    if (error || !data) return [];
    return data as EmotionLogRow[];
  }

  async getEmotionLogByDate(
    userId: string,
    date: Date
  ): Promise<EmotionLogRow | null> {
    const dateS = this.formatLocalDateString(date);
    const { data, error } = await getSupabaseServer()
      .from('emotion_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateS)
      .maybeSingle();
    if (error) return null;
    return (data as EmotionLogRow) || null;
  }

  async createEmotionLog(log: {
    id: string;
    userId: string;
    date: Date | string;
    summary: string;
    emotion: string;
    characterName?: string;
    shortSummary?: string;
  }): Promise<EmotionLogRow | null> {
    const dateString =
      typeof log.date === 'string'
        ? log.date
        : this.formatLocalDateString(log.date);
    const { data, error } = await getSupabaseServer()
      .from('emotion_logs')
      .insert({
        id: log.id,
        user_id: log.userId,
        date: dateString,
        summary: log.summary,
        emotion: log.emotion,
        character_name: log.characterName ?? null,
        short_summary: log.shortSummary ?? null,
      })
      .select()
      .single();
    if (error) return null;
    return data as EmotionLogRow;
  }

  async updateEmotionLog(
    id: string,
    updates: Partial<EmotionLogRow>
  ): Promise<EmotionLogRow | null> {
    const { data, error } = await getSupabaseServer()
      .from('emotion_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return data as EmotionLogRow;
  }

  async createDiaryEntry(entry: {
    id: string;
    userId: string;
    date: Date | string;
    emotion: string;
    title: string;
    content: string;
  }): Promise<DiaryEntryRow | null> {
    const { data, error } = await getSupabaseServer()
      .from('diary_entries')
      .insert({
        id: entry.id,
        user_id: entry.userId,
        date: entry.date,
        emotion: entry.emotion,
        title: entry.title,
        content: entry.content,
      })
      .select()
      .single();

    if (error) {
      console.error('일기 생성 오류', error);
      return null;
    }

    return data as DiaryEntryRow;
  }

  async getDiaryEntries(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<DiaryEntryRow[]> {
    let query = getSupabaseServer()
      .from('diary_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit ?? 0));

    const { data, error } = await query;
    if (error || !data) return [];
    return data as DiaryEntryRow[];
  }

  async getDiaryEntryById(
    id: string,
    userId: string
  ): Promise<DiaryEntryRow | null> {
    const { data, error } = await getSupabaseServer()
      .from('diary_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('일기 조회 오류', error);
      return null;
    }
    return data as DiaryEntryRow | null;
  }

  async updateDiaryEntry(
    id: string,
    userId: string,
    updates: {
      emotion?: string;
      title?: string;
      content?: string;
    }
  ): Promise<DiaryEntryRow | null> {
    const { data, error } = await getSupabaseServer()
      .from('diary_entries')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) return null;
    return data as DiaryEntryRow;
  }
  // 일기 삭제
  async deleteDiaryEntry(id: string, userId: string): Promise<boolean> {
    const { error } = await getSupabaseServer()
      .from('diary_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }
}
