export interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  inputMessage: string;
  userId: string;
  currentPersonalityId: string;
  currentPersonality: AIPersonality | null;
  lastMidnight: Date;
}

import { AIPersonality } from './ai-personalities';

export const formatTime = (timestamp: Date) => {
  return new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
