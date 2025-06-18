"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Send, MoreVertical } from "lucide-react";
import { loadSettings } from "@/lib/settings";
import { getPersonalityById, AIPersonality } from "@/lib/ai-personalities";
import MooIcon from "@/app/(layout)/settings/components/MooIcon";

interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(`user_${Date.now()}`); // 임시 사용자 ID
  const [currentPersonalityId, setCurrentPersonalityId] = useState<string>("");
  const [currentPersonality, setCurrentPersonality] =
    useState<AIPersonality | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastMidnight, setLastMidnight] = useState<Date>(new Date());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversationHistory();
    // 사용자 설정에서 AI 성격 로드
    const settings = loadSettings();
    setCurrentPersonalityId(settings.selectedPersonalityId);
    const personality = getPersonalityById(settings.selectedPersonalityId);
    setCurrentPersonality(personality || null);
  }, []);

  // 설정 변경 감지를 위한 이벤트 리스너
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mooda_ai_settings" && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          setCurrentPersonalityId(newSettings.selectedPersonalityId);
          const personality = getPersonalityById(
            newSettings.selectedPersonalityId
          );
          setCurrentPersonality(personality || null);
        } catch (error) {
          console.error("설정 변경 감지 오류:", error);
        }
      }
    };

    // 로컬 스토리지 변경 이벤트 리스너 추가
    window.addEventListener("storage", handleStorageChange);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const currentMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      if (currentMidnight.getTime() !== lastMidnight.getTime()) {
        setLastMidnight(currentMidnight);
        // 화면만 새로고침 (데이터는 유지)
        window.location.reload();
      }
    };

    const interval = setInterval(checkMidnight, 60000); // 1분마다 체크
    return () => clearInterval(interval);
  }, [lastMidnight]);

  const loadConversationHistory = async () => {
    try {
      const response = await fetch("/api/socket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get-conversation-history",
          data: { userId },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMessages(result.conversations);
        }
      }
    } catch (error) {
      console.error("대화 기록 불러오기 오류:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage("");

    // 1단계: 사용자 메시지를 즉시 화면에 표시
    const userMessage = {
      id: Date.now(),
      type: "user" as const,
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // 2단계: AI 응답 대기 상태 시작
    setIsLoading(true);

    try {
      const response = await fetch("/api/socket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "send-message",
          data: {
            message,
            userId,
            personalityId: currentPersonalityId, // 현재 선택된 AI 성격 전달
          },
        }),
      });

      if (!response.ok) {
        throw new Error("메시지 전송 실패");
      }

      const result = await response.json();

      if (result.success) {
        // 3단계: AI 응답만 추가 (사용자 메시지는 이미 표시됨)
        setMessages((prev) => [...prev, result.aiResponse]);
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      // 에러 메시지 추가
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "ai",
          content: "죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - 메신저 스타일 */}
      <div className="bg-white border-b border-stone-200 px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 프로필 정보 */}
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative">
              {currentPersonality ? (
                <MooIcon type={currentPersonality.iconType} size={40} />
              ) : (
                <MooIcon type="friendly" size={40} />
              )}
              {/* 온라인 상태 표시 (초록불) */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                {currentPersonality && (
                  <>
                    <span className="text-lg font-semibold text-gray-900">
                      {currentPersonality.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 액션 버튼들 */}
          <div className="flex items-center space-x-2">
            <button className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors">
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-lg font-medium mb-2">안녕하세요! 👋</div>
            <div className="text-sm">
              오늘 하루는 어떠셨나요?
              <br />
              기쁜 일이나 걱정되는 일이 있다면 편하게 이야기해주세요.
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-800 shadow-sm border"
              }`}
            >
              <div className="text-sm">{message.content}</div>
              <div
                className={`text-xs mt-1 ${
                  message.type === "user" ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500">
                  AI가 응답을 작성 중...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-stone-200 px-4 py-2 flex-shrink-0">
        <div className="flex flex-row justify-center items-center gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="w-full px-4 py-2 bg-stone-100 border border-stone-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-sm overflow-y-auto"
              rows={1}
              style={{
                minHeight: "44px",
                maxHeight: "100px",
              }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="w-9 h-9 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors duration-200"
          >
            <Send size={18} className="text-white ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
