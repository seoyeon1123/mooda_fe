import { NextRequest, NextResponse } from 'next/server';
import { ServerSupabaseService } from '@/lib/server-supabase-service';
import crypto from 'crypto';

// 감정 → 아이콘 경로 매핑
function emotionToSvg(emotion: string): string {
  const map: Record<string, string> = {
    VeryHappy: '/images/emotion/veryHappy.svg',
    Happy: '/images/emotion/happy.svg',
    Neutral: '/images/emotion/soso.svg',
    SlightlySad: '/images/emotion/sad.svg',
    Sad: '/images/emotion/sad.svg',
    VerySad: '/images/emotion/verySad.svg',
    Angry: '/images/emotion/angry.svg',
  };
  return map[emotion] || '/images/emotion/soso.svg';
}

// 간단 분석: 사용자 메시지 위주 요약 + 감정 분류
function simpleAnalyzeFromHistory(
  history: Array<{ role: string; content: string }>
): { summary: string; emotion: string } {
  const userLines = history
    .filter((h) => h.role === 'user')
    .map((h) => h.content.trim())
    .filter(Boolean);

  const allText = userLines.join(' ');
  let emotion = 'Neutral';
  if (/좋|행복|기쁘/.test(allText)) emotion = 'Happy';
  else if (/슬프|우울|힘들/.test(allText)) emotion = 'Sad';
  else if (/화|짜증/.test(allText)) emotion = 'Angry';

  const pick = userLines.slice(-2).map((s) => s.slice(0, 20));
  let summary = '';
  if (pick.length === 0) {
    summary = '오늘은 평범한 하루를 보냈어요.';
  } else if (pick.length === 1) {
    summary = `오늘은 ‘${pick[0]}’에 대해 이야기했어요.`;
  } else {
    summary = `오늘은 ‘${pick[0]}’, ‘${pick[1]}’ 등에 대해 이야기했어요.`;
  }

  return { summary, emotion };
}

// 기본 캐릭터 id → 이름 매핑 (커스텀은 DB에서 조회)
const DEFAULT_PERSONA_NAME: Record<string, string> = {
  friendly: '무니',
  calm: '무무',
  wise: '무리',
  energetic: '무크',
};

async function resolvePersonaNameFromHistory(
  svc: ServerSupabaseService,
  history: Array<{
    role: string;
    content: string;
    personality_id?: string | null;
  }>,
  userId: string
): Promise<string | undefined> {
  const lastAI = history
    .filter(
      (h: { role: string; content: string; personality_id?: string | null }) =>
        h.role === 'ai'
    )
    .slice(-1)[0] as
    | { role: string; content: string; personality_id?: string | null }
    | undefined;
  const pid = lastAI?.personality_id ?? undefined;
  if (!pid) return undefined;
  if (DEFAULT_PERSONA_NAME[pid]) return DEFAULT_PERSONA_NAME[pid];
  try {
    const custom = await svc.getCustomAIPersonalityById(pid, userId);
    return custom?.name;
  } catch {
    return undefined;
  }
}

