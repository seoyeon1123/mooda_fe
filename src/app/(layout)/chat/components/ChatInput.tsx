import { Send } from 'lucide-react';
import type React from 'react';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
}

export default function ChatInput({
  inputMessage,
  setInputMessage,
  sendMessage,
  isLoading,
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
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
              minHeight: '44px',
              maxHeight: '100px',
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
  );
}
