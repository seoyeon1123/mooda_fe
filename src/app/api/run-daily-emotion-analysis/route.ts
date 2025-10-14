import { NextRequest, NextResponse } from 'next/server';
import { ServerSupabaseService } from '@/lib/server-supabase-service';
import crypto from 'crypto';

// ==================== 유틸리티 함수 ====================

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

// 영어 감정 → 한국어 라벨 매핑
function emotionKoLabel(emotion: string): string {
  const map: Record<string, string> = {
    VeryHappy: '신남',
    Happy: '행복',
    Neutral: '평온',
    SlightlySad: '불안',
    Sad: '슬픔',
    VerySad: '매우슬픔',
    Angry: '화남',
  };
  return map[emotion] || emotion;
}

// 기본 캐릭터 id → 이름 매핑
const DEFAULT_PERSONA_NAME: Record<string, string> = {
  friendly: '무니',
  calm: '무무',
  wise: '무리',
  energetic: '무크',
};

// 대화 히스토리에서 페르소나 이름 추출
async function resolvePersonaNameFromHistory(
  svc: ServerSupabaseService,
  history: Array<{
    role: string;
    content: string;
    personality_id?: string | null;
  }>,
  userId: string
): Promise<string | undefined> {
  const lastAI = history.filter((h) => h.role === 'ai').slice(-1)[0];

  const pid = lastAI?.personality_id ?? undefined;
  if (!pid) return undefined;

  // 기본 캐릭터 확인
  if (DEFAULT_PERSONA_NAME[pid]) return DEFAULT_PERSONA_NAME[pid];

  // 커스텀 캐릭터 조회
  try {
    const custom = await svc.getCustomAIPersonalityById(pid, userId);
    return custom?.name;
  } catch {
    return undefined;
  }
}

// ==================== 음식 추출 관련 ====================

// 음식/메뉴 키워드 목록
const FOOD_KEYWORDS = [
  '치킨',
  '피자',
  '떡볶이',
  '라면',
  '족발',
  '보쌈',
  '회',
  '초밥',
  '햄버거',
  '짜장면',
  '짬뽕',
  '탕수육',
  '마라탕',
  '김밥',
  '돈까스',
  '곱창',
  '삼겹살',
  '불고기',
  '찜닭',
  '국밥',
  '칼국수',
  '수제비',
  '파스타',
  '스테이크',
  '샐러드',
  '샌드위치',
  '토스트',
  '와플',
  '요거트',
  '아이스크림',
  '케이크',
  '과자',
  '빵',
  '만두',
  '순대',
  '찌개',
  '전골',
  '쌈밥',
  '비빔밥',
  '김치볶음밥',
  '볶음밥',
  '냉면',
  '우동',
  '소바',
  '돈부리',
  '카레',
  '리조또',
  '그라탕',
  '수프',
];

// AI 응답에서 음식 이름만 추출
function extractRecommendedItems(aiResponse: string): string[] {
  const items: string[] = [];

  // 음식 키워드 매칭
  for (const keyword of FOOD_KEYWORDS) {
    if (aiResponse.includes(keyword)) {
      items.push(keyword);
    }
  }

  // 중복 제거 및 최대 3개까지만
  return [...new Set(items)].slice(0, 3);
}

// ==================== 감정 분석 ====================
// ==================== 감정 분석 (개선) ====================

async function analyzeEmotionWithAI(
  history: Array<{ role: string; content: string }>
): Promise<{ emotion: string }> {
  const userMessages = history
    .filter((h) => h.role === 'user')
    .map((h) => h.content.trim())
    .filter(Boolean);

  if (userMessages.length === 0) {
    return { emotion: 'Neutral' };
  }

  const conversationText = userMessages.join('\n');

  const prompt = `당신은 감정 분석 전문가입니다. 아래 대화에서 사용자의 전반적인 감정 상태를 정확히 판단하세요.

**중요**: 반드시 아래 7가지 감정 중 하나만 선택하세요.

감정 분류 기준:
- VeryHappy: 매우 긍정적 (예: 신나, 최고, 완전 좋아, 행복해)
- Happy: 긍정적 (예: 좋아, 기쁘다, 즐거워, 괜찮아)
- Neutral: 중립적 (예: 그냥 그래, 평범해, 보통)
- SlightlySad: 약간 부정적 (예: 조금 슬퍼, 불안해, 걱정돼)
- Sad: 부정적 (예: 슬퍼, 우울해, 힘들어, 외로워)
- VerySad: 매우 부정적 (예: 너무 힘들어, 죽고 싶어, 최악)
- Angry: 분노 (예: 화나, 짜증나, 빡쳐, 열받아, 개빡, 개같아, 씨발, ㅈㄴ)

**분석 규칙**:
1. 강한 욕설이나 분노 표현(개빡, 짜증, 열받아 등)이 있으면 → Angry
2. 부정적 감정이 명확하면 → Sad 계열
3. 긍정적 감정이 명확하면 → Happy 계열
4. 애매하면 → Neutral

대화 내용:
${conversationText}

**출력**: 감정 단어 하나만 정확히 출력하세요. 설명 없이 단어만 적으세요.

예시 출력:
Angry`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1, // 더 낮춤
            maxOutputTokens: 20,
          },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    // 감정 단어 추출 (대소문자 무시)
    const emotionMatch = text.match(
      /^(VeryHappy|Happy|Neutral|SlightlySad|Sad|VerySad|Angry)$/i
    );
    const extractedEmotion = emotionMatch ? emotionMatch[1] : null;

    if (extractedEmotion) {
      // 첫 글자 대문자로 정규화
      const normalizedEmotion =
        extractedEmotion.charAt(0).toUpperCase() +
        extractedEmotion.slice(1).toLowerCase();

      // VeryHappy, VerySad, SlightlySad 같은 복합어 처리
      const validEmotions = [
        'VeryHappy',
        'Happy',
        'Neutral',
        'SlightlySad',
        'Sad',
        'VerySad',
        'Angry',
      ];
      const matched = validEmotions.find(
        (e) => e.toLowerCase() === normalizedEmotion.toLowerCase()
      );

      if (matched) {
        return { emotion: normalizedEmotion };
      }
    }

    console.warn('AI 감정 분석 형식 오류, 폴백 사용. AI 응답:', text);
    return simpleAnalyzeEmotion(history);
  } catch (error) {
    console.error('AI 감정 분석 오류:', error);
    return simpleAnalyzeEmotion(history);
  }
}

