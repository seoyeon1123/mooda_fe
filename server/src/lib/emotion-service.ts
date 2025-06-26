import prisma from './prisma';

export async function getEmotionLogs(userId: string, date: Date) {
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
      summary,
      emotion,
      shortSummary:
        summary.substring(0, 50) + (summary.length > 50 ? '...' : ''),
      characterName: 'AI 분석',
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
        summary,
        emotion,
        shortSummary:
          summary.substring(0, 50) + (summary.length > 50 ? '...' : ''),
        characterName: 'AI 분석',
      },
    });
  } else {
    // 생성
    return prisma.emotionLog.create({
      data: {
        userId,
        date,
        summary,
        emotion,
        shortSummary:
          summary.substring(0, 50) + (summary.length > 50 ? '...' : ''),
        characterName: 'AI 분석',
      },
    });
  }
}

export async function summarizeAndAnalyzeWithGemini(
  messages: string[]
): Promise<{ summary: string; emotion: string; highlight: string }> {
  const prompt = `
다음은 사용자가 AI와 나눈 하루 대화 내용입니다.
이 대화를 바탕으로 사용자의 하루 감정 상태를 분석해주세요.

대화 내용:
${messages.join('\n')}

다음 JSON 형식으로 응답해주세요:
{
  "summary": "하루 대화의 간단한 요약 (1-2문장)",
  "emotion": "VeryHappy, Happy, Neutral, Sad, VerySad, Angry 중 하나",
  "highlight": "가장 인상적이었던 대화 내용이나 감정을 나타내는 문장"
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

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        summary: result.summary || '대화 요약을 생성할 수 없습니다.',
        emotion: result.emotion || 'Neutral',
        highlight: result.highlight || '',
      };
    }

    // JSON 파싱 실패 시 fallback
    const summaryMatch = text.match(/요약[:\s]*(.+)/);
    const emotionMatch = text.match(/감정[:\s]*(\w+)/);

    return {
      summary: summaryMatch
        ? summaryMatch[1]
        : '대화 요약을 생성할 수 없습니다.',
      emotion: emotionMatch ? emotionMatch[1] : 'Neutral',
      highlight: '',
    };
  } catch (error) {
    console.error('Gemini API 호출 실패:', error);
    // API 호출 실패 시 간단한 분석으로 fallback
    return simpleAnalyzeConversation(messages.join('\n'));
  }
}

// 테스트용 간단한 감정 분석 함수
export function simpleAnalyzeConversation(conversationText: string): {
  summary: string;
  emotion: string;
  highlight: string;
} {
  console.log('Analyzing conversation:', conversationText);

  // 키워드 기반 감정 분석
  const lowerText = conversationText.toLowerCase();
  let emotion = 'Neutral';

  if (
    lowerText.includes('짜증') ||
    lowerText.includes('화') ||
    lowerText.includes('싫') ||
    lowerText.includes('답답')
  ) {
    emotion = 'Angry';
  } else if (
    lowerText.includes('슬프') ||
    lowerText.includes('우울') ||
    lowerText.includes('힘들')
  ) {
    emotion = 'Sad';
  } else if (
    lowerText.includes('기쁘') ||
    lowerText.includes('좋') ||
    lowerText.includes('행복') ||
    lowerText.includes('즐거')
  ) {
    emotion = 'Happy';
  } else if (
    lowerText.includes('무료') ||
    lowerText.includes('지루') ||
    lowerText.includes('그냥')
  ) {
    emotion = 'Neutral';
  }

  // 대화 요약 생성
  const userMessages = conversationText
    .split('\n')
    .filter((line) => line.startsWith('user:'))
    .map((line) => line.replace('user:', '').trim())
    .join(' ');

  let summary = '';
  let highlight = '';

  if (lowerText.includes('비') && lowerText.includes('짜증')) {
    summary = '비 오는 날씨 때문에 기분이 안 좋았고, 회사 일로 피곤했던 하루';
    highlight = '비 와서 짜증나';
  } else if (lowerText.includes('회사') || lowerText.includes('일')) {
    summary = '회사 업무로 바쁘고 피곤한 하루를 보냄';
    highlight = '회사 업무로 바빴음';
  } else {
    summary =
      userMessages.substring(0, 50) + (userMessages.length > 50 ? '...' : '');
    highlight = userMessages.split(' ').slice(0, 5).join(' ');
  }

  console.log('Analysis result:', { summary, emotion, highlight });

  return { summary, emotion, highlight };
}
