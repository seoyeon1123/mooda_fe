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
      },
    });
  }
}

export async function summarizeAndAnalyzeWithGemini(
  messages: string[]
): Promise<{ summary: string; emotion: string }> {
  const prompt = `
아래는 사용자의 하루 대화 내용입니다.
이 대화를 요약하고, 오늘의 기분을 한 단어(예: excited, happy, calm, anxious, sad, angry)로 평가해줘.

대화:
${messages.join('\n')}

[출력 예시]
요약: ...
감정: ...
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
  const summaryMatch = text.match(/요약:\s*(.+)/);
  const emotionMatch = text.match(/감정:\s*(\w+)/);

  return {
    summary: summaryMatch ? summaryMatch[1] : '',
    emotion: emotionMatch ? emotionMatch[1] : 'calm',
  };
}

// 테스트용 간단한 감정 분석 함수
export function simpleAnalyzeConversation(conversationText: string): {
  summary: string;
  emotion: string;
} {
  console.log('Analyzing conversation:', conversationText);

  // 키워드 기반 감정 분석
  const lowerText = conversationText.toLowerCase();
  let emotion = 'calm';

  if (
    lowerText.includes('짜증') ||
    lowerText.includes('화') ||
    lowerText.includes('싫') ||
    lowerText.includes('답답')
  ) {
    emotion = 'angry';
  } else if (
    lowerText.includes('슬프') ||
    lowerText.includes('우울') ||
    lowerText.includes('힘들')
  ) {
    emotion = 'sad';
  } else if (
    lowerText.includes('기쁘') ||
    lowerText.includes('좋') ||
    lowerText.includes('행복') ||
    lowerText.includes('즐거')
  ) {
    emotion = 'happy';
  } else if (
    lowerText.includes('무료') ||
    lowerText.includes('지루') ||
    lowerText.includes('그냥')
  ) {
    emotion = 'soso';
  }

  // 대화 요약 생성
  const userMessages = conversationText
    .split('\n')
    .filter((line) => line.startsWith('user:'))
    .map((line) => line.replace('user:', '').trim())
    .join(' ');

  let summary = '';
  if (lowerText.includes('비') && lowerText.includes('짜증')) {
    summary = '비 오는 날씨 때문에 기분이 안 좋았고, 회사 일로 피곤했던 하루';
  } else if (lowerText.includes('회사') || lowerText.includes('일')) {
    summary = '회사 업무로 바쁘고 피곤한 하루를 보냄';
  } else {
    summary =
      userMessages.substring(0, 50) + (userMessages.length > 50 ? '...' : '');
  }

  console.log('Analysis result:', { summary, emotion });

  return { summary, emotion };
}
