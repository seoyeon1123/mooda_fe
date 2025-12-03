'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  getPersonalityByIdAsync,
  type AIPersonality,
} from '@/lib/ai-personalities';
import {
  sendChatMessage,
  loadConversationHistory,
  loadConversationHistoryByDate,
  addSystemMessage,
} from '@/lib/chat-service';
import { AI_PERSONALITIES } from '@/lib/ai-personalities';
import type { Message } from '@/lib/chat-types';
import ChatHeader from '@/app/(layout)/chat/components/ChatHeader';
import MessageList from '@/app/(layout)/chat/components/MessageList';
import ChatInput from '@/app/(layout)/chat/components/ChatInput';
import CalendarModal from '@/app/(layout)/chat/components/CalendarModal';
import useUserStore from '@/store/userStore';
import ChatLoading from './components/ChatLoading';

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
  const [isLoading, setIsLoading] = useState(true); // 메시지 전송/요청 처리 로딩
  const [isInitializing, setIsInitializing] = useState(true); // 초기/날짜 전환 로딩
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
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
    personality_id?: string | null;
    icon_type?: string | null;
  }): Message => {
    const role: Message['role'] =
      conv.role === 'user' ? 'user' : conv.role === 'system' ? 'system' : 'ai';

    // iconType 결정: 서버에서 온 값 또는 personality_id로 찾기
    let iconType: string | undefined;
    if (conv.icon_type) {
      iconType = conv.icon_type;
    } else if (conv.personality_id) {
      const p = AI_PERSONALITIES.find((x) => x.id === conv.personality_id);
      iconType = p?.iconType;
    }

    return {
      id: conv.id,
      role,
      content: conv.content,
      createdAt: new Date(conv.created_at || conv.createdAt || Date.now()),
      personalityId: conv.personality_id ?? null,
      characterName: getPersonName(conv.personality_id ?? null) || undefined,
      iconType,
    };
  };

  const getPersonName = (pid: string | null): string | null => {
    if (!pid) return null;
    const p = AI_PERSONALITIES.find((x) => x.id === pid);
    return p?.name ?? null;
  };

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
    setIsInitializing(true);

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

      // 오늘 날짜 클릭 시 기본 채팅 페이지로 돌아가기
      if (isToday) {
        // 기본 채팅 초기화 로직 실행
        const todayHeader: Message = {
          id: `date-${new Date().toISOString()}`,
          role: 'system',
          content: `--- ${new Date().toLocaleDateString()} ---`,
          createdAt: new Date(),
        };

        // 실제 대화 기록을 불러오기 (오늘 날짜의 모든 캐릭터 대화)
        const conversations = await loadConversationHistory(
          session.user.id,
          null as unknown as string
        );
        const processedConversations: Message[] = conversations.map(toMessage);

        // 모든 "대화 시작" 시스템 메시지를 제거
        const purifiedConversationsToday: Message[] =
          processedConversations.filter(
            (m) =>
              !(
                m.role === 'system' &&
                typeof m.content === 'string' &&
                /^--- 이제부터 .*와 대화를 시작합니다 ---$/.test(m.content)
              )
          );

        const startMsgContentCurrentToday = currentPersonality
          ? `--- 이제부터 ${currentPersonality.name}와 대화를 시작합니다 ---`
          : '';

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

        if (conversations.length === 0) {
          const welcomeMessage: Message = {
            id: String(Date.now()),
            role: 'ai',
            content: `안녕! 나는 ${currentPersonality.name}야! ${currentPersonality.shortDescription}`,
            createdAt: new Date(),
          };
          setMessages(withTodayHeader([welcomeMessage]));
        } else {
          // 현재 캐릭터의 시작 메시지가 DB에 있으면 추가
          const currentStartMsg = processedConversations.find(
            (m) => m.role === 'system' && m.content === startMsgContentCurrentToday
          );
          
          if (currentStartMsg) {
            setMessages(withTodayHeader([...purifiedConversationsToday, currentStartMsg]));
          } else {
            setMessages(withTodayHeader(purifiedConversationsToday));
          }
        }
        // 오늘 날짜로 복귀 시 전체 로딩 해제
        setIsLoading(false);
        setIsInitializing(false);
        return;
      }

      // 다른 날짜 선택 시 해당 날짜의 대화 (전체 타임라인)
      const conversations = await loadConversationHistoryByDate(
        session.user.id,
        '' as unknown as string,
        new Date(dateString)
      );

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
      setIsInitializing(false);
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
      setIsInitializing(true);
      try {
        // 로컬 맵퍼를 정의하여 외부의 toMessage 의존성을 제거합니다.
        const mapToMessage = (conv: {
          id: string;
          role: string;
          content: string;
          created_at?: string;
          createdAt?: string | Date;
          personality_id?: string | null;
        }): Message => {
          const role: Message['role'] =
            conv.role === 'user'
              ? 'user'
              : conv.role === 'system'
              ? 'system'
              : 'ai';
          return {
            id: conv.id,
            role,
            content: conv.content,
            createdAt: new Date(
              conv.created_at || conv.createdAt || Date.now()
            ),
            personalityId: conv.personality_id ?? null,
            characterName:
              getPersonName(conv.personality_id ?? null) || undefined,
          };
        };

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
        console.log('🔍 채팅 초기화:', {
          personalityChanged,
          currentPersonalityId: currentPersonality.id,
          currentPersonalityName: currentPersonality.name,
        });

        // 실제 대화 기록을 불러오기 (오늘 날짜의 모든 캐릭터 대화)
        const conversations = await loadConversationHistory(
          session.user.id,
          null as unknown as string
        );
        console.log('📚 불러온 대화 개수:', conversations.length);
        const processedConversations: Message[] =
          conversations.map(mapToMessage);

        // 모든 "대화 시작" 시스템 메시지를 제거 (나중에 다시 추가)
        const purifiedConversations: Message[] = processedConversations.filter(
          (m) =>
            !(
              m.role === 'system' &&
              typeof m.content === 'string' &&
              /^--- 이제부터 .*와 대화를 시작합니다 ---$/.test(m.content)
            )
        );
        console.log('🧹 필터링 후 대화 개수:', purifiedConversations.length);
        
        const startMsgContentCurrent = currentPersonality
          ? `--- 이제부터 ${currentPersonality.name}와 대화를 시작합니다 ---`
          : '';

        if (personalityChanged && currentPersonality) {
          console.log('✨ personalityChanged = true, 시스템 메시지 추가 시작');
          const systemMessageContent = `--- 이제부터 ${currentPersonality.name}와 대화를 시작합니다 ---`;

          // DB에 이미 있는지는 원본 conversations에서 체크 (중복 저장 방지)
          const alreadyInDB = processedConversations.some(
            (m) => m.role === 'system' && m.content === systemMessageContent
          );

          let systemMessage: Message;

          if (!alreadyInDB) {
            // DB에 없으면 저장
            try {
              console.log('💾 시스템 메시지 저장 시작:', systemMessageContent);
              const result = await addSystemMessage(
                session.user.id,
                currentPersonality.id,
                systemMessageContent
              );
              if (result) {
                console.log('✅ 시스템 메시지 저장 성공:', result);
                systemMessage = result;
              } else {
                console.error('❌ 시스템 메시지 저장 실패: result가 null');
                systemMessage = {
                  id: `system_${Date.now()}`,
                  role: 'system',
                  content: systemMessageContent,
                  createdAt: new Date(),
                  personalityId: currentPersonality.id,
                };
              }
            } catch (error) {
              console.error('❌ 시스템 메시지 저장 오류:', error);
              systemMessage = {
                id: `system_${Date.now()}`,
                role: 'system',
                content: systemMessageContent,
                createdAt: new Date(),
                personalityId: currentPersonality.id,
              };
            }
          } else {
            console.log('ℹ️ DB에 이미 시스템 메시지 존재, 기존 것 사용');
            // DB에서 불러온 메시지 찾기
            systemMessage = processedConversations.find(
              (m) => m.role === 'system' && m.content === systemMessageContent
            )!;
          }

          // 화면에는 무조건 표시 (purifiedConversations에는 이미 제거됨)
          console.log('🎯 시스템 메시지를 화면에 추가');
          setMessages(
            withTodayHeader([...purifiedConversations, systemMessage])
          );
          ackPersonalityChange(); // 플래그 리셋
        } else if (conversations.length === 0 && currentPersonality) {
          console.log('📭 대화 기록 없음, 환영 메시지 표시');
          const welcomeMessage: Message = {
            id: String(Date.now()),
            role: 'ai',
            content: `안녕! 나는 ${currentPersonality.name}야! ${currentPersonality.shortDescription}`,
            createdAt: new Date(),
          };
          const base = [welcomeMessage];
          setMessages(withTodayHeader(base));
        } else {
          console.log('📖 기존 대화 기록 표시 (personalityChanged = false)');
          // 현재 캐릭터의 시작 메시지가 DB에 있으면 추가
          const currentStartMsg = processedConversations.find(
            (m) => m.role === 'system' && m.content === startMsgContentCurrent
          );
          
          if (currentStartMsg) {
            console.log('✅ 현재 캐릭터 시작 메시지 찾음, 추가');
            setMessages(withTodayHeader([...purifiedConversations, currentStartMsg]));
          } else {
            console.log('ℹ️ 현재 캐릭터 시작 메시지 없음');
            setMessages(withTodayHeader(purifiedConversations));
          }
        }

        // 날짜 선택 상태 초기화
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
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
              personality_id?: string | null;
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
              personalityId:
                src.personality_id ?? currentPersonality?.id ?? null,
              characterName: src.personality_id
                ? getPersonName(src.personality_id) || undefined
                : currentPersonality?.name,
              iconType: currentPersonality?.iconType,
            };
            console.log('🔄 변환된 메시지:', message);
            return message as Message;
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

  // 날짜 변경 감지 및 채팅 초기화
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const todayString = now.toISOString().split('T')[0];

      // 날짜가 바뀌었는지 확인
      if (currentDate !== todayString) {
        console.log('📅 날짜 변경 감지:', currentDate, '->', todayString);

        // 새로운 날짜로 업데이트
        setCurrentDate(todayString);

        // 채팅 완전 초기화
        if (currentPersonality) {
          const welcomeMessage: Message = {
            id: String(Date.now()),
            role: 'ai',
            content: `안녕! 나는 ${currentPersonality.name}야! ${currentPersonality.shortDescription}`,
            createdAt: now,
          };

          const todayHeader: Message = {
            id: `date-${now.toISOString()}`,
            role: 'system',
            content: `--- ${now.toLocaleDateString()} ---`,
            createdAt: now,
          };

          setMessages([todayHeader, welcomeMessage]);
          console.log('🔄 새로운 날짜로 채팅 초기화 완료');
        }
      }
    };

    // 즉시 체크
    checkDateChange();

    // 1분마다 체크
    const timer = setInterval(checkDateChange, 60000);

    return () => clearInterval(timer);
  }, [currentDate, currentPersonality]);

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

  // 세션 로딩, 하이드레이션 대기, 캐릭터 초기화 중일 때 전체 로딩 UI 표시
  if (
    status === 'loading' ||
    !isHydrated ||
    !currentPersonality ||
    isInitializing
  ) {
    return <ChatLoading />;
  }

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <ChatHeader
        currentPersonality={currentPersonality || null}
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
      />
      <MessageList
        messages={messages}
        isLoading={isLoading}
        currentPersonality={currentPersonality}
      />
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
