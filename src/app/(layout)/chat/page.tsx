"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  getPersonalityById,
  getPersonalityByIdAsync,
  type AIPersonality,
} from "@/lib/ai-personalities";
import {
  loadConversationHistory,
  sendChatMessage,
  loadConversationHistoryByDate,
} from "@/lib/chat-service";
import type { Message } from "@/lib/chat-types";
import ChatHeader from "@/app/(layout)/chat/components/ChatHeader";
import MessageList from "@/app/(layout)/chat/components/MessageList";
import ChatInput from "@/app/(layout)/chat/components/ChatInput";
import CalendarModal from "@/app/(layout)/chat/components/CalendarModal";
import useUserStore from "@/store/userStore";

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
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastMidnight, setLastMidnight] = useState<Date>(() => new Date());
  const [currentPersonality, setCurrentPersonality] = useState<
    AIPersonality | undefined
  >(getPersonalityById(selectedPersonalityId));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // 성격 로드 로직
  useEffect(() => {
    const loadPersonality = async () => {
      const personality = await getPersonalityByIdAsync(selectedPersonalityId);
      setCurrentPersonality(personality);
    };
    loadPersonality();
  }, [selectedPersonalityId]);

  // 날짜별 대화 로딩 함수 (임시로 로그인 체크 제거)
  const handleDateSelect = async (date: Date) => {
    if (!currentPersonality) return;

    setIsLoading(true);
    setSelectedDate(date);

    try {
      // 임시로 모의 데이터 사용
      const conversations: Message[] = [
        {
          id: "1",
          role: "user",
          content: "안녕하세요!",
          createdAt: date,
        },
        {
          id: "2",
          role: "ai",
          content: "안녕! 오늘 기분은 어때?",
          createdAt: date,
        },
      ];

      if (conversations.length === 0) {
        // 해당 날짜에 대화가 없는 경우
        const noMessageMessage: Message = {
          id: `no-message-${Date.now()}`,
          role: "system",
          content: `--- ${date.toLocaleDateString()}에는 대화 기록이 없습니다 ---`,
          createdAt: date,
        };
        setMessages([noMessageMessage]);
      } else {
        // 날짜 구분선 추가
        const dateMessage: Message = {
          id: `date-${Date.now()}`,
          role: "system",
          content: `--- ${date.toLocaleDateString()} ---`,
          createdAt: date,
        };
        setMessages([dateMessage, ...conversations]);
      }
    } catch (error) {
      console.error("날짜별 대화 로딩 실패:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "system",
        content: "대화 기록을 불러오는데 실패했습니다.",
        createdAt: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 채팅 초기화 로직 (임시로 로그인 체크 제거)
  useEffect(() => {
    if (!currentPersonality) {
      return;
    }

    const initializeChat = async () => {
      setIsLoading(true);
      try {
        // 스토어에서 직접 최신 상태를 조회하여 의존성 문제를 회피합니다.
        const personalityChanged = useUserStore.getState().personalityChanged;

        // 임시로 빈 배열 사용 (로그인 없이 화면만 확인)
        const conversations: Message[] = [];

        if (personalityChanged && currentPersonality) {
          const systemMessage: Message = {
            id: `system_${Date.now()}`,
            role: "system",
            content: `--- 이제부터 ${currentPersonality.name}와 대화를 시작합니다 ---`,
            createdAt: new Date(),
          };
          setMessages([...conversations, systemMessage]);
          ackPersonalityChange(); // 플래그 리셋
        } else if (conversations.length === 0 && currentPersonality) {
          const welcomeMessage: Message = {
            id: String(Date.now()),
            role: "ai",
            content: `안녕! 나는 ${currentPersonality.name}야! ${currentPersonality.shortDescription}`,
            createdAt: new Date(),
          };
          setMessages([welcomeMessage]);
        } else {
          setMessages(conversations);
        }

        // 날짜 선택 상태 초기화
        setSelectedDate(null);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
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
  ]);

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;
    if (!currentPersonality) return;

    const optimisticUserMessage: Message = {
      id: String(Date.now()),
      role: "user",
      content: messageContent,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // 임시로 모의 응답 사용
      const response = {
        success: true,
        userMessage: optimisticUserMessage,
        aiResponse: {
          id: String(Date.now() + 1),
          role: "ai" as const,
          content: "안녕! 메시지를 받았어요!",
          createdAt: new Date(),
        },
      };

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
        console.error("Message send failed, response:", response);
      }
    } catch (error) {
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticUserMessage.id)
      );
      console.error("An error occurred while sending the message:", error);
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
        role: "system",
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
          role: "system",
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
      <ChatHeader
        currentPersonality={currentPersonality || null}
        onDateSelect={handleDateSelect}
        userId="demo-user"
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
      />
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={handleSendMessage}
        isLoading={isLoading}
      />

      {/* 달력 모달 */}
      <CalendarModal
        show={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={handleDateSelect}
        userId="demo-user"
        currentPersonality={currentPersonality || null}
      />
    </div>
  );
}
