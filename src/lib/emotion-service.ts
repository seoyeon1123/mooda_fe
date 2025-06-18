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
        return {
          date: result.date,
          emotion: mapEmotionToType(result.emotion),
          summary: result.summary,
          conversationSummary: result.highlights.join('\n'),
        };
      }
    }
    return null;
  } catch (error) {
    console.error('감정 데이터 로드 오류:', error);
    return null;
  }
};
