'use client';

import { useState, useEffect } from 'react';
import { loadSettings } from '@/lib/settings';
import { getPersonalityById, AIPersonality } from '@/lib/ai-personalities';
import { loadConversationHistory, sendChatMessage } from '@/lib/chat-service';
import type { Message } from '@/lib/chat-types';
import ChatHeader from '@/app/(layout)/chat/components/ChatHeader';
import MessageList from '@/app/(layout)/chat/components/MessageList';
import ChatInput from '@/app/(layout)/chat/components/ChatInput';

export default function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(`user_${Date.now()}`);
  const [currentPersonalityId, setCurrentPersonalityId] = useState<string>('');
  const [currentPersonality, setCurrentPersonality] =
    useState<AIPersonality | null>(null);
  const [lastMidnight, setLastMidnight] = useState<Date>(new Date());

  // 초기 데이터 로드
  useEffect(() => {
    const initializeChat = async () => {
      const conversations = await loadConversationHistory(userId);
      setMessages(conversations);

      const settings = loadSettings();
      setCurrentPersonalityId(settings.selectedPersonalityId);
      const personality = getPersonalityById(settings.selectedPersonalityId);
      setCurrentPersonality(personality || null);
    };

    initializeChat();
  }, [userId]);

  // 설정 변경 감지
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mooda_ai_settings' && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          setCurrentPersonalityId(newSettings.selectedPersonalityId);
          const personality = getPersonalityById(
            newSettings.selectedPersonalityId
          );
          setCurrentPersonality(personality || null);
        } catch (error) {
          console.error('설정 변경 감지 오류:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 자정 체크
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const currentMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      if (currentMidnight.getTime() > lastMidnight.getTime()) {
        setLastMidnight(currentMidnight);
        window.location.reload();
      }
    };

    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, [lastMidnight]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');

    const userMessage = {
      id: Date.now(),
      type: 'user' as const,
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);

    try {
      const aiResponse = await sendChatMessage(
        message,
        userId,
        currentPersonalityId
      );

      if (aiResponse) {
        setMessages((prev) => [...prev, aiResponse]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: 'ai',
            content: '죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다.',
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader currentPersonality={currentPersonality} />
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
