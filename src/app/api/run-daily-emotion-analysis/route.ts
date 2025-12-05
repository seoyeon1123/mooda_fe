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

  const prompt = `아래는 사용자와 AI의 대화입니다. 이 대화를 자연스럽고 상세한 이야기체로 요약해주세요.

대화 내용:
${conversationContext}

**요약 작성 규칙 (반드시 준수)**:
1. **최소 80자 이상** 필수
2. **구체적인 내용 3가지 이상 포함**:
   - 사용자가 어떤 상황이나 고민을 이야기했는지 (예: 회사 스트레스, 인간관계, 학업 문제 등)
   - 사용자가 느낀 감정은 무엇인지 (화남, 짜증, 슬픔, 기쁨, 불안 등)
   - ${personaName || 'AI'}가 어떤 반응이나 조언을 줬는지 (구체적 내용 포함)
3. 여러 캐릭터와 대화했다면 모두 언급하기
4. "대화했어요", "이야기 나눴어요" 같은 모호한 표현 금지

**좋은 요약 예시** (반드시 이 수준으로 작성):
- "yy와 처음 인사를 나누고 INFP 성향에 대해 이야기했다가, 무리로 바꿔서 인사하고, 마지막으로 test10와 만나서 ENTP 성향으로 반말로 대화를 시작했어요."
- "회사에서 상사와 다퉈서 화가 났는데, ${
    personaName || 'AI'
  }가 잠시 쉬면서 진정하고, 상황을 정리해서 대화하라고 조언해줬어요."
- "시험 스트레스로 짜증이 났는데, ${
    personaName || 'AI'
  }가 좋아하는 음식 먹으면서 잠깐 쉬라고 위로해줬어요."
- "친구와 싸워서 너무 속상했는데, ${
    personaName || 'AI'
  }가 먼저 사과하고 솔직하게 얘기하라고 격려해줬어요."

**절대 금지**:
- 20자 이하의 짧은 요약 (예: "기분 좋아서 대화했어요")
- 구체적 내용 없이 추상적인 표현만 사용
- 이모지 사용
- AI의 말투("ㅋㅋ", "ㄱㄱ", "아이고" 등) 그대로 사용
- "대화를 나눴어요", "시간을 보냈어요" 같은 모호한 표현

**중요**: 위 대화의 핵심 내용을 읽는 사람이 무슨 일이 있었는지 명확히 알 수 있도록 작성하세요.

요약만 출력하세요 (80자 이상):`;

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
    const hasInappropriate = /(병신|꺼저|ㅅㅂ|시발|개새)/.test(summary);
    const tooVague = /(대화했어요|이야기를 나눴어요|시간을 보냈어요)$/.test(
      summary
    );
    const tooShort = summary.length < 50;

    if (hasInappropriate) {
      console.warn('부적절한 내용 포함, 폴백 사용');
      return generateFallbackSummary(history, personaName);
    }

    if (tooShort || tooVague) {
      console.warn(
        `요약 품질 미달 (짧음: ${tooShort}, 모호함: ${tooVague}), 길이: ${summary.length}자`
      );
      console.warn('생성된 요약:', summary);
      return generateFallbackSummary(history, personaName);
    }

    if (summary.length <= 300) {
      return summary;
    }

    // 너무 긴 경우 잘라내기
    return summary.slice(0, 297) + '...';
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

  // 여러 캐릭터와 대화한 경우 감지
  const systemMessages = history.filter(
    (h) =>
      h.role === 'system' &&
      /^--- 이제부터 .*와 대화를 시작합니다 ---$/.test(h.content)
  );

  if (systemMessages.length >= 2) {
    // 여러 캐릭터와 대화한 경우
    const characterNames = systemMessages
      .map((m) => {
        const match = m.content.match(
          /--- 이제부터 (.*)와 대화를 시작합니다 ---/
        );
        return match ? match[1] : null;
      })
      .filter(Boolean);

    if (characterNames.length >= 2) {
      const firstChar = characterNames[0];
      const lastChar = characterNames[characterNames.length - 1];
      const otherChars = characterNames.slice(1, -1);

      if (otherChars.length > 0) {
        return `${firstChar}와 인사하고, ${otherChars.join(
          ', '
        )}와 대화하다가, 마지막으로 ${lastChar}와 대화를 시작했어요.`;
      } else {
        return `${firstChar}와 인사하고 대화하다가, ${lastChar}로 바꿔서 새로운 대화를 시작했어요.`;
      }
    }
  }

  // 사용자 메시지에서 핵심 키워드 추출
  const allUserText = userMessages.join(' ');

  // 구체적인 상황 키워드 추출 (더 구체적으로)
  let situationText = '';
  let specificDetail = '';

  // 구체적인 직업/상황 추출
  if (/(어린이집|유치원|선생님|교사|보육교사)/.test(allUserText)) {
    specificDetail = '어린이집 선생님이';
  } else if (/(회사원|직장인|사원|직원)/.test(allUserText)) {
    specificDetail = '직장 동료가';
  } else if (/(친구|동기|후배|선배)/.test(allUserText)) {
    specificDetail = '친구가';
  }

  // 시간 표현 추출
  let timeDetail = '';
  if (/(\d+)년/.test(allUserText)) {
    const years = allUserText.match(/(\d+)년/);
    if (years) timeDetail = `${years[1]}년간`;
  } else if (/(\d+)개월/.test(allUserText)) {
    const months = allUserText.match(/(\d+)개월/);
    if (months) timeDetail = `${months[1]}개월간`;
  }

  if (/(퇴사|이직|직장|회사|일|업무)/.test(allUserText)) {
    if (specificDetail && timeDetail) {
      situationText = `${specificDetail} ${timeDetail} 퇴사를 고민해`;
    } else if (specificDetail) {
      situationText = `${specificDetail} 퇴사를 고민해`;
    } else {
      situationText = '직장 관련 고민을';
    }
  } else if (/(친구|다퉜|싸움|관계|인간관계)/.test(allUserText)) {
    situationText = '인간관계 고민을';
  } else if (/(시험|공부|학원|학교|수능)/.test(allUserText)) {
    situationText = '공부 관련 고민을';
  } else if (/(가족|부모|형제|자매)/.test(allUserText)) {
    situationText = '가족 관련 고민을';
  } else if (/(고민|걱정|문제|어려움)/.test(allUserText)) {
    situationText = '고민을';
  }

  // 사용자 감정 분석
  let emotionText = '';
  if (/(개빡|짜증|화|열받|빡)/.test(allUserText)) {
    emotionText = '짜증나서';
  } else if (/(힘들|우울|슬프|외로)/.test(allUserText)) {
    emotionText = '힘들어서';
  } else if (/(갈팡질팡|고민|불안|걱정)/.test(allUserText)) {
    emotionText = '갈팡질팡하거나 고민이 많아서';
  } else if (/(좋|행복|기쁨)/.test(allUserText)) {
    emotionText = '기분 좋아서';
  }

  // AI 조언 키워드 추출
  const allAiText = aiMessages.join(' ');
  let adviceText = '';
  if (/(계획|세우|정리|명확)/.test(allAiText)) {
    adviceText = '구체적인 계획을 세우라고';
  } else if (/(대화|이야기|말|설명)/.test(allAiText)) {
    adviceText = '직접 대화하라고';
  } else if (/(추천|먹|메뉴|음식)/.test(allAiText)) {
    adviceText = '음식을 추천해줬어요';
  } else {
    adviceText = '조언을 해줬어요';
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

  // 상황과 조언이 모두 있는 경우
  if (situationText && adviceText) {
    // "어린이집 선생님이 3년간 퇴사를 고민해" 같은 구체적인 상황이 있는 경우
    if (
      situationText.includes('선생님이') ||
      situationText.includes('동료가') ||
      situationText.includes('친구가')
    ) {
      if (emotionText && emotionText.includes('갈팡질팡')) {
        return `${situationText} 갈팡질팡하자, ${persona}가 ${adviceText} 조언해줬어요.`;
      }
      return `${situationText}, ${persona}가 ${adviceText} 조언해줬어요.`;
    }
    // 일반적인 경우
    if (emotionText) {
      return `오늘 ${emotionText} ${situationText} ${persona}에게 이야기했더니 ${adviceText}.`;
    }
    return `오늘 ${situationText} ${persona}에게 이야기했더니 ${adviceText}.`;
  }

  // 감정만 있는 경우
  if (emotionText) {
    return `오늘은 ${emotionText} ${persona}와 일상 이야기를 나누며 시간을 보냈어요.`;
  }

  // 짧은 인사만 있는 경우
  const totalLength = allUserText.length + allAiText.length;
  if (totalLength < 100 || userMessages.length <= 3) {
    return `${persona}와 간단히 인사하고 첫 대화를 나눴어요.`;
  }

  // 기본값 (최후의 수단)
  const topics = [];
  if (/(인사|안녕|반가)/.test(allUserText)) topics.push('인사');
  if (/(고마|감사)/.test(allUserText)) topics.push('감사 인사');
  if (/(궁금|물어)/.test(allUserText)) topics.push('질문');

  if (topics.length > 0) {
    return `${persona}와 ${topics.join(', ')}를 나누며 대화를 시작했어요.`;
  }

  return `${persona}와 일상 대화를 나누며 하루를 보냈어요.`;
}

