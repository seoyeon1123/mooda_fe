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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const supabase_1 = require("../lib/supabase");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
function migrateToSupabase() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🚀 Supabase 마이그레이션 시작...');
        try {
            // 1. Users 마이그레이션
            console.log('📦 Users 마이그레이션 중...');
            const users = yield prisma.user.findMany();
            for (const user of users) {
                const { error } = yield supabase_1.supabase.from('users').upsert({
                    id: user.id,
                    email: user.email,
                    kakao_id: user.kakaoId,
                    created_at: user.createdAt.toISOString(),
                    user_name: user.userName,
                    image: user.image,
                    refresh_token: user.refreshToken,
                    selected_personality_id: user.selectedPersonalityId,
                });
                if (error) {
                    console.error(`❌ User ${user.id} 마이그레이션 실패:`, error);
                }
                else {
                    console.log(`✅ User ${user.id} 마이그레이션 완료`);
                }
            }
            // 2. Conversations 마이그레이션
            console.log('💬 Conversations 마이그레이션 중...');
            const conversations = yield prisma.conversation.findMany();
            for (const conversation of conversations) {
                const { error } = yield supabase_1.supabase.from('conversations').upsert({
                    id: conversation.id,
                    user_id: conversation.userId,
                    content: conversation.content,
                    created_at: conversation.createdAt.toISOString(),
                    role: conversation.role,
                    personality_id: conversation.personalityId,
                });
                if (error) {
                    console.error(`❌ Conversation ${conversation.id} 마이그레이션 실패:`, error);
                }
                else {
                    console.log(`✅ Conversation ${conversation.id} 마이그레이션 완료`);
                }
            }
            // 3. Custom AI Personalities 마이그레이션
            console.log('🤖 Custom AI Personalities 마이그레이션 중...');
            const customAIs = yield prisma.customAIPersonality.findMany();
            for (const customAI of customAIs) {
                const { error } = yield supabase_1.supabase.from('custom_ai_personalities').upsert({
                    id: customAI.id,
                    user_id: customAI.userId,
                    name: customAI.name,
                    mbti_types: customAI.mbtiTypes,
                    system_prompt: customAI.systemPrompt,
                    description: customAI.description,
                    is_active: customAI.isActive,
                    created_at: customAI.createdAt.toISOString(),
                    updated_at: customAI.updatedAt.toISOString(),
                });
                if (error) {
                    console.error(`❌ Custom AI ${customAI.id} 마이그레이션 실패:`, error);
                }
                else {
                    console.log(`✅ Custom AI ${customAI.id} 마이그레이션 완료`);
                }
            }
            // 4. Emotion Logs 마이그레이션
            console.log('😊 Emotion Logs 마이그레이션 중...');
            const emotionLogs = yield prisma.emotionLog.findMany();
            for (const emotionLog of emotionLogs) {
                const { error } = yield supabase_1.supabase.from('emotion_logs').upsert({
                    id: emotionLog.id,
                    user_id: emotionLog.userId,
                    date: emotionLog.date.toISOString().split('T')[0], // YYYY-MM-DD 형식
                    summary: emotionLog.summary,
                    emotion: emotionLog.emotion,
                    created_at: emotionLog.createdAt.toISOString(),
                    character_name: emotionLog.characterName,
                    short_summary: emotionLog.shortSummary,
                });
                if (error) {
                    console.error(`❌ Emotion Log ${emotionLog.id} 마이그레이션 실패:`, error);
                }
                else {
                    console.log(`✅ Emotion Log ${emotionLog.id} 마이그레이션 완료`);
                }
            }
            console.log('🎉 모든 마이그레이션이 완료되었습니다!');
        }
        catch (error) {
            console.error('❌ 마이그레이션 중 오류 발생:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
// 스크립트 실행
migrateToSupabase();
