import { Message } from './chat-types';

export const loadConversationHistory = async (
  userId: string
): Promise<Message[]> => {
  try {
    const response = await fetch('/api/socket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get-conversation-history',
        data: { userId },
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return result.conversations;
      }
    }
    return [];
  } catch (error) {
    console.error('대화 기록 불러오기 오류:', error);
    return [];
  }
};

export const sendChatMessage = async (
  message: string,
  userId: string,
  personalityId: string
): Promise<Message | null> => {
  try {
    const response = await fetch('/api/socket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send-message',
        data: {
          message,
          userId,
          personalityId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('메시지 전송 실패');
    }

    const result = await response.json();
    if (result.success) {
      return result.aiResponse;
    }
    return null;
  } catch (error) {
    console.error('메시지 전송 오류:', error);
    return null;
  }
};
