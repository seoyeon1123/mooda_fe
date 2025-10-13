"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  getPersonalityByIdAsync,
  type AIPersonality,
} from "@/lib/ai-personalities";
import {
  sendChatMessage,
  loadConversationHistory,
  loadConversationHistoryByDate,
  addSystemMessage,
} from "@/lib/chat-service";
import { AI_PERSONALITIES } from "@/lib/ai-personalities";
import type { Message } from "@/lib/chat-types";
import ChatHeader from "@/app/(layout)/chat/components/ChatHeader";
import MessageList from "@/app/(layout)/chat/components/MessageList";
import ChatInput from "@/app/(layout)/chat/components/ChatInput";
import CalendarModal from "@/app/(layout)/chat/components/CalendarModal";
import useUserStore from "@/store/userStore";
import ChatLoading from "./components/ChatLoading";

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
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true); // 메시지 전송/요청 처리 로딩
  const [isInitializing, setIsInitializing] = useState(true); // 초기/날짜 전환 로딩
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
    personality_id?: string | null;
  }): Message => {
    const role: Message["role"] =
      conv.role === "user" ? "user" : conv.role === "system" ? "system" : "ai";
    return {
      id: conv.id,
      role,
      content: conv.content,
      createdAt: new Date(conv.created_at || conv.createdAt || Date.now()),
      personalityId: conv.personality_id ?? null,
      characterName: getPersonName(conv.personality_id ?? null) || undefined,
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
      console.log("⏳ 하이드레이션 대기 중...");
      return;
    }
    console.log("✅ 하이드레이션 완료, 성격 로딩 시작:", selectedPersonalityId);
    const loadPersonality = async () => {
      const personality = await getPersonalityByIdAsync(selectedPersonalityId);
      console.log("📍 로드된 성격:", personality?.name);
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
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
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
          role: "system",
          content: `--- ${new Date().toLocaleDateString()} ---`,
          createdAt: new Date(),
        };

        // 실제 대화 기록을 불러오기 (전체 타임라인: 캐릭터 구분 없이)
        const conversations = await loadConversationHistory(
          session.user.id,
          "" as unknown as string
        );
        const processedConversations: Message[] = conversations.map(toMessage);

        const withTodayHeader = (msgs: Message[]): Message[] => {
          if (
            msgs.length > 0 &&
            msgs[0].role === "system" &&
            typeof msgs[0].content === "string" &&
            msgs[0].content === todayHeader.content
          ) {
            return msgs;
          }
          return [todayHeader, ...msgs];
        };

        const startMsgContent = currentPersonality
          ? `--- 이제부터 ${currentPersonality.name}와 대화를 시작합니다 ---`
          : "";
        const startMsgFromState = messages.find(
          (m) => m.role === "system" && m.content === startMsgContent
        );

        if (conversations.length === 0) {
          const welcomeMessage: Message = {
            id: String(Date.now()),
            role: "ai",
            content: `안녕! 나는 ${currentPersonality.name}야! ${currentPersonality.shortDescription}`,
            createdAt: new Date(),
          };
          const base = [welcomeMessage];
          const merged = startMsgFromState
            ? [...base, startMsgFromState]
            : base;
          setMessages(withTodayHeader(merged));
        } else {
          const alreadyHasStart = processedConversations.some(
            (m) => m.role === "system" && m.content === startMsgContent
          );
          const merged =
            !alreadyHasStart && startMsgFromState
              ? [...processedConversations, startMsgFromState]
              : processedConversations;
          setMessages(withTodayHeader(merged));
        }
        // 오늘 날짜로 복귀 시 전체 로딩 해제
        setIsLoading(false);
        setIsInitializing(false);
        return;
      }

      // 다른 날짜 선택 시 해당 날짜의 대화 (전체 타임라인)
      const conversations = await loadConversationHistoryByDate(
        session.user.id,
        "" as unknown as string,
        new Date(dateString)
      );

      if (conversations.length === 0) {
        const noMessage = {
          id: `no-message-${Date.now()}`,
          role: "system" as const,
          content: `--- ${date.toLocaleDateString()}에는 대화 기록이 없습니다 ---`,
          createdAt: date,
        };
        setMessages([noMessage]);
        console.log("setMessages (no message):", [noMessage]);
      } else {
        // 서버에서 받은 대화를 화면용 Message로 변환
        const processedConversations: Message[] = conversations.map(toMessage);

        const messagesToSet = [
          {
            id: `date-${Date.now()}`,
            role: "system" as const,
            content: `--- ${date.toLocaleDateString()} ---`,
            createdAt: date,
          },
          ...processedConversations,
        ];
        setMessages(messagesToSet);
        console.log("setMessages (with conversations):", messagesToSet);
      }
    } catch {
      const errorMsg = {
        id: `error-${Date.now()}`,
        role: "system" as const,
        content: "대화 기록을 불러오는데 실패했습니다.",
        createdAt: new Date(),
      };
      setMessages([errorMsg]);
      console.log("setMessages (error):", [errorMsg]);
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
          const role: Message["role"] =
            conv.role === "user"
              ? "user"
              : conv.role === "system"
              ? "system"
              : "ai";
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
          role: "system",
          content: `--- ${new Date().toLocaleDateString()} ---`,
          createdAt: new Date(),
        };
        const withTodayHeader = (msgs: Message[]): Message[] => {
          if (
            msgs.length > 0 &&
            msgs[0].role === "system" &&
            typeof msgs[0].content === "string" &&
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
          "" as unknown as string
        );
        const processedConversations: Message[] =
          conversations.map(mapToMessage);

        if (personalityChanged && currentPersonality) {
          const systemMessage: Message = {
            id: `system_${Date.now()}`,
            role: "system",
            content: `--- 이제부터 ${currentPersonality.name}와 대화를 시작합니다 ---`,
            createdAt: new Date(),
          };
          setMessages(
            withTodayHeader([...processedConversations, systemMessage])
          );
          // 이미 오늘 기록에 동일 메시지가 없을 때만 서버 저장
          const alreadyHasStart = processedConversations.some(
            (m) => m.role === "system" && m.content === systemMessage.content
          );
          if (!alreadyHasStart) {
            try {
              await addSystemMessage(
                session.user.id,
                currentPersonality.id,
                systemMessage.content
              );
            } catch {}
          }
          // 로컬에도 오늘 시작 메시지 저장 (새로고침 복구용)
          try {
            const todayKey = new Date().toISOString().split("T")[0];
            if (typeof window !== "undefined") {
              localStorage.setItem(
                `startMsg:${todayKey}`,
                systemMessage.content
              );
            }
          } catch {}
          ackPersonalityChange(); // 플래그 리셋
        } else if (conversations.length === 0 && currentPersonality) {
          const welcomeMessage: Message = {
            id: String(Date.now()),
            role: "ai",
            content: `안녕! 나는 ${currentPersonality.name}야! ${currentPersonality.shortDescription}`,
            createdAt: new Date(),
          };
          const base = [welcomeMessage];
          setMessages(withTodayHeader(base));
        } else {
          const startMsgContent = currentPersonality
            ? `--- 이제부터 ${currentPersonality.name}와 대화를 시작합니다 ---`
            : "";
          const alreadyHasStart = processedConversations.some(
            (m) => m.role === "system" && m.content === startMsgContent
          );
          let merged = processedConversations;
          // 로컬 저장된 시작 메시지가 있는데 서버 기록에 없다면 복구
          try {
            const todayKey = new Date().toISOString().split("T")[0];
            const localStart =
              typeof window !== "undefined"
                ? localStorage.getItem(`startMsg:${todayKey}`)
                : null;
            const hasInMerged = merged.some(
              (m) => m.role === "system" && m.content === localStart
            );
            if (localStart && !hasInMerged && !alreadyHasStart) {
              merged = [
                ...merged,
                {
                  id: `system_${Date.now()}`,
                  role: "system" as const,
                  content: localStart,
                  createdAt: new Date(),
                },
              ];
            }
          } catch {}
          setMessages(withTodayHeader(merged));
        }

        // 날짜 선택 상태 초기화
      } catch (error) {
        console.error("Failed to initialize chat:", error);
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
      role: "user",
      content: messageContent,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // 실제 API 호출
      const response = await sendChatMessage(
        messageContent,
        session.user.id,
        currentPersonality.id
      );

      if (response && response.success) {
        console.log("📥 백엔드 응답 데이터:", response);
        console.log("📥 userMessage:", response.userMessage);
        console.log("📥 aiResponse:", response.aiResponse);

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
            role: "user" | "ai"
          ): Message => {
            console.log("🔄 변환 중인 메시지 src:", src);
            const message = {
              id: src.id ?? String(Date.now()),
              role,
              content: src.content ?? "",
              createdAt: new Date(
                src.created_at ?? src.createdAt ?? Date.now()
              ),
              personalityId:
                src.personality_id ?? currentPersonality?.id ?? null,
              characterName: src.personality_id
                ? getPersonName(src.personality_id) || undefined
                : currentPersonality?.name,
            };
            console.log("🔄 변환된 메시지:", message);
            return message as Message;
          };

          const userMsg = toMessage(response.userMessage as Message, "user");
          const aiMsg = toMessage(response.aiResponse as Message, "ai");

          return [...filtered, userMsg, aiMsg];
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

  // 세션이 로딩 중일 때만 전체 로딩 UI 표시 (초기화 중에는 배너로 처리)
  if (status === "loading") {
    return <ChatLoading />;
  }

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <ChatHeader
        currentPersonality={currentPersonality || null}
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
      />
      {isInitializing ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 text-sm flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>캐릭터 변경으로 대화 초기화 중...</span>
          </div>
        </div>
      ) : (
        <>
          <MessageList messages={messages} isLoading={isLoading} />
          <ChatInput
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            sendMessage={handleSendMessage}
            isLoading={isLoading}
            canSendToday={canSendToday}
          />
        </>
      )}

      {/* 달력 모달 */}
      <CalendarModal
        show={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={handleDateSelect}
        userId={session?.user?.id || ""}
        currentPersonality={currentPersonality || null}
      />
    </div>
  );
}
