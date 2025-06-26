import prisma from './prisma';

export async function getConversations(userId: string, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return prisma.conversation.findMany({
    where: {
      userId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

// Gemini 감정 결과를 svg 파일명으로 매핑
export const emotionToSvg = (emotion: string): string => {
  const map: Record<string, string> = {
    VeryHappy: '/images/emotion/veryHappy.svg',
    Happy: '/images/emotion/happy.svg',
    Neutral: '/images/emotion/soso.svg',
    SlightlySad: '/images/emotion/sad.svg',
    Sad: '/images/emotion/sad.svg',
    VerySad: '/images/emotion/verySad.svg',
    Angry: '/images/emotion/angry.svg',
    excited: '/images/emotion/veryHappy.svg',
    happy: '/images/emotion/happy.svg',
    calm: '/images/emotion/soso.svg',
    anxious: '/images/emotion/sad.svg',
    sad: '/images/emotion/sad.svg',
    angry: '/images/emotion/verySad.svg',
  };
  return map[emotion] || '/images/emotion/soso.svg';
};

// 감정을 퍼센트로 변환
export const emotionToPercentage = (emotion: string): string => {
  const emotionNames: Record<string, string> = {
    VeryHappy: '매우 행복',
    Happy: '행복',
    Neutral: '평온',
    Sad: '슬픔',
    VerySad: '매우 슬픔',
    Angry: '화남',
    excited: '흥분',
    happy: '행복',
    calm: '평온',
    anxious: '불안',
    sad: '슬픔',
    angry: '화남',
  };

  // 80-95% 사이의 랜덤 퍼센트 생성
  const percentage = Math.floor(Math.random() * 16) + 80; // 80-95
  const emotionName = emotionNames[emotion] || '평온';

  return `${emotionName} ${percentage}%`;
};

export async function saveEmotionLog(
  userId: string,
  date: Date,
  summary: string,
  emotion: string
) {
  return prisma.emotionLog.create({
    data: {
      userId,
      date,
      summary: emotionToPercentage(emotion), // 감정 퍼센트
      emotion,
      shortSummary: summary, // 실제 요약 내용
      characterName: emotionToSvg(emotion), // 이미지 경로
    },
  });
}

export async function upsertEmotionLog(
  userId: string,
  date: Date,
  summary: string,
  emotion: string
) {
  // 기존 EmotionLog 확인
  const existing = await prisma.emotionLog.findFirst({
    where: {
      userId,
      date,
    },
  });

  if (existing) {
    // 업데이트
    return prisma.emotionLog.update({
      where: { id: existing.id },
      data: {
        summary: emotionToPercentage(emotion), // 감정 퍼센트
        emotion,
        shortSummary: summary, // 실제 요약 내용
        characterName: emotionToSvg(emotion), // 이미지 경로
      },
    });
  } else {
    // 생성
    return prisma.emotionLog.create({
      data: {
        userId,
        date,
        summary: emotionToPercentage(emotion), // 감정 퍼센트
        emotion,
        shortSummary: summary, // 실제 요약 내용
        characterName: emotionToSvg(emotion), // 이미지 경로
      },
    });
  }
}

export async function summarizeAndAnalyzeWithGemini(
  messages: string[]
): Promise<{ summary: string; emotion: string; highlight: string }> {
  const prompt = `
당신은 사용자의 하루 일상과 감정을 분석하는 전문가입니다.
아래는 사용자가 하루 동안 표현한 생각, 감정, 경험들입니다.

대화 내용:
${messages.join('\n')}

분석 지침:
1. 사용자가 실제로 무엇을 했는지, 어떤 상황에 있었는지에 집중하세요
2. 사용자의 감정 상태와 기분 변화를 파악하세요  
3. 절대로 "AI와 대화", "메뉴 추천을 받았다", "대화를 나눴다" 등의 표현을 사용하지 마세요
4. 사용자가 언급한 실제 활동, 상황, 감정만 언급하세요

올바른 분석 예시:
- "배가 고파서 음식을 고민하며 보낸 하루"
- "회사 업무로 피곤하고 스트레스를 받은 하루" 
- "친구들과 즐거운 시간을 보낸 기분 좋은 하루"

잘못된 분석 예시:
- "AI와 대화를 나눴다"
- "메뉴 추천을 받았다"
- "대화를 통해 무엇을 했다"

다음 JSON 형식으로 응답해주세요:
{
  "summary": "사용자의 실제 하루 일상과 감정 상태 요약 (1-2문장, AI 대화 언급 금지)",
  "emotion": "VeryHappy, Happy, Neutral, Sad, VerySad, Angry 중 하나",
  "highlight": "사용자가 경험한 가장 중요한 감정이나 상황"
}

감정 분류 기준:
- VeryHappy: 매우 기쁘고 즐거운 상태
- Happy: 기분 좋고 긍정적인 상태  
- Neutral: 평범하고 일상적인 상태
- Sad: 슬프거나 우울한 상태
- VerySad: 매우 슬프거나 절망적인 상태
- Angry: 화나거나 짜증나는 상태
`;

  try {
    console.log('🔍 Gemini API 호출 시작...');
    console.log('📝 대화 메시지 수:', messages.length);
    console.log(
      '🔑 API Key 앞 10자:',
      process.env.GEMINI_API_KEY?.substring(0, 10) + '...'
    );

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    console.log('📡 API 응답 상태:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 오류 응답:', errorText);
      throw new Error(`API 호출 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📋 API 응답 데이터:', JSON.stringify(data, null, 2));

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    console.log('🔤 추출된 텍스트:', text);

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      console.log('✅ 파싱된 결과:', result);
      return {
        summary: result.summary || '하루 일상을 보낸 평범한 날',
        emotion: result.emotion || 'Neutral',
        highlight: result.highlight || '',
      };
    }

    // JSON 파싱 실패 시 fallback
    console.log('⚠️ JSON 파싱 실패, fallback 시도...');
    const summaryMatch = text.match(/요약[:\s]*(.+)/);
    const emotionMatch = text.match(/감정[:\s]*(\w+)/);

    return {
      summary: summaryMatch ? summaryMatch[1] : '하루 일상을 보낸 평범한 날',
      emotion: emotionMatch ? emotionMatch[1] : 'Neutral',
      highlight: '',
    };
  } catch (error) {
    console.error('❌ Gemini API 호출 실패:', error);
    console.log('🔄 간단한 분석으로 fallback...');
    // API 호출 실패 시 간단한 분석으로 fallback
    return simpleAnalyzeConversation(messages.join('\n'));
  }
}

// 개선된 간단한 감정 분석 함수
export function simpleAnalyzeConversation(conversationText: string): {
  summary: string;
  emotion: string;
  highlight: string;
} {
  console.log('🔍 Fallback 분석 시작...');

  const lowerText = conversationText.toLowerCase();
  let emotion = 'Neutral';
  let emotionScore = 0;

  // 감정 키워드 점수 계산
  const emotionKeywords = {
    VeryHappy: ['완전', '너무좋', '최고', '대박', '신나', '환상적', '완벽'],
    Happy: ['좋', '기쁘', '행복', '즐거', '만족', '웃', '기분좋', '다행'],
    Neutral: ['그냥', '보통', '평범', '괜찮', '무난'],
    Sad: ['슬프', '우울', '힘들', '아프', '속상', '실망', '걱정'],
    VerySad: ['너무슬', '절망', '포기', '죽고싶', '최악'],
    Angry: ['짜증', '화', '빡', '싫', '답답', '스트레스', '열받', '미치'],
  };

  // 각 감정별 점수 계산
  const scores: Record<string, number> = {};
  for (const [emotionType, keywords] of Object.entries(emotionKeywords)) {
    scores[emotionType] = 0;
    keywords.forEach((keyword) => {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      scores[emotionType] += matches;
    });
  }

  // 가장 높은 점수의 감정 선택
  const maxEmotion = Object.keys(scores).reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );

  if (scores[maxEmotion] > 0) {
    emotion = maxEmotion;
    emotionScore = scores[maxEmotion];
  }

  // 대화 내용 정리
  const messages = conversationText
    .split('\n')
    .filter((line) => line.trim().length > 0);
  const userMessages = messages.filter(
    (line) =>
      !line.toLowerCase().includes('ai') &&
      !line.toLowerCase().includes('assistant')
  );

  // 스마트 요약 생성
  let summary = '';
  let highlight = '';

  if (
    lowerText.includes('비') &&
    (lowerText.includes('기분') || lowerText.includes('우울'))
  ) {
    summary = '비 오는 날씨로 인해 우울한 기분을 느낀 하루';
    highlight = '비 때문에 기분이 안 좋음';
  } else if (
    lowerText.includes('회사') ||
    lowerText.includes('업무') ||
    lowerText.includes('일')
  ) {
    if (emotion === 'Angry' || emotion === 'Sad') {
      summary = '회사 업무로 인한 스트레스와 피로감을 느낀 하루';
      highlight = '업무 스트레스';
    } else {
      summary = '회사 일상과 업무에 대한 대화를 나눈 하루';
      highlight = '일상적인 업무 대화';
    }
  } else if (lowerText.includes('친구') || lowerText.includes('가족')) {
    summary = '주변 사람들과의 관계에 대해 이야기한 하루';
    highlight = '인간관계 대화';
  } else if (lowerText.includes('음식') || lowerText.includes('먹')) {
    summary = '음식과 식사에 관한 대화를 나눈 하루';
    highlight = '음식 관련 대화';
  } else {
    // 일반적인 요약
    const meaningfulMessages = userMessages
      .slice(0, 3)
      .join(' ')
      .substring(0, 80);
    summary =
      meaningfulMessages + (meaningfulMessages.length >= 80 ? '...' : '');
    highlight = userMessages[0]?.substring(0, 30) || '일상 대화';
  }

  console.log(
    `✅ 분석 완료 - 감정: ${emotion} (점수: ${emotionScore}), 요약: ${summary.substring(
      0,
      30
    )}...`
  );

  return {
    summary: summary || '다양한 주제로 대화를 나눈 하루',
    emotion,
    highlight: highlight || '일상 대화',
  };
}
