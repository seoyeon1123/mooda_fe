'use client';

import type { AIPersonality } from '@/lib/ai-personalities';
import MooIcon from '@/app/(layout)/settings/components/MooIcon';

interface ChatHeaderProps {
  currentPersonality: AIPersonality | null;
}

export default function ChatHeader({ currentPersonality }: ChatHeaderProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-6 py-4">
      <div className="flex items-center space-x-3">
        {currentPersonality && (
          <>
            <MooIcon type={currentPersonality.iconType} size={32} />
            <h1 className="text-lg font-semibold text-green-700">
              {currentPersonality.name}
            </h1>
          </>
        )}
      </div>
    </div>
  );
}