// 간단 감정 분석 (폴백용) - 개선
function simpleAnalyzeEmotion(
  history: Array<{ role: string; content: string }>
): { emotion: string } {
  const userLines = history
    .filter((h) => h.role === 'user')
    .map((h) => h.content.trim())
    .filter(Boolean);

  const allText = userLines.join(' ').toLowerCase();

  // 우선순위: 강한 감정부터 체크
  // 1. 분노 (가장 강한 표현들)
  if (
    /(개빡|빡쳐|열받|짜증|화나|ㅅㅂ|시발|씨발|ㅈㄴ|개같|병신)/.test(allText)
  ) {
    return { emotion: 'Angry' };
  }

  // 2. 매우 슬픔
  if (/(죽고\s*싶|최악|너무\s*힘들|완전\s*우울|진짜\s*힘들)/.test(allText)) {
    return { emotion: 'VerySad' };
  }

  // 3. 슬픔
  if (/(슬프|우울|힘들|외로|쓸쓸|속상|눈물)/.test(allText)) {
    return { emotion: 'Sad' };
  }

  // 4. 약간 슬픔/불안
  if (/(불안|걱정|긴장|조마조마|초조)/.test(allText)) {
    return { emotion: 'SlightlySad' };
  }

  // 5. 매우 행복
  if (/(완전\s*좋|최고|신나|행복해|기분\s*짱|대박|ㅋㅋㅋㅋ)/.test(allText)) {
    return { emotion: 'VeryHappy' };
  }

  // 6. 행복
  if (/(좋아|기쁘|즐거|괜찮|굿|ㅋㅋ)/.test(allText)) {
    return { emotion: 'Happy' };
  }

  // 7. 기본값
  return { emotion: 'Neutral' };
}

// ==================== 요약 생성 (개선) ====================

