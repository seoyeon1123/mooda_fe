'use client';

import { Send } from 'lucide-react';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (value: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
}

export default function ChatInput({
  inputMessage,
  setInputMessage,
  sendMessage,
  isLoading,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border-t border-stone-200 p-4">
      <div className="flex items-center space-x-2">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 resize-none"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !inputMessage.trim()}
          className="bg-green-600 text-white p-2 rounded-full disabled:bg-green-300"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
