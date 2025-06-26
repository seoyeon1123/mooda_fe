export interface EmotionData {
  date: string;
  emotion: 'happy' | 'sad' | 'angry' | 'anxious' | 'calm' | 'excited';
  summary: string;
  conversationSummary: string;
  characterName?: string;
}

export const emotionColors = {
  happy: 'bg-yellow-200 text-yellow-800',
  sad: 'bg-blue-200 text-blue-800',
  angry: 'bg-red-200 text-red-800',
  anxious: 'bg-purple-200 text-purple-800',
  calm: 'bg-green-200 text-green-800',
  excited: 'bg-orange-200 text-orange-800',
} as const;

export const emotionIcons = {
  happy: '/images/happy.svg',
  sad: '/images/sad.svg',
  angry: '/images/angry.svg',
  anxious: '/images/sad.svg',
  calm: '/images/soso.svg',
  excited: '/images/veryHappy.svg',
} as const;

export const emotionLabels = {
  happy: '행복',
  sad: '슬픔',
  angry: '화남',
  anxious: '불안',
  calm: '평온',
  excited: '신남',
} as const;

export const monthNames = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
] as const;
