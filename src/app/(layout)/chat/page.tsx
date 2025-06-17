"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Send, MoreVertical } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

interface Message {
  id: string;
  text: string;
  sender: "user" | "moo";
  timestamp: Date;
  emotion?: string;
}

export default function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "안녕하세요! 저는 moo예요 🐄 오늘 하루는 어떠셨나요?",
      sender: "moo",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    // AI 응답 시뮬레이션 (나중에 실제 AI API로 교체)
    setTimeout(() => {
      const mooResponses = [
        "그렇군요! 더 자세히 말씀해 주세요 😊",
        "정말 흥미로운 이야기네요! 그때 기분이 어떠셨나요?",
        "이해해요. 그런 상황에서는 그런 감정이 드는 게 자연스러워요 💚",
        "와, 정말 좋은 경험이었겠어요! 기분이 좋아 보여요 ✨",
        "힘든 하루였군요. 괜찮으시다면 더 이야기해 주세요 🤗",
      ];

      const mooMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: mooResponses[Math.floor(Math.random() * mooResponses.length)],
        sender: "moo",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, mooMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - 메신저 스타일 */}
      <div className="bg-white border-b border-stone-200 px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 프로필 정보 */}
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative">
              <Logo size="sm" />

              {/* 온라인 상태 표시 (초록불) */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg">moo</h3>
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
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.sender === "moo" && (
              <div className="flex-shrink-0 mr-3">
                <Logo size="sm" />
              </div>
            )}

            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                message.sender === "user"
                  ? "bg-green-600 text-white rounded-br-md"
                  : "bg-white border border-stone-200 text-gray-800 rounded-bl-md shadow-sm"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === "user" ? "text-green-100" : "text-gray-400"
                }`}
              >
                {message.timestamp.toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-stone-200 px-4 py-2 flex-shrink-0">
        <div className="flex flex-row justify-center items-center gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="moo야, 오늘 있잖아 ..."
              className="w-full px-4 py-2 bg-stone-100 border border-stone-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-sm overflow-y-auto"
              rows={1}
              style={{
                minHeight: "44px",
                maxHeight: "100px",
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="w-9 h-9 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors duration-200"
          >
            <Send size={18} className="text-white ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
