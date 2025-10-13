"use client";

import { Message } from "@/lib/chat-types";
import { useEffect, useRef } from "react";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 시간 포맷팅 함수 (유연/안전)
  const formatTime = (value: Date | string | number | undefined | null) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
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

      {messages.map((message) => {
        if (message.role === "system") {
          return (
            <div
              key={message.id}
              className="text-center text-sm text-gray-500 py-1.5"
            >
              <span>{message.content}</span>
            </div>
          );
        }

        const isUserMessage = message.role === "user";
        return (
          <div
            key={message.id}
            className={`flex ${
              isUserMessage ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isUserMessage
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-800 shadow-sm border"
              }`}
            >
              <div className="text-sm">{message.content}</div>
              <div
                className={`text-xs mt-1 ${
                  isUserMessage ? "text-green-100" : "text-gray-400"
                }`}
              >
                {formatTime(message.createdAt)}
              </div>
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