async function generateNarrativeSummary(
  history: Array<{
    role: string;
    content: string;
    personality_id?: string | null;
  }>,
  personaName?: string
): Promise<string> {
  const userMessages = history
    .filter((h) => h.role === 'user')
    .map((h) => h.content.trim())
    .filter(Boolean);

  if (userMessages.length === 0) {
    return '오늘은 평범한 하루를 보냈어요.';
  }

  // 전체 대화를 보여줌 (최대 20개)
  const conversationContext = history
    .slice(-20)
    .map(
      (h) =>
        `${h.role === 'user' ? '사용자' : personaName || 'AI'}: ${h.content}`
    )
    .join('\n');

  const prompt = `아래는 사용자와 AI의 대화입니다. 이 대화를 자연스러운 이야기체로 요약해주세요.

대화 내용:
${conversationContext}

**요약 작성 규칙**:
1. 80-150자 분량
2. 대화의 핵심 내용과 흐름을 담기
   - 사용자가 무엇을 느꼈는지 (짜증, 화남, 기쁨 등)
   - 무슨 일이 있었는지 (일 많음, 스트레스 등)
   - AI가 무엇을 추천했는지 (구체적 음식명 2개까지)
3. "${personaName || 'AI'}가 ~을(를) 추천해줬어요" 형식 사용
4. 자연스러운 한국어로 작성

**좋은 요약 예시**:
- "오늘 일이 너무 많아서 짜증났는데, ${
    personaName || 'AI'
  }가 매운 떡볶이를 추천해줬어요."
- "집에서도 일해야 해서 화가 났지만, ${
    personaName || 'AI'
  }와 떡볶이 얘기하면서 기분이 풀렸어요."
- "스트레스 받는 하루였는데 ${
    personaName || 'AI'
  }가 치킨이랑 피자를 추천해줘서 위로받았어요."

**주의사항**:
- AI의 말투("아이고", "진짜?", "ㄱㄱ" 등)를 그대로 쓰지 마세요
- 이모지는 절대 포함하지 마세요
- 사용자 감정을 정확히 반영하세요 (화남, 짜증, 스트레스 등)

요약만 출력하세요:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    const data = await response.json();
    let summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!summary) {
      throw new Error('AI 응답 없음');
    }

    // 따옴표, 이모지 제거
    summary = summary
      .replace(/^["']|["']$/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .trim();

    // 품질 검증
    if (summary.length >= 30 && summary.length <= 300) {
      // 부적절한 내용 필터링
      const hasInappropriate = /(병신|꺼저|ㅅㅂ|시발|개새)/.test(summary);

      if (!hasInappropriate) {
        return summary;
      }
    }

    console.warn('AI 요약 품질 미달, 폴백 사용. 길이:', summary.length);
    return generateFallbackSummary(history, personaName);
  } catch (error) {
    console.error('AI 요약 생성 오류:', error);
    return generateFallbackSummary(history, personaName);
  }
}

// 폴백 요약 생성 (개선)
function generateFallbackSummary(
  history: Array<{
    role: string;
    content: string;
    personality_id?: string | null;
  }>,
  personaName?: string
): string {
  const persona = personaName || 'AI';

  const userMessages = history
    .filter((h) => h.role === 'user')
    .map((h) => h.content.trim())
    .filter(Boolean);

  const aiMessages = history
    .filter((h) => h.role === 'ai')
    .map((h) => h.content.trim())
    .filter(Boolean);

  // 사용자 감정 분석
  const allUserText = userMessages.join(' ');
  let emotionText = '';

  if (/(개빡|짜증|화|열받|빡)/.test(allUserText)) {
    emotionText = '짜증나서';
  } else if (/(힘들|우울|슬프|외로)/.test(allUserText)) {
    emotionText = '힘들어서';
  } else if (/(불안|걱정)/.test(allUserText)) {
    emotionText = '불안해서';
  } else if (/(좋|행복|기쁨)/.test(allUserText)) {
    emotionText = '기분 좋아서';
  }

  // 음식 추천 감지
  const lastAiMsg = aiMessages[aiMessages.length - 1] || '';
  const recommendedFoods = extractRecommendedItems(lastAiMsg);

  if (recommendedFoods.length > 0) {
    const foodList = recommendedFoods.slice(0, 2).join('이나 ');

    if (emotionText) {
      return `오늘 ${emotionText} ${persona}에게 얘기했더니 ${foodList}를 추천해줬어요.`;
    }
    return `오늘은 ${persona}에게 메뉴를 물어봤더니 ${foodList}를 추천해줬어요.`;
  }

  // 일반 대화
  if (emotionText) {
    return `오늘은 ${emotionText} ${persona}와 이야기를 나눴어요.`;
  }

  return `오늘은 ${persona}와 대화하며 하루를 보냈어요.`;
}

// extractRecommendedItems 함수는 기존 코드 그대로 사용
// ==================== 메인 POST 핸들러 ====================

export async function POST(request: NextRequest) {
  try {
    const { testToday, token } = (await request.json().catch(() => ({}))) as {
      testToday?: boolean;
      token?: string;
    };

    // 인증 확인
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

    // 날짜 설정 (테스트 모드면 오늘, 아니면 어제)
    const date = new Date();
    if (testToday) {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setDate(date.getDate() - 1);
      date.setHours(0, 0, 0, 0);
    }

    let processed = 0;

    // 각 사용자별 처리
    for (const user of users) {
      try {
        // 해당 날짜의 대화 내역 조회
        const history = await svc.getConversationsByDate(user.id, null, date);
        if (history.length === 0) continue;

        // 1. 페르소나 이름 추출
        const personaName = await resolvePersonaNameFromHistory(
          svc,
          history as Array<{
            role: string;
            content: string;
            personality_id?: string | null;
          }>,
          user.id
        );

        // 2. 감정 분석
        const { emotion } = await analyzeEmotionWithAI(
          history as Array<{ role: string; content: string }>
        );
        const emotionKo = emotionKoLabel(emotion);
        const characterName = emotionToSvg(emotion);

        // 3. 자연스러운 요약 생성
        const summary = await generateNarrativeSummary(
          history as Array<{
            role: string;
            content: string;
            personality_id?: string | null;
          }>,
          personaName
        );

        // 4. DB 저장 (upsert)
        const exist = await svc.getEmotionLogByDate(user.id, date);
        if (exist) {
          await svc.updateEmotionLog(exist.id, {
            summary: `${emotionKo} 85%`,
            emotion,
            short_summary: summary,
            character_name: characterName,
          });
        } else {
          await svc.createEmotionLog({
            id: crypto.randomUUID(),
            userId: user.id,
            date,
            summary: `${emotionKo} 85%`,
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
