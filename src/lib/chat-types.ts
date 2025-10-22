export interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  createdAt: Date;
  userId?: string;
  personalityId?: string | null;
  characterName?: string;
  iconType?: string;
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