// extractRecommendedItems 함수는 기존 코드 그대로 사용
// ==================== 메인 POST 핸들러 ====================

export async function POST(request: NextRequest) {
  try {
    const { testToday, token, targetDate } = (await request
      .json()
      .catch(() => ({}))) as {
      testToday?: boolean;
      token?: string;
      targetDate?: string; // "2025-10-23" 형식
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

    // 날짜 설정 (한국 시간 기준)
    let date: Date;
    if (targetDate) {
      // 특정 날짜 지정 (YYYY-MM-DD 형식) - 한국 시간 기준으로 파싱
      const [year, month, day] = targetDate.split('-').map(Number);
      // 한국 시간 00:00으로 생성
      date = new Date(
        `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
          2,
          '0'
        )}T00:00:00+09:00`
      );
    } else if (testToday) {
      // 테스트 모드면 오늘 (한국 시간 기준)
      const now = new Date();
      const kstDate = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
      );
      const year = kstDate.getFullYear();
      const month = String(kstDate.getMonth() + 1).padStart(2, '0');
      const day = String(kstDate.getDate()).padStart(2, '0');
      date = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
    } else {
      // 기본값: 어제 (한국 시간 기준)
      const now = new Date();
      const kstDate = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
      );
      kstDate.setDate(kstDate.getDate() - 1); // 어제
      const year = kstDate.getFullYear();
      const month = String(kstDate.getMonth() + 1).padStart(2, '0');
      const day = String(kstDate.getDate()).padStart(2, '0');
      date = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
    }

    console.log(
      '분석 대상 날짜 (한국 시간):',
      date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      'UTC:',
      date.toISOString()
    );

    let processed = 0;

    // 각 사용자별 처리
    for (const user of users) {
      try {
        // 해당 날짜의 대화 내역 조회
        const history = await svc.getConversationsByDate(user.id, null, date);
        console.log(
          `사용자 ${user.id}의 ${date.toLocaleDateString('ko-KR')} 대화 개수:`,
          history.length
        );

        if (history.length === 0) {
          console.log(
            `사용자 ${user.id}의 ${date.toLocaleDateString(
              'ko-KR'
            )} 대화가 없어서 건너뜁니다.`
          );
          continue;
        }

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

        console.log(`생성된 요약:`, summary);
        console.log(`감정:`, emotion, emotionKo);

        // 4. DB 저장 (upsert)
        const exist = await svc.getEmotionLogByDate(user.id, date);
        if (exist) {
          console.log(`기존 감정 로그 업데이트 (ID: ${exist.id})`);
          await svc.updateEmotionLog(exist.id, {
            summary: `${emotionKo} 85%`,
            emotion,
            short_summary: summary,
            character_name: characterName,
          });
          console.log(`감정 로그 업데이트 완료`);
        } else {
          console.log(`새 감정 로그 생성`);
          await svc.createEmotionLog({
            id: crypto.randomUUID(),
            userId: user.id,
            date,
            summary: `${emotionKo} 85%`,
            emotion,
            shortSummary: summary,
            characterName,
          });
          console.log(`감정 로그 생성 완료`);
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
