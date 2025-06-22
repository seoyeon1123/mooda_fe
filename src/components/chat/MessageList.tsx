'use client';

import type { Message } from '@/lib/chat-types';
import MooIcon from '@/app/(layout)/settings/components/MooIcon';
import { AIPersonality } from '@/lib/ai-personalities';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  personality: AIPersonality | null;
}

export function MessageList({
  messages,
  isLoading,
  personality,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-start gap-3 ${
            msg.role === 'user' ? 'justify-end' : ''
          }`}
        >
          {msg.role === 'ai' && (
            <div className="flex-shrink-0">
              <MooIcon type={personality?.iconType || 'default'} />
            </div>
          )}
          <div
            className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            <p>{msg.content}</p>
          </div>
          {msg.role === 'user' && (
            <div className="flex-shrink-0">
              <MooIcon type="user" />
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <MooIcon type={personality?.iconType || 'default'} />
          </div>
          <div className="max-w-[70%] rounded-2xl px-4 py-2 text-sm bg-gray-200 text-gray-800">
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
