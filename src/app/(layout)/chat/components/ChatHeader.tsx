'use client';

import { Calendar } from 'lucide-react';
import { AIPersonality } from '@/lib/ai-personalities';
import MooIcon from '@/app/(layout)/settings/components/MooIcon';

interface ChatHeaderProps {
  currentPersonality: AIPersonality | null;
  showCalendar: boolean;
  setShowCalendar: (show: boolean) => void;
}

export default function ChatHeader({
  currentPersonality,
  showCalendar,
  setShowCalendar,
}: ChatHeaderProps) {
  return (
    <>
      <div className="relative bg-white border-b border-stone-200 px-4 py-2.5 flex-shrink-0">
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
                  <span className="text-lg font-semibold text-gray-900">
                    {currentPersonality.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 액션 버튼들 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
            >
              <Calendar size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
