'use client';

import { Message } from '@/lib/chat-types';
import { useEffect, useRef, useState } from 'react';
import MooIcon from '@/app/(layout)/settings/components/MooIcon';
import {
  getPersonalityById,
  type AIPersonality,
  getPersonalityByIdAsync,
} from '@/lib/ai-personalities';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  currentPersonality?: AIPersonality | null;
}

export default function MessageList({
  messages,
  isLoading,
  currentPersonality,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [personalityCache, setPersonalityCache] = useState<
    Record<string, AIPersonality>
  >({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지의 personalityId들을 모아서 커스텀 AI 정보 가져오기
  useEffect(() => {
    const loadPersonalities = async () => {
      const personalityIds = new Set<string>();
      messages.forEach((msg) => {
        if (msg.personalityId && !getPersonalityById(msg.personalityId)) {
          personalityIds.add(msg.personalityId);
        }
      });

      for (const id of personalityIds) {
        if (!personalityCache[id]) {
          const personality = await getPersonalityByIdAsync(id);
          if (personality) {
            setPersonalityCache((prev) => ({ ...prev, [id]: personality }));
          }
        }
      }
    };

    loadPersonalities();
  }, [messages, personalityCache]);

  // 시간 포맷팅 함수 (유연/안전)
  const formatTime = (value: Date | string | number | undefined | null) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
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
        if (message.role === 'system') {
          return (
            <div
              key={message.id}
              className="text-center text-sm text-gray-500 py-1.5"
            >
              <span>{message.content}</span>
            </div>
          );
        }

        const isUserMessage = message.role === 'user';

        // 아이콘 타입 결정
        let iconType: string = 'friendly';

        // 1. 메시지에 iconType이 저장되어 있으면 그걸 사용 (과거 메시지)
        if (message.iconType) {
          iconType = message.iconType;
        }
        // 2. 메시지에 personalityId가 있으면 해당 성격 찾기
        else if (message.personalityId) {
          // 기본 AI에서 찾기
          const personality = getPersonalityById(message.personalityId);
          if (personality) {
            iconType = personality.iconType;
          }
          // 캐시된 커스텀 AI에서 찾기
          else if (personalityCache[message.personalityId]) {
            iconType = personalityCache[message.personalityId].iconType;
          }
          // 현재 선택된 캐릭터가 이 메시지의 캐릭터와 같으면
          else if (
            currentPersonality &&
            message.personalityId === currentPersonality.id
          ) {
            iconType = currentPersonality.iconType;
          }
        }
        // 3. personalityId가 없으면 현재 선택된 성격 사용
        else if (currentPersonality) {
          iconType = currentPersonality.iconType;
        }

        return (
          <div
            key={message.id}
            className={`flex ${
              isUserMessage ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* AI 메시지인 경우에만 아이콘 표시 */}
            {!isUserMessage && (
              <div className="relative flex-shrink-0 mr-2 self-start">
                <MooIcon
                  type={iconType as AIPersonality['iconType']}
                  size={32}
                />
              </div>
            )}
            <div className="relative">
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 ${
                  isUserMessage
                    ? 'bg-green-600 text-white rounded-2xl rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm border rounded-2xl rounded-tl-sm'
                }`}
              >
                {/* AI 메시지에만 말풍선 꼬리 추가 */}
                {!isUserMessage && (
                  <div
                    className="absolute -left-2 top-2 w-0 h-0 border-t-[10px] border-t-transparent border-r-[10px] border-r-white border-b-[10px] border-b-transparent"
                    style={{
                      filter:
                        'drop-shadow(-1px 0px 0px rgba(229, 231, 235, 1))',
                    }}
                  />
                )}
                <div className="text-sm">{message.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    isUserMessage ? 'text-green-100' : 'text-gray-400'
                  }`}
                >
                  {formatTime(message.createdAt)}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex justify-start">
          <div className="relative flex-shrink-0 mr-2 self-start">
            <MooIcon
              type={currentPersonality?.iconType || 'friendly'}
              size={32}
            />
          </div>
          <div className="relative">
            <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-2xl rounded-tl-sm">
              {/* 말풍선 꼬리 */}
              <div
                className="absolute -left-2 top-2 w-0 h-0 border-t-[10px] border-t-transparent border-r-[10px] border-r-white border-b-[10px] border-b-transparent"
                style={{
                  filter: 'drop-shadow(-1px 0px 0px rgba(229, 231, 235, 1))',
                }}
              />
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