function extractRecommendedItem(text: string): string {
  // "OO를 추천" 패턴이나 "추천" 주변 단어 추출
  const m = text.match(/([가-힣A-Za-z0-9]+)(?:을|를)\s*추천/);
  if (m?.[1]) return m[1];
  const idx = text.indexOf('추천');
  if (idx > 0) {
    const pre = text.slice(Math.max(0, idx - 12), idx).trim();
    const token = pre
      .replace(/[^가-힣A-Za-z0-9]/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(-1)[0];
    if (token) return token;
  }
  return '';
}

function extractRecommendedItems(text: string): string[] {
  // 추천이 언급된 문장에서 후보 추출
  const sentence = (text.match(/[^.!?\n]*추천[^.!?\n]*/)?.[0] || text).trim();
  const idx = sentence.indexOf('추천');
  const windowText =
    idx > 0 ? sentence.slice(Math.max(0, idx - 40), idx) : sentence;
  const raw = windowText
    .replace(/\s*(이나|또는|혹은|랑|과|와|,|\/|\+|＆|&|\|)\s*/g, ',')
    .replace(/[^가-힣A-Za-z0-9,]/g, ' ')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const cleaned = Array.from(new Set(raw.filter((s) => s.length >= 2)));
  if (cleaned.length > 0) return cleaned;
  const single = extractRecommendedItem(text);
  return single ? [single] : [];
}

export async function POST(request: NextRequest) {
  try {
    const { testToday, token } = (await request.json().catch(() => ({}))) as {
      testToday?: boolean;
      token?: string;
    };
    const headerToken = request.headers.get('x-cron-secret') || undefined;
    const expected = process.env.CRON_SECRET;
    if (expected && token !== expected && headerToken !== expected) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      );
    }
    const svc = new ServerSupabaseService();

    // 사용자 전체 조회
    const users = await svc.getUsers();
    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    const date = new Date();
    if (testToday) {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setDate(date.getDate() - 1);
      date.setHours(0, 0, 0, 0);
    }

    let processed = 0;
    for (const user of users) {
      try {
        const history = await svc.getConversationsByDate(user.id, null, date);
        if (history.length === 0) continue;

        // 1차 요약/감정
        const analyzed = simpleAnalyzeFromHistory(
          history as Array<{ role: string; content: string }>
        );
        let summary = analyzed.summary;
        const emotion = analyzed.emotion;
        const characterName = emotionToSvg(emotion);

        // 상황 인지: 메뉴/추천 요청이면 내러티브 요약으로 보강
        const userTextAll = history
          .filter((h: { role: string; content: string }) => h.role === 'user')
          .map((h: { role: string; content: string }) => h.content)
          .join(' ') as string;
        const askedMenu = /(야식|메뉴|배고파|뭐 먹|추천)/.test(userTextAll);
        if (askedMenu) {
          const lastAI = history
            .filter(
              (h: {
                role: string;
                content: string;
                personality_id?: string | null;
              }) => h.role === 'ai'
            )
            .slice(-1)[0] as
            | { content: string; personality_id?: string | null }
            | undefined;
          const personaName = await resolvePersonaNameFromHistory(
            svc,
            history as Array<{
              role: string;
              content: string;
              personality_id?: string | null;
            }>,
            user.id
          );
          const items = lastAI?.content
            ? extractRecommendedItems(lastAI.content)
            : [];
          if (personaName) {
            const lastUser = (history
              .filter(
                (h: { role: string; content: string }) => h.role === 'user'
              )
              .map((h: { role: string; content: string }) => h.content.trim())
              .filter(Boolean)
              .slice(-1)[0] || '') as string;
            const isMenuAsk = /(야식|메뉴|배고파|뭐 먹|추천)/.test(lastUser);
            if (items.length >= 2) {
              const head = items.slice(0, 3).join(', ');
              summary =
                !lastUser || isMenuAsk
                  ? `오늘은 야식 메뉴를 물어봐서 ${personaName}가 ${head}를 추천해줬어요.`
                  : `오늘은 야식 메뉴를 물어봐서 ${personaName}가 ${head}를 추천해줬고, ‘${lastUser.slice(
                      0,
                      20
                    )}’에 대해서도 이야기했어요.`;
            } else if (items.length === 1) {
              const item = items[0];
              summary =
                !lastUser || isMenuAsk
                  ? `오늘은 야식 메뉴를 물어봐서 ${personaName}가 ${item}을 추천해줬어요.`
                  : `오늘은 야식 메뉴를 물어봐서 ${personaName}가 ${item}을 추천해줬고, ‘${lastUser.slice(
                      0,
                      20
                    )}’에 대해서도 이야기했어요.`;
            } else {
              summary =
                !lastUser || isMenuAsk
                  ? `오늘은 야식 메뉴를 물어봐서 ${personaName}가 메뉴를 추천해줬어요.`
                  : `오늘은 야식 메뉴를 물어봐서 ${personaName}가 메뉴를 추천해줬고, ‘${lastUser.slice(
                      0,
                      20
                    )}’에 대해서도 이야기했어요.`;
            }
          }
        }

        // emotion_logs upsert 유사 구현
        // 기존 로그 확인
        const exist = await svc.getEmotionLogByDate(user.id, date);
        if (exist) {
          await svc.updateEmotionLog(exist.id, {
            summary: `${emotion} 85%`,
            emotion,
            short_summary: summary,
            character_name: characterName,
          });
        } else {
          await svc.createEmotionLog({
            id: crypto.randomUUID(),
            userId: user.id,
            date,
            summary: `${emotion} 85%`,
            emotion,
            shortSummary: summary,
            characterName,
          });
        }
        processed += 1;
      } catch (e) {
        // 개별 사용자 실패는 무시하고 계속 진행
        console.error('daily run error for user', user.id, e);
      }
    }

    return NextResponse.json({ success: true, processed });
  } catch (error) {
    console.error('run-daily-emotion-analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
