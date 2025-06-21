'use client';

import type { Message } from '@/lib/chat-types';
import { Bot, User } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-start gap-3 ${
            msg.type === 'user' ? 'justify-end' : ''
          }`}
        >
          {msg.type === 'ai' && (
            <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
              <Bot size={20} className="text-green-700" />
            </div>
          )}
          <div
            className={`max-w-[75%] p-3 rounded-lg ${
              msg.type === 'user' ? 'bg-green-600 text-white' : 'bg-white'
            }`}
          >
            <p className="text-sm">{msg.content}</p>
          </div>
          {msg.type === 'user' && (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={20} className="text-gray-600" />
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
            <Bot size={20} className="text-green-700" />
          </div>
          <div className="max-w-[75%] p-3 rounded-lg bg-white">
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="h-2 w-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="h-2 w-2 bg-green-500 rounded-full animate-bounce"></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
