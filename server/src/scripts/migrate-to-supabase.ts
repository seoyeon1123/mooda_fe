import { PrismaClient } from '@prisma/client';
import { supabase } from '../lib/supabase';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function migrateToSupabase() {
  console.log('🚀 Supabase 마이그레이션 시작...');

  try {
    // 1. Users 마이그레이션
    console.log('📦 Users 마이그레이션 중...');
    const users = await prisma.user.findMany();

    for (const user of users) {
      const { error } = await supabase.from('users').upsert({
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
      } else {
        console.log(`✅ User ${user.id} 마이그레이션 완료`);
      }
    }

    // 2. Conversations 마이그레이션
    console.log('💬 Conversations 마이그레이션 중...');
    const conversations = await prisma.conversation.findMany();

    for (const conversation of conversations) {
      const { error } = await supabase.from('conversations').upsert({
        id: conversation.id,
        user_id: conversation.userId,
        content: conversation.content,
        created_at: conversation.createdAt.toISOString(),
        role: conversation.role,
        personality_id: conversation.personalityId,
      });

      if (error) {
        console.error(
          `❌ Conversation ${conversation.id} 마이그레이션 실패:`,
          error
        );
      } else {
        console.log(`✅ Conversation ${conversation.id} 마이그레이션 완료`);
      }
    }

    // 3. Custom AI Personalities 마이그레이션
    console.log('🤖 Custom AI Personalities 마이그레이션 중...');
    const customAIs = await prisma.customAIPersonality.findMany();

    for (const customAI of customAIs) {
      const { error } = await supabase.from('custom_ai_personalities').upsert({
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
      } else {
        console.log(`✅ Custom AI ${customAI.id} 마이그레이션 완료`);
      }
    }

    // 4. Emotion Logs 마이그레이션
    console.log('😊 Emotion Logs 마이그레이션 중...');
    const emotionLogs = await prisma.emotionLog.findMany();

    for (const emotionLog of emotionLogs) {
      const { error } = await supabase.from('emotion_logs').upsert({
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
        console.error(
          `❌ Emotion Log ${emotionLog.id} 마이그레이션 실패:`,
          error
        );
      } else {
        console.log(`✅ Emotion Log ${emotionLog.id} 마이그레이션 완료`);
      }
    }

    console.log('🎉 모든 마이그레이션이 완료되었습니다!');
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
migrateToSupabase();
