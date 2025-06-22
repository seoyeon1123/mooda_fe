'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getPersonalityById } from '@/lib/ai-personalities';
import { loadConversationHistory, sendChatMessage } from '@/lib/chat-service';
import type { Message } from '@/lib/chat-types';
import ChatHeader from '@/app/(layout)/chat/components/ChatHeader';
import MessageList from '@/app/(layout)/chat/components/MessageList';
import ChatInput from '@/app/(layout)/chat/components/ChatInput';
import useUserStore from '@/store/userStore';

export default function ChatTab() {
  const { data: session, status } = useSession();

  // Zustand 상태를 선택적으로 구독하여 불필요한 리렌더링을 방지합니다.
  const selectedPersonalityId = useUserStore(
    (state) => state.selectedPersonalityId
  );
  const ackPersonalityChange = useUserStore(
    (state) => state.ackPersonalityChange
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMidnight, setLastMidnight] = useState<Date>(() => new Date());

  const currentPersonality = getPersonalityById(selectedPersonalityId);

  // 채팅 초기화 로직
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    const initializeChat = async () => {
      setIsLoading(true);
      try {
        // 스토어에서 직접 최신 상태를 조회하여 의존성 문제를 회피합니다.
        const personalityChanged = useUserStore.getState().personalityChanged;

        const conversations = await loadConversationHistory(
          session.user.id,
          selectedPersonalityId
        );

        if (personalityChanged && currentPersonality) {
          const systemMessage: Message = {
            id: `system_${Date.now()}`,
            role: 'system',
            content: `--- 이제부터 ${currentPersonality.name}와 대화를 시작합니다 ---`,
            createdAt: new Date(),
          };
          setMessages([...conversations, systemMessage]);
          ackPersonalityChange(); // 플래그 리셋
        } else if (conversations.length === 0 && currentPersonality) {
          const welcomeMessage: Message = {
            id: String(Date.now()),
            role: 'ai',
            content: `안녕! 나는 ${currentPersonality.name}야! ${currentPersonality.shortDescription}`,
            createdAt: new Date(),
          };
          setMessages([welcomeMessage]);
        } else {
          setMessages(conversations);
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeChat();
  }, [status, session, selectedPersonalityId, ackPersonalityChange]);

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;
    if (!session?.user?.id || !currentPersonality) return;

    const optimisticUserMessage: Message = {
      id: String(Date.now()),
      role: 'user',
      content: messageContent,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(
        messageContent,
        session.user.id,
        currentPersonality.id
      );

      if (response && response.success) {
        setMessages((prev) => {
          const filtered = prev.filter(
            (msg) => msg.id !== optimisticUserMessage.id
          );
          return [...filtered, response.userMessage, response.aiResponse];
        });
      } else {
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticUserMessage.id)
        );
        console.error('Message send failed, response:', response);
      }
    } catch (error) {
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticUserMessage.id)
      );
      console.error('An error occurred while sending the message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 자정 체크
  useEffect(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    if (lastMidnight.getTime() < startOfToday.getTime()) {
      const midnightMessage: Message = {
        id: `system_${Date.now()}`,
        role: 'system',
        content: `--- ${now.toLocaleDateString()} ---`,
        createdAt: now,
      };
      setMessages((prev) => [...prev, midnightMessage]);
      setLastMidnight(now);
    }

    const timer = setInterval(() => {
      const newNow = new Date();
      const newStartOfToday = new Date(
        newNow.getFullYear(),
        newNow.getMonth(),
        newNow.getDate()
      );
      if (lastMidnight.getTime() < newStartOfToday.getTime()) {
        const midnightMessage: Message = {
          id: `system_${Date.now()}`,
          role: 'system',
          content: `--- ${newNow.toLocaleDateString()} ---`,
          createdAt: newNow,
        };
        setMessages((prev) => [...prev, midnightMessage]);
        setLastMidnight(newNow);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [lastMidnight]);

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <ChatHeader currentPersonality={currentPersonality || null} />
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
