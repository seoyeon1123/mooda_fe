'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  getPersonalityByIdAsync,
  type AIPersonality,
} from '@/lib/ai-personalities';
import { sendChatMessage, loadConversationHistory } from '@/lib/chat-service';
import type { Message } from '@/lib/chat-types';
import ChatHeader from '@/app/(layout)/chat/components/ChatHeader';
import MessageList from '@/app/(layout)/chat/components/MessageList';
import ChatInput from '@/app/(layout)/chat/components/ChatInput';
import CalendarModal from '@/app/(layout)/chat/components/CalendarModal';
import useUserStore from '@/store/userStore';

export default function ChatTab() {
  const { data: session, status } = useSession();

  // Zustand 상태를 선택적으로 구독하여 불필요한 리렌더링을 방지합니다.
  const selectedPersonalityId = useUserStore(
    (state) => state.selectedPersonalityId
  );
  const isHydrated = useUserStore((state) => state.isHydrated);
  const ackPersonalityChange = useUserStore(
    (state) => state.ackPersonalityChange
  );
  const setChatMessages = useUserStore((state) => state.setChatMessages);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMidnight, setLastMidnight] = useState<Date>(() => new Date());
  const [currentPersonality, setCurrentPersonality] = useState<
    AIPersonality | undefined
  >();
  const [showCalendar, setShowCalendar] = useState(false);
  const [canSendToday, setCanSendToday] = useState(true);

  // 서버 대화 레코드를 화면용 Message로 변환 (타입 안전)
  const toMessage = (conv: {
    id: string;
    role: string;
    content: string;
    created_at?: string;
    createdAt?: string | Date;
  }): Message => {
    const role: Message['role'] =
      conv.role === 'user' ? 'user' : conv.role === 'system' ? 'system' : 'ai';
    return {
      id: conv.id,
      role,
      content: conv.content,
      createdAt: new Date(conv.created_at || conv.createdAt || Date.now()),
    };
  };

  // 디버깅: 하이드레이션 상태와 성격 ID 변경 감지
  useEffect(() => {
    console.log(
      '🔍 하이드레이션 상태:',
      isHydrated,
      '선택된 성격 ID:',
      selectedPersonalityId
    );
  }, [isHydrated, selectedPersonalityId]);

  // 성격 로드 로직 - 하이드레이션 완료 후에만 실행
  useEffect(() => {
    if (!isHydrated) {
      console.log('⏳ 하이드레이션 대기 중...');
      return;
    }
    console.log('✅ 하이드레이션 완료, 성격 로딩 시작:', selectedPersonalityId);
    const loadPersonality = async () => {
      const personality = await getPersonalityByIdAsync(selectedPersonalityId);
      console.log('📍 로드된 성격:', personality?.name);
      setCurrentPersonality(personality);
    };
    loadPersonality();
  }, [isHydrated, selectedPersonalityId]);

  // 날짜별 대화 로딩 함수 (REST API 연동)
  const handleDateSelect = async (date: Date) => {
    if (!currentPersonality || !session?.user?.id) return;

    setIsLoading(true);

    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      // 전송 가능 여부: 선택한 날짜가 오늘인지 확인
      const now = new Date();
      const isToday =
        now.getFullYear() === date.getFullYear() &&
        now.getMonth() === date.getMonth() &&
        now.getDate() === date.getDate();
      setCanSendToday(isToday);

      // REST API 호출
      const res = await fetch(
        `/api/conversations/${session.user.id}/${currentPersonality.id}/${dateString}`
      );
      if (!res.ok) throw new Error('대화 기록 조회 실패');
      const data = await res.json();
      const conversations = data.conversations || [];

      // 콘솔 로그 추가
      console.log('API 응답 data:', data);
      console.log('conversations:', conversations);

      if (conversations.length === 0) {
        const noMessage = {
          id: `no-message-${Date.now()}`,
          role: 'system' as const,
          content: `--- ${date.toLocaleDateString()}에는 대화 기록이 없습니다 ---`,
          createdAt: date,
        };
        setMessages([noMessage]);
        console.log('setMessages (no message):', [noMessage]);
      } else {
        // 서버에서 받은 대화를 화면용 Message로 변환
        const processedConversations: Message[] = conversations.map(toMessage);

        const messagesToSet = [
          {
            id: `date-${Date.now()}`,
            role: 'system' as const,
            content: `--- ${date.toLocaleDateString()} ---`,
            createdAt: date,
          },
          ...processedConversations,
        ];
        setMessages(messagesToSet);
        console.log('setMessages (with conversations):', messagesToSet);
      }
    } catch {
      const errorMsg = {
        id: `error-${Date.now()}`,
        role: 'system' as const,
        content: '대화 기록을 불러오는데 실패했습니다.',
        createdAt: new Date(),
      };
      setMessages([errorMsg]);
      console.log('setMessages (error):', [errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // 채팅 초기화 로직 - 하이드레이션 완료 후에만 실행
  useEffect(() => {
    if (!isHydrated) return;
    if (!currentPersonality || !session?.user?.id) {
      return;
    }

    const initializeChat = async () => {
      setIsLoading(true);
      try {
        const todayHeader: Message = {
          id: `date-${new Date().toISOString()}`,
          role: 'system',
          content: `--- ${new Date().toLocaleDateString()} ---`,
          createdAt: new Date(),
        };
        const withTodayHeader = (msgs: Message[]): Message[] => {
          if (
            msgs.length > 0 &&
            msgs[0].role === 'system' &&
            typeof msgs[0].content === 'string' &&
            msgs[0].content === todayHeader.content
          ) {
            return msgs;
          }
          return [todayHeader, ...msgs];
        };

        // 스토어에서 직접 최신 상태를 조회하여 의존성 문제를 회피합니다.
        const personalityChanged = useUserStore.getState().personalityChanged;

        // 실제 대화 기록을 불러오기
        const conversations = await loadConversationHistory(
          session.user.id,
          currentPersonality.id
        );
        const processedConversations: Message[] = conversations.map(toMessage);

        if (personalityChanged && currentPersonality) {
          const systemMessage: Message = {
            id: `system_${Date.now()}`,
            role: 'system',
            content: `--- 이제부터 ${currentPersonality.name}와 대화를 시작합니다 ---`,
            createdAt: new Date(),
          };
          setMessages(
            withTodayHeader([...processedConversations, systemMessage])
          );
          ackPersonalityChange(); // 플래그 리셋
        } else if (conversations.length === 0 && currentPersonality) {
          const welcomeMessage: Message = {
            id: String(Date.now()),
            role: 'ai',
            content: `안녕! 나는 ${currentPersonality.name}야! ${currentPersonality.shortDescription}`,
            createdAt: new Date(),
          };
          setMessages(withTodayHeader([welcomeMessage]));
        } else {
          setMessages(withTodayHeader(processedConversations));
        }

        // 날짜 선택 상태 초기화
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeChat();
  }, [
    status,
    session,
    selectedPersonalityId,
    currentPersonality,
    ackPersonalityChange,
    isHydrated,
  ]);

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;
    if (!currentPersonality || !session?.user?.id) return;

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
      // 실제 API 호출
      const response = await sendChatMessage(
        messageContent,
        session.user.id,
        currentPersonality.id
      );

      if (response && response.success) {
        console.log('📥 백엔드 응답 데이터:', response);
        console.log('📥 userMessage:', response.userMessage);
        console.log('📥 aiResponse:', response.aiResponse);

        setMessages((prev) => {
          const filtered = prev.filter(
            (msg) => msg.id !== optimisticUserMessage.id
          );

          const toMessage = (
            src: {
              id?: string;
              content?: string;
              created_at?: string;
              createdAt?: string | Date;
            },
            role: 'user' | 'ai'
          ): Message => {
            console.log('🔄 변환 중인 메시지 src:', src);
            const message = {
              id: src.id ?? String(Date.now()),
              role,
              content: src.content ?? '',
              createdAt: new Date(
                src.created_at ?? src.createdAt ?? Date.now()
              ),
            };
            console.log('🔄 변환된 메시지:', message);
            return message;
          };

          const userMsg = toMessage(response.userMessage as Message, 'user');
          const aiMsg = toMessage(response.aiResponse as Message, 'ai');

          return [...filtered, userMsg, aiMsg];
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

  // 메시지가 변경될 때마다 스토어에 저장
  useEffect(() => {
    if (messages.length > 0) {
      const messagesToStore = messages.map((msg) => ({
        ...msg,
        createdAt: msg.createdAt?.toISOString() || new Date().toISOString(),
      }));
      setChatMessages(messagesToStore);
    }
  }, [messages, setChatMessages]);

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <ChatHeader
        currentPersonality={currentPersonality || null}
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
      />
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={handleSendMessage}
        isLoading={isLoading}
        canSendToday={canSendToday}
      />

      {/* 달력 모달 */}
      <CalendarModal
        show={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={handleDateSelect}
        userId={session?.user?.id || ''}
        currentPersonality={currentPersonality || null}
      />
    </div>
  );
}
