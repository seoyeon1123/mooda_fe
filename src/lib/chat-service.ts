import { Message } from './chat-types';

export interface ChatResponse {
  userMessage: Message;
  aiResponse: Message;
  success: boolean;
  personality: {
    id: string;
    name: string;
    icon: string;
  };
}

export const loadConversationHistory = async (
  userId: string,
  personalityId: string
): Promise<Message[]> => {
  try {
    const response = await fetch(`http://localhost:8080/api/socket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'get-conversation-history',
        data: { userId, personalityId },
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
): Promise<ChatResponse | null> => {
  try {
    // 세션 확인
    const session = await fetch('/api/auth/session');
    if (!session.ok) {
      throw new Error('인증이 필요합니다');
    }

    console.log('Sending message with data:', {
      action: 'send-message',
      data: { message, userId, personalityId },
    });

    const response = await fetch(`http://localhost:8080/api/socket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'send-message',
        data: { message, userId, personalityId },
      }),
    });

    if (!response.ok) {
      console.error(
        'Server response not OK:',
        response.status,
        response.statusText
      );
      let errorMessage = '메시지 전송 실패';
      try {
        const errorResponse = await response.json();
        console.error('Error response:', errorResponse);
        errorMessage = errorResponse.error || errorMessage;
      } catch {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
      }
      throw new Error(errorMessage);
    }

    const result: ChatResponse = await response.json();
    console.log('Server response:', result);

    if (!result.success) {
      console.error('Server indicated failure:', result);
      return null;
    }

    return result;
  } catch (error) {
    console.error('메시지 전송 오류:', error);
    throw error;
  }
};
