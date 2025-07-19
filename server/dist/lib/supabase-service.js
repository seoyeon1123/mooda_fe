"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const supabase_1 = require("./supabase");
class SupabaseService {
    // User 관련 메서드
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                console.error('Error fetching user:', error);
                return null;
            }
            return data;
        });
    }
    getUserByKakaoId(kakaoId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
                .from('users')
                .select('*')
                .eq('kakao_id', kakaoId)
                .single();
            if (error) {
                console.error('Error fetching user by kakao ID:', error);
                return null;
            }
            return data;
        });
    }
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase.from('users').select('*');
            if (error) {
                console.error('Error fetching users:', error);
                return [];
            }
            return data || [];
        });
    }
    createUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
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
        });
    }
    updateUser(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
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
        });
    }
    // Conversation 관련 메서드
    getConversationsByUserIdAndDate(userId, date) {
        return __awaiter(this, void 0, void 0, function* () {
            const startDate = new Date(date + 'T00:00:00.000Z');
            const endDate = new Date(date + 'T23:59:59.999Z');
            const { data, error } = yield supabase_1.supabase
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
        });
    }
    getConversationsByDate(userId, personalityId, date) {
        return __awaiter(this, void 0, void 0, function* () {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            let query = supabase_1.supabase
                .from('conversations')
                .select('*')
                .eq('user_id', userId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: true });
            if (personalityId) {
                query = query.eq('personality_id', personalityId);
            }
            const { data, error } = yield query;
            if (error) {
                console.error('Error fetching conversations by date:', error);
                return [];
            }
            return data || [];
        });
    }
    getConversationDates(userId, personalityId) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = supabase_1.supabase
                .from('conversations')
                .select('created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });
            if (personalityId) {
                query = query.eq('personality_id', personalityId);
            }
            const { data, error } = yield query;
            if (error) {
                console.error('Error fetching conversation dates:', error);
                return [];
            }
            return data || [];
        });
    }
    createConversation(conversationData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
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
        });
    }
    // Custom AI Personality 관련 메서드
    getCustomAIPersonalitiesByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
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
        });
    }
    getCustomAIPersonalityById(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
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
        });
    }
    createCustomAIPersonality(personalityData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
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
        });
    }
    // Emotion Log 관련 메서드
    getEmotionLogByUserIdAndDate(userId, date) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
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
        });
    }
    getEmotionLogByDate(userId, date) {
        return __awaiter(this, void 0, void 0, function* () {
            const dateString = date.toISOString().split('T')[0];
            return this.getEmotionLogByUserIdAndDate(userId, dateString);
        });
    }
    getEmotionLogs(userId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const startDateString = startDate.toISOString().split('T')[0];
            const endDateString = endDate.toISOString().split('T')[0];
            const { data, error } = yield supabase_1.supabase
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
        });
    }
    createEmotionLog(emotionLogData) {
        return __awaiter(this, void 0, void 0, function* () {
            const dateString = emotionLogData.date.toISOString().split('T')[0];
            const { data, error } = yield supabase_1.supabase
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
        });
    }
    updateEmotionLog(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
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
        });
    }
}
exports.SupabaseService = SupabaseService;
