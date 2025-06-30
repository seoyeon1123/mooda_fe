import type { EmotionData } from './calendar-types';

// Gemini AI의 감정 카테고리를 EmotionData 타입으로 매핑
export const mapEmotionToType = (emotion: string): EmotionData['emotion'] => {
  const mappings: Record<string, EmotionData['emotion']> = {
    VeryHappy: 'excited',
    Happy: 'happy',
    Neutral: 'calm',
    SlightlySad: 'anxious',
    Sad: 'sad',
    VerySad: 'angry',
  };
  return mappings[emotion] || 'calm';
};

// Gemini 감정 결과를 svg 파일명으로 매핑
export const emotionToSvg = (emotion: string): string => {
  const map: Record<string, string> = {
    VeryHappy: 'veryHappy.svg',
    Happy: 'happy.svg',
    Neutral: 'soso.svg',
    SlightlySad: 'sad.svg', // 별도 파일이 있으면 수정
    Sad: 'sad.svg',
    VerySad: 'verySad.svg',
    Angry: 'angry.svg',
    excited: 'veryHappy.svg', // 내부 emotion 타입도 대응
    happy: 'happy.svg',
    calm: 'soso.svg',
    anxious: 'sad.svg',
    sad: 'sad.svg',
    angry: 'verySad.svg',
  };
  return `/images/emotion/${map[emotion] || 'soso.svg'}`;
};

// 감정 데이터 불러오기
export const loadEmotionData = async (
  userId: string
): Promise<EmotionData | null> => {
  try {
    const response = await fetch('/api/socket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'analyze-emotion',
        data: { userId },
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        // highlights가 배열인지 확인하고 안전하게 처리
        let conversationSummary = '';
        if (Array.isArray(result.highlights)) {
          conversationSummary = result.highlights.join('\n');
        } else if (typeof result.highlights === 'string') {
          conversationSummary = result.highlights;
        } else if (result.highlight) {
          // highlight (단수형) 필드가 있는 경우
          conversationSummary = result.highlight;
        }

        return {
          date: result.date,
          emotion: mapEmotionToType(result.emotion),
          summary: result.summary,
          conversationSummary,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('감정 데이터 로드 오류:', error);
    return null;
  }
};

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
    emotion: emotionMatch ? emotionMatch[1] : 'Neutral',
  };
}

// 월별 감정 데이터 불러오기 (캘린더용)
export const loadMonthlyEmotionData = async (
  userId: string,
  year: number,
  month: number
): Promise<EmotionData[]> => {
  try {
    const url = `/api/emotion-logs?userId=${userId}&year=${year}&month=${month}`;
    console.log('🌐 API 호출:', url);

    const response = await fetch(url);

    console.log('📡 API 응답 상태:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('📋 API 응답 데이터:', result);

      if (result.emotionLogs) {
        const mappedData = result.emotionLogs.map(
          (log: {
            date: string;
            emotion: string;
            summary: string;
            shortSummary: string;
            characterName: string;
          }) => ({
            date: new Date(log.date).toISOString().split('T')[0], // YYYY-MM-DD 형식
            emotion: mapEmotionToType(log.emotion),
            summary: log.summary, // 감정 퍼센트
            conversationSummary: log.shortSummary || log.summary, // 대화 요약
            characterName: log.characterName, // 이미지 경로
          })
        );

        console.log('🎯 매핑된 데이터:', mappedData);
        return mappedData;
      }
    } else {
      console.error('❌ API 오류:', response.status, await response.text());
    }
    return [];
  } catch (error) {
    console.error('월별 감정 데이터 로드 오류:', error);
    return [];
  }
};
