import { NextRequest, NextResponse } from 'next/server';
import { ServerSupabaseService } from '@/lib/server-supabase-service';
import crypto from 'crypto';
import { AI_PERSONALITIES, type AIPersonality } from '@/lib/ai-personalities';

export async function GET() {
  return NextResponse.json({ message: 'Chat API server is running' });
}

export async function POST(request: NextRequest) {
  try {
    const svc = new ServerSupabaseService();
    const { action, data } = (await request.json()) as {
      action: string;
      data: unknown;
    };

    if (action === 'send-message') {
      const { message, userId, personalityId } = data as {
        message: string;
        userId: string;
        personalityId?: string;
      };
      if (!message || !userId)
        return NextResponse.json({ error: 'Bad request' }, { status: 400 });

      // 메시지 저장
      const userMsg = await svc.createConversation({
        id: crypto.randomUUID(),
        userId,
        role: 'user',
        content: message,
        personalityId,
      });

      // 성격 결정 (기본 → 커스텀 우선 적용)
      type ServerCustomAI = {
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
      let personality: AIPersonality | undefined = AI_PERSONALITIES[0];
      if (personalityId) {
        const base = AI_PERSONALITIES.find((p) => p.id === personalityId);
        if (base) {
          personality = base;
        } else {
          try {
            const customs = (await svc.getCustomAIPersonalitiesByUserId(
              userId
            )) as ServerCustomAI[];
            const custom = (customs || []).find(
              (c: ServerCustomAI) => c.id === personalityId
            );
            if (custom) {
              // mbti_types 파싱 후 아이콘 타입 생성 (예: ENFP)
              let mbtiType = 'ENFP';
              try {
                const t =
                  typeof custom.mbti_types === 'string'
                    ? JSON.parse(custom.mbti_types)
                    : custom.mbti_types;
                if (
                  t?.energy &&
                  t?.information &&
                  t?.decisions &&
                  t?.lifestyle
                ) {
                  mbtiType = `${t.energy}${t.information}${t.decisions}${t.lifestyle}`;
                }
              } catch (e) {
                console.error('MBTI 파싱 오류:', e);
              }

              personality = {
                id: custom.id,
                name: custom.name,
                description: custom.description ?? '',
                shortDescription: custom.description ?? '',
                iconType: mbtiType as AIPersonality['iconType'],
                color: 'bg-purple-100 border-purple-300',
                personalitySummary: custom.description ?? '',
                signaturePhrases: [],
                speechStyle: {
                  tone: '자연스러운 반말',
                  reaction: '개성있는 대화',
                  keywords: [],
                },
                systemPrompt: custom.system_prompt ?? '',
                exampleMessages: [],
              };
            }
          } catch (e) {
            console.error('커스텀 AI 조회 실패:', e);
          }
        }
      }

      // 성격별 응답 생성: Gemini 사용 시 시스템 프롬프트 + 최근 대화 맥락 반영
      async function listAvailableModels(): Promise<string[]> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          console.error('GEMINI_API_KEY is missing');
          return [];
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            const text = await res.text();
            console.error('Gemini ListModels error', {
              status: res.status,
              text,
            });
            return [];
          }
          type GeminiModel = {
            name?: string;
            supportedGenerationMethods?: string[];
          };
          type ListModelsResponse = { models?: GeminiModel[] };
          const json = (await res.json()) as ListModelsResponse;
          const names = (json.models ?? [])
            .filter(
              (m) =>
                Array.isArray(m.supportedGenerationMethods) &&
                m.supportedGenerationMethods.includes('generateContent')
            )
            .map((m) =>
              typeof m.name === 'string' ? m.name.replace(/^models\//, '') : ''
            )
            .filter(Boolean);
          names.sort((a, b) => {
            const pa = /flash/i.test(a) ? 0 : 1;
            const pb = /flash/i.test(b) ? 0 : 1;
            return pa - pb || a.localeCompare(b);
          });
          console.log('Gemini available models:', names);
          return names;
        } catch (e) {
          console.error('Gemini ListModels failed', e);
          return [];
        }
      }
      async function callGeminiModel(
        prompt: string,
        model: string
      ): Promise<string> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          console.error('GEMINI_API_KEY is missing');
          return '';
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          });
          if (!res.ok) {
            const text = await res.text();
            console.error('Gemini API error', {
              model,
              status: res.status,
              text,
            });
            return '';
          }
          const json = await res.json();
          const out = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          return typeof out === 'string' ? out : '';
        } catch (e) {
          console.error('Gemini fetch failed', { model, error: e });
          return '';
        }
      }

      async function generateWithModelFallback(
        prompt: string
      ): Promise<string> {
        const preferred = process.env.GEMINI_MODEL?.trim();
        const candidates: string[] = [];
        if (preferred) candidates.push(preferred);
        const listed = await listAvailableModels();
        for (const m of listed) if (!candidates.includes(m)) candidates.push(m);
        const defaults = [
          'gemini-1.5-flash-8b',
          'gemini-1.5-flash',
          'gemini-1.5-pro',
          'gemini-1.0-pro',
        ];
        for (const m of defaults)
          if (!candidates.includes(m)) candidates.push(m);
        for (const m of candidates) {
          const out = (await callGeminiModel(prompt, m)).trim();
          if (out) return out;
        }
        return '';
      }

      // 최근 대화 맥락(오늘) 10개만 사용
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const history = await svc.getConversationsByDate(
        userId,
        personalityId ?? null,
        today
      );
      const lastTurns = history
        .slice(-10)
        .map((m) => `${m.role === 'ai' ? 'Assistant' : 'User'}: ${m.content}`)
        .join('\n');

      const sys = personality?.systemPrompt ?? '';
      const personaName = personality?.name || '무니';
      const prompt = `${sys}

역할: 너는 ${personaName}야. 성격의 톤을 유지해 한국어 반말로 답해.
규칙:
- 150자 이내
- 중복 인사/자기소개 금지
- 사용자가 "누구야"처럼 물으면 1회만 "나는 ${personaName}야"로 간단히 소개 후 바로 핵심 대답
- 바로 이전 대화 맥락을 반영해 자연스럽게 이어가기

대화 기록(최신 10개):
${lastTurns}

새 사용자 메시지: ${message}
짧고 자연스러운 한 문장으로 답변:`;

      let aiText = (await generateWithModelFallback(prompt)).trim();
      if (!aiText) {
        // 간소화 프롬프트로 1차 재시도 (동일 모델)
        const retryPrompt = `${sys}

역할: ${personaName}
규칙: 한국어 반말, 1문장, 150자 이내, 반복 금지
대화 기록(최신):
${lastTurns}

질문: ${message}
답변:`;
        aiText = (await generateWithModelFallback(retryPrompt)).trim();
      }
      if (!aiText) {
        return NextResponse.json(
          {
            error:
              'AI 응답 생성 실패: API 응답이 비었습니다. 키/모델/네트워크를 점검해주세요',
          },
          { status: 503 }
        );
      }
      if (aiText.length > 150) aiText = aiText.slice(0, 150);

      const aiMsg = await svc.createConversation({
        id: crypto.randomUUID(),
        userId,
        role: 'ai',
        content: aiText,
        personalityId,
      });

      return NextResponse.json({
        userMessage: userMsg,
        aiResponse: aiMsg,
        success: true,
        personality: personality
          ? {
              id: personality.id,
              name: personality.name,
              icon: personality.iconType,
            }
          : undefined,
      });
    }

    if (action === 'add-system-message') {
      const { userId, personalityId, content } = data as {
        userId: string;
        personalityId?: string | null;
        content: string;
      };
      console.log('📩 시스템 메시지 저장 요청:', {
        userId,
        personalityId,
        content,
      });

      if (!userId || !content) {
        console.error('❌ 잘못된 요청: userId 또는 content 누락');
        return NextResponse.json({ error: 'Bad request' }, { status: 400 });
      }

      const created = await svc.createConversation({
        id: crypto.randomUUID(),
        userId,
        role: 'system',
        content,
        personalityId: personalityId ?? undefined,
      });

      if (created) {
        console.log('✅ 시스템 메시지 저장 완료:', created);
      } else {
        console.error(
          '❌ 시스템 메시지 저장 실패: createConversation returned null'
        );
      }

      return NextResponse.json({ success: true, message: created });
    }

    if (action === 'analyze-emotion') {
      const { userId } = data as { userId: string };
      if (!userId)
        return NextResponse.json({ error: 'Bad request' }, { status: 400 });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const conversations = await svc.getConversationsByDate(
        userId,
        null,
        today
      );
      if (conversations.length === 0)
        return NextResponse.json(
          { error: 'No conversations to analyze' },
          { status: 400 }
        );
      const allText = conversations.map((c) => c.content).join(' ');
      let emotion = 'Neutral';
      if (/좋|행복|기쁘/.test(allText)) emotion = 'Happy';
      else if (/슬프|우울|힘들/.test(allText)) emotion = 'Sad';
      else if (/화|짜증/.test(allText)) emotion = 'Angry';
      return NextResponse.json({ success: true, emotion, summary: '' });
    }

    if (action === 'get-conversation-history') {
      const { userId, personalityId } = data as {
        userId: string;
        personalityId?: string;
      };
      if (!userId) return NextResponse.json([], { status: 200 });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const list = await svc.getConversationsByDate(
        userId,
        personalityId ?? null,
        today
      );
      return NextResponse.json({ conversations: list, success: true });
    }

    if (action === 'get-conversation-history-by-date') {
      const { userId, personalityId, date } = data as {
        userId: string;
        personalityId?: string | null;
        date: string;
      };
      const target = new Date(date);
      const list = await svc.getConversationsByDate(
        userId,
        personalityId ?? null,
        target
      );
      return NextResponse.json({ conversations: list, success: true });
    }

    if (action === 'get-conversation-dates') {
      const { userId, personalityId } = data as {
        userId: string;
        personalityId: string;
      };
      const dates = await svc.getConversationDates(userId, personalityId);
      const set = new Set<string>();
      dates.forEach((d) => set.add(d.created_at.split('T')[0]));
      return NextResponse.json({
        dates: Array.from(set).sort(),
        success: true,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
